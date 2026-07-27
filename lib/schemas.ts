import { z } from "zod";

// Shape Gemini is instructed to return. Deliberately excludes inspiration
// links; the model is never trusted to supply URLs. Real links are attached
// afterward from Google Search grounding metadata (see lib/gemini.ts), so
// there is no path by which a fabricated URL can reach the client.
export const itemsByLayerSchema = z.object({
  top: z.string().min(1),
  bottom: z.string().min(1),
  outerwear: z.string().nullable(),
  shoes: z.string().min(1),
  accessories: z.array(z.string().min(1)),
});

// Garment colors for the card's color story bar. Unlike inspirationLinks,
// these come straight from the model. There's no external source of truth
// for "what color is this cardigan" the way there is for a citation URL, so
// the hex format is validated but the color itself is trusted.
export const colorStoryEntrySchema = z.object({
  name: z.string().min(1),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a 6-digit hex color"),
});

export const modelOutfitSchema = z.object({
  title: z.string().min(1),
  occasion: z.string().min(1),
  season: z.string().min(1),
  itemsByLayer: itemsByLayerSchema,
  rationale: z.string().min(1),
  colorStory: z.array(colorStoryEntrySchema).min(3).max(5),
});

export const modelResponseSchema = z.object({
  outfits: z.array(modelOutfitSchema).length(3),
});

export type ModelOutfit = z.infer<typeof modelOutfitSchema>;
export type ModelResponse = z.infer<typeof modelResponseSchema>;

// Final, client-facing shape once real grounding links are attached.
export const inspirationLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

export const finalOutfitSchema = modelOutfitSchema.extend({
  inspirationLinks: z.array(inspirationLinkSchema).max(2),
});

export const finalResponseSchema = z.object({
  outfits: z.array(finalOutfitSchema).length(3),
});

export type ColorStoryEntry = z.infer<typeof colorStoryEntrySchema>;
export type InspirationLink = z.infer<typeof inspirationLinkSchema>;
export type FinalOutfit = z.infer<typeof finalOutfitSchema>;
export type FinalResponse = z.infer<typeof finalResponseSchema>;

// Swipe mode's outfit count is a per-user setting (2-5), so its response
// schema is built per-request rather than fixed like modelResponseSchema
// above (which conversation mode's eventual outfit generation still uses,
// always exactly 3, unaffected by this setting).
export function buildModelSwipeResponseSchema(outfitCount: number) {
  return z.object({ outfits: z.array(modelOutfitSchema).length(outfitCount) });
}
export function buildFinalSwipeResponseSchema(outfitCount: number) {
  return z.object({ outfits: z.array(finalOutfitSchema).length(outfitCount) });
}

// Conversation mode can reply with either a chat-only message (no outfits
// yet) or a finished set of exactly 3 outfits, same shape and count as
// today's response. switchMode lets Outfit MC signal she detected a request
// to switch to swipe mode; only that direction is supported (swipe mode has
// no chat-kind reply to signal the reverse).
export const chatReplySchema = z.object({
  kind: z.literal("chat"),
  message: z.string().min(1),
  switchMode: z.enum(["swipe"]).optional(),
});

// The final ("outfits") branch reuses finalResponseSchema directly once
// links are spliced in (lib/gemini.ts), rather than needing its own tagged
// variant, since it's always the same plain {outfits: [...]} shape the rest
// of the app already expects.
export const modelConversationReplySchema = z.discriminatedUnion("kind", [
  chatReplySchema,
  z.object({ kind: z.literal("outfits"), outfits: z.array(modelOutfitSchema).length(3) }),
]);

export type ChatReply = z.infer<typeof chatReplySchema>;
export type ModelConversationReply = z.infer<typeof modelConversationReplySchema>;

// Settings page preferences (lib/userSettings.ts). Bounds match the four/five
// selectable options the UI offers; nothing outside these is ever valid.
export const chatModeSchema = z.enum(["conversation", "swipe"]);

export const userSettingsInputSchema = z.object({
  preferredChatMode: chatModeSchema,
  swipeCardCount: z.number().int().min(2).max(5),
  chatFollowUpCount: z.number().int().min(1).max(5),
});

export type ChatMode = z.infer<typeof chatModeSchema>;
export type UserSettingsInput = z.infer<typeof userSettingsInputSchema>;

// What you log on the "My closet" section of the profile page. A fixed
// category set (rather than free text) matches the layers outfits are
// already organized by, so a future closet-aware prompt (see README's
// planned v2) can match against it directly.
export const closetCategorySchema = z.enum(["top", "bottom", "outerwear", "shoes", "accessory"]);

export const closetItemInputSchema = z.object({
  category: closetCategorySchema,
  colorName: z.string().trim().min(1).max(40),
  description: z.string().trim().min(1).max(120),
});

export type ClosetCategory = z.infer<typeof closetCategorySchema>;
export type ClosetItemInput = z.infer<typeof closetItemInputSchema>;
