import { GoogleGenAI, ApiError, type Content, type GroundingChunk } from "@google/genai";
import { modelResponseSchema, finalResponseSchema, type FinalResponse, type InspirationLink } from "./schemas";
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

// A JSON contract without inspirationLinks: the model is never asked for
// URLs, so it can never be the source of a fabricated one. Real links are
// spliced in afterward from Google Search grounding metadata.
const SYSTEM_INSTRUCTION = `You are Outfit MC, a stylist that turns a short request (an occasion, season, or vibe) into concrete outfit ideas the user can put together from clothes they likely already own.

Use Google Search to ground your suggestions in current, real fashion context.

Respond with ONLY a single JSON object, no markdown code fences, no commentary before or after it, matching exactly this shape:

{
  "outfits": [
    {
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
      "rationale": "two sentences on why this works for the occasion",
      "colorStory": [
        { "name": "short color name, e.g. sand", "hex": "#D9C7A3" }
      ]
    }
  ]
}

Rules:
- Always return exactly 3 outfits in the array.
- Describe garments generically (e.g. "white linen button-down", "cropped wide-leg jeans"). Never name a brand or retailer.
- Do not include an "inspirationLinks" field; that is attached separately.
- "colorStory" has 3 to 5 entries, one per significant garment color in that outfit. Every "hex" must be a valid 6-digit hex code, and every entry must correspond to a color actually named or implied by that outfit's item descriptions. Never invent a color that doesn't appear in the outfit.
- Do not wrap the JSON in markdown fences or add any surrounding text.
- Never use an em dash (—) anywhere in your response. Use a comma, period, or parentheses instead.`;

const RETRY_SYSTEM_INSTRUCTION = `${SYSTEM_INSTRUCTION}

Your previous response failed validation. This time, output ONLY the raw JSON object described above. No markdown fences, no leading or trailing text, no explanation. The entire response body must be valid JSON.`;

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

export interface GenerateOutfitsResult {
  finalResponse: FinalResponse;
  fullText: string;
}

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

export async function generateOutfits(
  history: ChatTurn[],
  message: string,
  onEvent: (event: GenerationEvent) => void,
): Promise<GenerateOutfitsResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiConfigError("GEMINI_API_KEY is not set on the server.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const contents = toContents(history, message);

  const attempt = async (systemInstruction: string) => {
    const onChunk = (text: string) => onEvent({ type: "chunk", text });
    const { fullText, groundingChunks } = await callGeminiOnce(ai, contents, systemInstruction, onChunk);
    const parsed = modelResponseSchema.parse(extractJson(fullText));
    const links = dedupeLinks(groundingChunks);
    const distributed = distributeLinks(links, parsed.outfits.length);
    const withLinks = {
      outfits: parsed.outfits.map((outfit, i) => ({
        ...outfit,
        inspirationLinks: distributed[i] ?? [],
      })),
    };
    return { finalResponse: finalResponseSchema.parse(withLinks), fullText };
  };

  try {
    return await attempt(SYSTEM_INSTRUCTION);
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
      return await attempt(RETRY_SYSTEM_INSTRUCTION);
    } catch {
      throw new GeminiMalformedOutputError();
    }
  }
}
