// Safely extract the first balanced JSON object from arbitrary LLM text.
// The model occasionally wraps JSON in prose or code fences, or emits trailing
// tokens. A naive /{[\s\S]*}/ + JSON.parse throws on any of these. This scans for
// a brace-balanced span (string- and escape-aware) and parses defensively.
// Returns the parsed object, or null on failure — callers must handle null.
export function extractJson(text) {
  if (typeof text !== "string") return null;

  // Strip ```json ... ``` fences if present.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const haystack = fenced ? fenced[1] : text;

  const start = haystack.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < haystack.length; i++) {
    const ch = haystack[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const candidate = haystack.slice(start, i + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

// Whitelist of intent types the backend is allowed to act on. Anything else from
// the model is rejected rather than blindly trusted.
export const VALID_INTENTS = new Set([
  "general", "google-search", "youtube-search", "youtube-play",
  "get-time", "get-date", "get-day", "get-month",
  "calculator-open", "instagram-open", "facebook-open", "weather-show",
  "google-open", "youtube-open",
]);

// Validate the shape of a parsed assistant response.
export function isValidAssistantResponse(obj) {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.type === "string" &&
    VALID_INTENTS.has(obj.type) &&
    typeof obj.response === "string"
  );
}

export default extractJson;
