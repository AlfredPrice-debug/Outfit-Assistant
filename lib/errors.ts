// Typed failure states for the Gemini call, so the chat route can map each
// one to a specific, readable message instead of a generic "something went
// wrong". See app/api/chat/route.ts for where these are caught.
export class GeminiConfigError extends Error {
  constructor(message = "The Gemini API key is missing or invalid.") {
    super(message);
    this.name = "GeminiConfigError";
  }
}

export class GeminiRateLimitError extends Error {
  constructor(message = "Gemini's rate limit or quota was reached. Try again in a moment.") {
    super(message);
    this.name = "GeminiRateLimitError";
  }
}

export class GeminiTimeoutError extends Error {
  constructor(message = "The request to Gemini timed out.") {
    super(message);
    this.name = "GeminiTimeoutError";
  }
}

export class GeminiMalformedOutputError extends Error {
  constructor(message = "Gemini returned a response we couldn't parse, even after a retry.") {
    super(message);
    this.name = "GeminiMalformedOutputError";
  }
}
