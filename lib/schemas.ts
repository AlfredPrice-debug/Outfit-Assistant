import { z } from "zod";

// Shape Gemini is instructed to return. Deliberately excludes inspiration
// links — the model is never trusted to supply URLs. Real links are attached
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
// these come straight from the model — there's no external source of truth
// for "what color is this cardigan" the way there is for a citation URL — so
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

// A photo attached to one chat turn (e.g. a garment to build outfits around).
// Sent to Gemini as inline image data for that turn only — never persisted,
// since this app has no object storage and the image only matters once.
// ~5.5MB base64 ceiling keeps a single upload from ballooning the request.
export const attachedImageSchema = z.object({
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  data: z.string().min(1).max(7_500_000),
});

export type AttachedImage = z.infer<typeof attachedImageSchema>;
