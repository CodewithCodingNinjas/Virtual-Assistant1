import axios from "axios";

// LLM fallback for commands the offline classifier can't resolve confidently.
// Returns the raw model text (JSON is extracted/validated by the caller), or
// null on any failure so the caller can degrade gracefully.
const geminiResponse = async (command, userName, assistantName) => {
  try {
    const apiUrl = process.env.GEMINI_API_URL;
    if (!apiUrl) throw new Error("GEMINI_API_URL is not set");

    const prompt = `You are a voice assistant named "${assistantName}", created by ${userName}.
You are not Google. Interpret the user's natural-language command and reply with ONLY a single JSON object, no extra text, in this exact shape:

{
  "type": "general" | "google-search" | "youtube-search" | "youtube-play" | "get-time" | "get-date" | "get-day" | "get-month" | "calculator-open" | "instagram-open" | "facebook-open" | "weather-show",
  "userInput": "<the user's request, with your name removed; for a search/play request, only the search text>",
  "response": "<a short, voice-friendly reply to read aloud>"
}

Rules:
- "type" is the user's intent. Use "general" for factual/informational questions you can answer briefly.
- For "google-search"/"youtube-search"/"youtube-play", put ONLY the query text in "userInput".
- If asked who created you, answer with ${userName}.
- Respond with the JSON object only — no markdown, no code fences, no commentary.

User command: ${command}`;

    const result = await axios.post(
      apiUrl,
      { contents: [{ parts: [{ text: prompt }] }] },
      { timeout: 10_000 }
    );

    return result?.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch (error) {
    console.log("Gemini API error:", error.message);
    return null;
  }
};

export default geminiResponse;
