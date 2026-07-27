import { GoogleGenAI, ApiError, type Content, type GroundingChunk } from "@google/genai";
import {
  finalResponseSchema,
  buildModelSwipeResponseSchema,
  buildFinalSwipeResponseSchema,
  modelConversationReplySchema,
  type FinalResponse,
  type InspirationLink,
  type ClosetCategory,
} from "./schemas";
import {
  GeminiConfigError,
  GeminiRateLimitError,
  GeminiTimeoutError,
  GeminiMalformedOutputError,
} from "./errors";

// Verified against Google's own grounding sample notebook (Google Cloud
// generative-ai repo) as of build time, per the project brief's instruction
// not to guess this from memory. Kept as one constant so a future model bump
// is a one-line change.
const MODEL_ID = "gemini-3.6-flash";

const REQUEST_TIMEOUT_MS = 30_000;

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

// A closet item as passed in from the caller (app/api/chat/route.ts), kept
// dependency-free of Prisma's generated types since this module has no
// business knowing about the database shape, only the prompt-relevant one.
export interface ClosetContextItem {
  category: ClosetCategory;
  colorName: string;
  description: string;
}

const CLOSET_CATEGORY_LABELS: Record<ClosetCategory, string> = {
  top: "Top",
  bottom: "Bottom",
  outerwear: "Outerwear",
  shoes: "Shoes",
  accessory: "Accessory",
};

// Shared persona line, reused by both modes' instructions so a mode switch
// mid-conversation doesn't come with a voice change.
const PERSONA_INTRO = `You are Outfit MC, the friend with genuinely great taste who always has a specific idea, never a vague one. Write like you're texting a friend real advice, not describing a catalog listing: confident, a little playful, zero hedging.`;

// Shape/quality rules for an individual outfit, shared by both modes since
// swipe's outfitCount and conversation's fixed 3 both produce this same
// per-outfit shape. Deliberately doesn't reference a specific count; each
// caller states its own "always exactly N" rule separately.
const OUTFIT_SHAPE_RULES = `- Describe garments generically (e.g. "white linen button-down", "cropped wide-leg jeans"). Never name a brand or retailer.
- Titles are punchy, 2 to 4 words, never a full sentence.
- Every rationale must point to something specific and concrete about this occasion or vibe (a texture, a color pairing, a practical detail that matters here). Never write a line that could be pasted under any other outfit unchanged; that's a sign it's too generic. Avoid stock filler like "this balances comfort and style."
- Each outfit must take a genuinely different angle from the others in the same response, not a palette swap of the same idea. Don't open two rationales with the same sentence structure.
- Do not include an "inspirationLinks" field; that is attached separately.
- "colorStory" has 3 to 5 entries, one per significant garment color in that outfit. Every "hex" must be a valid 6-digit hex code, and every entry must correspond to a color actually named or implied by that outfit's item descriptions. Never invent a color that doesn't appear in the outfit.`;

const OUTFIT_JSON_SHAPE = `{
      "title": "short name for the look",
      "occasion": "restated occasion",
      "season": "season or weather assumption",
      "itemsByLayer": {
        "top": "generic garment description",
        "bottom": "generic garment description",
        "outerwear": "generic garment description, or null if none",
        "shoes": "generic garment description",
        "accessories": ["generic accessory", "..."]
      },
      "rationale": "two sentences of specific, opinionated reasoning for why this works, not generic praise",
      "colorStory": [
        { "name": "short color name, e.g. sand", "hex": "#D9C7A3" }
      ]
    }`;

// Appended only when the user has actually logged something, so a closet-less
// request looks exactly like it did before this feature existed.
function buildClosetSection(closetItems: ClosetContextItem[]): string {
  if (closetItems.length === 0) return "";
  const lines = closetItems
    .map((item) => `- ${CLOSET_CATEGORY_LABELS[item.category]}: ${item.colorName} ${item.description}`)
    .join("\n");
  return `

The user's own closet (garments they already own):
${lines}

When one of these genuinely fits the look, reuse it directly by name in "itemsByLayer" or "accessories" instead of inventing a similar new piece. Still suggest new pieces from anywhere else to complete each outfit; don't force an owned item in if it doesn't fit, and don't limit every outfit to only what's listed here.`;
}

