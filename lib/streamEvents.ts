import type { OutfitWithId } from "./apiTypes";

// Newline-delimited JSON events sent by POST /api/chat. Plain NDJSON over a
// streaming Response, rather than SSE or a client library, keeps the wire
// format readable with nothing more than response.body.getReader().
export type ChatStreamEvent =
  | { type: "chunk"; text: string }
  | { type: "retry" }
  | { type: "warning"; message: string }
  | { type: "result"; outfits: OutfitWithId[] }
  | { type: "error"; message: string };
