import type { FinalOutfit } from "./schemas";

// Shared between server routes and client components. Kept dependency-free
// (no Prisma, no @google/genai) so it's safe to import from "use client"
// files without pulling server-only code into the browser bundle.
export type OutfitWithId = FinalOutfit & { id: string; isSaved: boolean };

export interface ChatHistoryMessage {
  id: string;
  role: "user" | "assistant";
  createdAt: string;
  content: string | null;
  outfits: OutfitWithId[] | null;
}