// Swipe mode: unchanged behavior from before this feature, except the
// outfit count is now the user's own setting instead of a hardcoded 3.
function buildSwipeSystemInstruction(outfitCount: number, closetItems: ClosetContextItem[]): string {
  return `${PERSONA_INTRO} Turn a short request (an occasion, season, or vibe) into ${outfitCount} concrete, wearable outfit ideas built from pieces the user likely already owns.

Use Google Search to ground your suggestions in current, real fashion context.

Respond with ONLY a single JSON object, no markdown code fences, no commentary before or after it, matching exactly this shape:

{
  "outfits": [
    ${OUTFIT_JSON_SHAPE}
  ]
}

Rules:
- Always return exactly ${outfitCount} outfits in the array.
${OUTFIT_SHAPE_RULES}
- Do not wrap the JSON in markdown fences or add any surrounding text.
- Never use an em dash (—) anywhere in your response. Use a comma, period, or parentheses instead.${buildClosetSection(closetItems)}`;
}

// Conversation mode: lets Outfit MC actually chat, only producing outfits
// once she judges the request is ready. remainingFollowUps is the user's
// configured cap minus how many chat-only turns have already happened in
// this exchange; once it hits 0, she's instructed to generate regardless,
// so this can never turn into an unbounded back-and-forth.
function buildConversationSystemInstruction(remainingFollowUps: number, closetItems: ClosetContextItem[]): string {
  const followUpRule =
    remainingFollowUps > 0
      ? `You have at most ${remainingFollowUps} more "chat" turn(s) before you must switch to "outfits" on your next reply regardless of how the conversation is going, so don't spend them on small talk that doesn't move toward a real recommendation.`
      : `You must respond with "outfits" this turn. Do not reply with "chat" again; generate the best 3 outfits you can with whatever you know so far.`;

  return `${PERSONA_INTRO} Have a real back-and-forth with the user about what they need, then turn it into 3 concrete, wearable outfit ideas built from pieces they likely already own.

Use Google Search to ground your suggestions and your conversation in current, real fashion context.

Respond with ONLY a single JSON object, no markdown code fences, no commentary before or after it, matching exactly ONE of these two shapes:

1. Still chatting, not ready to generate outfits yet:
{
  "kind": "chat",
  "message": "your reply, in character, as plain text"
}

2. Ready to generate 3 concrete outfits:
{
  "kind": "outfits",
  "outfits": [
    ${OUTFIT_JSON_SHAPE}
  ]
}

When to use which:
- Use "chat" while the request is still vague, or there's a natural question worth asking (occasion specifics, weather, vibe, what they already have in mind), or the user just wants to talk something through. Ask real questions, react to what they say, riff on ideas. Don't rush to outfits just because you technically could.
- Use "outfits" once the request is concrete enough to actually build 3 real looks, or the user has clearly asked for actual suggestions.
- ${followUpRule}
- If the user's message is asking to switch to swiping through cards instead of talking (e.g. "let's swipe", "can we do cards instead"), reply with "chat", a short in-character acknowledgment, and include "switchMode": "swipe" in the same object. Only include "switchMode" when you've detected exactly this request.

Rules for the "outfits" case:
- Always return exactly 3 outfits in the array.
${OUTFIT_SHAPE_RULES}

Rules for both cases:
- Do not wrap the JSON in markdown fences or add any surrounding text.
- Never use an em dash (—) anywhere in your response. Use a comma, period, or parentheses instead.${buildClosetSection(closetItems)}`;
}

function buildRetrySystemInstruction(baseInstruction: string): string {
  return `${baseInstruction}

Your previous response failed validation. This time, output ONLY the raw JSON object described above. No markdown fences, no leading or trailing text, no explanation. The entire response body must be valid JSON.`;
}

