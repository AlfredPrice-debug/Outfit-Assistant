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

export const modelOutfitSchema = z.object({
  title: z.string().min(1),
  occasion: z.string().min(1),
  season: z.string().min(1),
  itemsByLayer: itemsByLayerSchema,
  rationale: z.string().min(1),
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

export type InspirationLink = z.infer<typeof inspirationLinkSchema>;
export type FinalOutfit = z.infer<typeof finalOutfitSchema>;
export type FinalResponse = z.infer<typeof finalResponseSchema>;