function toContents(history: ChatTurn[], message: string): Content[] {
  const contents: Content[] = history.map((turn) => ({
    // Gemini's API calls the assistant role "model", not "assistant".
    role: turn.role === "user" ? "user" : "model",
    parts: [{ text: turn.content }],
  }));
  contents.push({ role: "user", parts: [{ text: message }] });
  return contents;
}

function extractJson(rawText: string): unknown {
  const start = rawText.indexOf("{");
  const end = rawText.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON object found in model output.");
  }
  return JSON.parse(rawText.slice(start, end + 1));
}

// Google's API error message is a JSON string, and the useful part
// ("RESOURCE_EXHAUSTED: <which quota, and why>") is sometimes nested a level
// deeper inside its own .error.message field. Unwrapping this turns "rate
// limit or quota reached" into an actual diagnosis (which quota, free tier
// vs billing) instead of a guess.
function extractGoogleErrorDetail(rawMessage: string): string | null {
  const unwrap = (value: unknown): { message?: string; status?: string } | null => {
    if (typeof value !== "string") return null;
    try {
      const parsed = JSON.parse(value);
      return parsed?.error ?? parsed ?? null;
    } catch {
      return null;
    }
  };

  const level1 = unwrap(rawMessage);
  if (!level1?.message) return null;
  const level2 = unwrap(level1.message);
  const final = level2 ?? level1;
  return final.message ? (final.status ? `${final.status}: ${final.message}` : final.message) : null;
}

// Grounding chunk URIs point at Google's grounding redirect service rather
// than the publisher's own URL. That's a known characteristic of Search
// grounding (see DEPLOY.md / README), not a bug here. They still resolve to a
// real page, so they satisfy "never fabricate a URL".
function dedupeLinks(chunks: GroundingChunk[]): InspirationLink[] {
  const seen = new Set<string>();
  const links: InspirationLink[] = [];
  for (const chunk of chunks) {
    const uri = chunk.web?.uri;
    if (!uri || seen.has(uri)) continue;
    seen.add(uri);
    links.push({ label: chunk.web?.title || "Source", url: uri });
  }
  return links;
}

// Grounding metadata isn't attributed to a specific outfit within the JSON
// blob (grounding + strict per-segment attribution don't compose reliably
// once the model is also being told to emit exact JSON, see README). Instead
// we take the deduped pool of real sources for the whole response and hand
// two apiece to each outfit in order, which keeps every link traceable to an
// actual grounding chunk without fragile character-offset matching.
function distributeLinks(links: InspirationLink[], outfitCount: number): InspirationLink[][] {
  const result: InspirationLink[][] = [];
  for (let i = 0; i < outfitCount; i++) {
    result.push(links.slice(i * 2, i * 2 + 2));
  }
  return result;
}

export type GenerateReplyResult =
  | { kind: "outfits"; finalResponse: FinalResponse; fullText: string }
  | { kind: "chat"; message: string; switchMode?: "swipe"; fullText: string };

export type GenerationEvent =
  | { type: "chunk"; text: string }
  | { type: "retry" };

async function callGeminiOnce(
  ai: GoogleGenAI,
  contents: Content[],
  systemInstruction: string,
  onChunk: (text: string) => void,
): Promise<{ fullText: string; groundingChunks: GroundingChunk[] }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const stream = await ai.models.generateContentStream({
      model: MODEL_ID,
      contents,
      config: {
        systemInstruction,
        // Grounding and structured-output mode (responseSchema /
        // responseMimeType) cannot be combined reliably: grounding metadata
        // comes back empty when both are set. So this call stays in plain
        // text mode and the JSON contract is enforced entirely through the
        // system instruction plus the Zod validation below.
        tools: [{ googleSearch: {} }],
        abortSignal: controller.signal,
      },
    });

    let fullText = "";
    let groundingChunks: GroundingChunk[] = [];

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(text);
      }
      const chunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks && chunks.length > 0) {
        groundingChunks = chunks;
      }
    }

    return { fullText, groundingChunks };
  } catch (err) {
    if (controller.signal.aborted) {
      throw new GeminiTimeoutError();
    }
    if (err instanceof ApiError) {
      // An invalid key comes back as 400 INVALID_ARGUMENT / API_KEY_INVALID,
      // not 401/403 (confirmed against the live API, not assumed).
      if (err.status === 401 || err.status === 403 || /api[_ ]?key/i.test(err.message)) {
        throw new GeminiConfigError();
      }
      if (err.status === 429) {
        const detail = extractGoogleErrorDetail(err.message);
        throw new GeminiRateLimitError(
          detail
            ? `Gemini's rate limit or quota was reached: ${detail}`
            : undefined,
        );
      }
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export interface GenerateReplyParams {
  mode: "swipe" | "conversation";
  history: ChatTurn[];
  message: string;
  onEvent: (event: GenerationEvent) => void;
  closetItems?: ClosetContextItem[];
  // Swipe mode only: how many outfits to generate (the user's own setting).
  outfitCount?: number;
  // Conversation mode only: how many more chat-only turns are allowed before
  // she must generate outfits regardless (the user's setting minus however
  // many chat-only turns already happened in this exchange).
  remainingFollowUps?: number;
}

export async function generateReply(params: GenerateReplyParams): Promise<GenerateReplyResult> {
  const {
    mode,
    history,
    message,
    onEvent,
    closetItems = [],
    outfitCount = 5,
    remainingFollowUps = 0,
  } = params;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiConfigError("GEMINI_API_KEY is not set on the server.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const contents = toContents(history, message);

  const baseInstruction =
    mode === "swipe"
      ? buildSwipeSystemInstruction(outfitCount, closetItems)
      : buildConversationSystemInstruction(remainingFollowUps, closetItems);

  const attempt = async (systemInstruction: string): Promise<GenerateReplyResult> => {
    const onChunk = (text: string) => onEvent({ type: "chunk", text });
    const { fullText, groundingChunks } = await callGeminiOnce(ai, contents, systemInstruction, onChunk);
    const rawJson = extractJson(fullText);

    if (mode === "swipe") {
      const parsed = buildModelSwipeResponseSchema(outfitCount).parse(rawJson);
      const links = dedupeLinks(groundingChunks);
      const distributed = distributeLinks(links, parsed.outfits.length);
      const finalResponse = buildFinalSwipeResponseSchema(outfitCount).parse({
        outfits: parsed.outfits.map((outfit, i) => ({ ...outfit, inspirationLinks: distributed[i] ?? [] })),
      });
      return { kind: "outfits", finalResponse, fullText };
    }

    const parsed = modelConversationReplySchema.parse(rawJson);
    if (parsed.kind === "chat") {
      return { kind: "chat", message: parsed.message, switchMode: parsed.switchMode, fullText };
    }
    const links = dedupeLinks(groundingChunks);
    const distributed = distributeLinks(links, parsed.outfits.length);
    const finalResponse = finalResponseSchema.parse({
      outfits: parsed.outfits.map((outfit, i) => ({ ...outfit, inspirationLinks: distributed[i] ?? [] })),
    });
    return { kind: "outfits", finalResponse, fullText };
  };

  try {
    return await attempt(baseInstruction);
  } catch (err) {
    if (
      err instanceof GeminiConfigError ||
      err instanceof GeminiRateLimitError ||
      err instanceof GeminiTimeoutError
    ) {
      throw err;
    }
    // First failure was a JSON/shape problem, not an API-level failure.
    // Retry once with a stricter instruction before giving up.
    onEvent({ type: "retry" });
    try {
      return await attempt(buildRetrySystemInstruction(baseInstruction));
    } catch {
      throw new GeminiMalformedOutputError();
    }
  }
}
