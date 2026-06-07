import User from "../models/user.model.js";
import uploadOnCloudinary from "../config/cloudinary.js";
import geminiResponse from "../gemini.js";
import moment from "moment";
import { getClassifier } from "../ml/intentClassifier.js";
import { extractJson, isValidAssistantResponse } from "../utils/extractJson.js";

// Confidence threshold above which we trust the offline classifier and skip the
// LLM entirely. Tuned from cross-validation (see docs/ML_METRICS.md). Below this
// we fall back to Gemini for the harder / open-ended cases.
const OFFLINE_CONFIDENCE_THRESHOLD = 0.75;

// Intents the offline path can fully resolve without any LLM round-trip.
// "general" is intentionally excluded — it needs the LLM to actually answer.
const OFFLINE_ANSWERABLE = new Set([
  "get-time", "get-date", "get-day", "get-month",
  "calculator-open", "instagram-open", "facebook-open", "weather-show",
  "google-open", "youtube-open", "google-search", "youtube-search", "youtube-play",
]);

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "get current user error" });
  }
};

export const updateAssitant = async (req, res) => {
  try {
    const { assistantName, imageUrl } = req.body;
    let assistantImage;

    if (req.file) {
      assistantImage = await uploadOnCloudinary(req.file.path);
    } else {
      assistantImage = imageUrl;
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { assistantName, assistantImage },
      { new: true }
    ).select("-password");

    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "updateAssistant error" });
  }
};

// Build the final, server-authoritative response for a resolved intent.
// Date/time/day/month are computed on the server (never trusted to the model),
// and userInput is normalized for search/play intents.
function resolveIntent(type, userInput, spokenResponse) {
  switch (type) {
    case "get-date":
      return { type, userInput, response: `current date is ${moment().format("YYYY-MM-DD")}` };
    case "get-time":
      return { type, userInput, response: `current time is ${moment().format("hh:mm A")}` };
    case "get-day":
      return { type, userInput, response: `today is ${moment().format("dddd")}` };
    case "get-month":
      return { type, userInput, response: `current month is ${moment().format("MMMM")}` };
    default:
      return { type, userInput, response: spokenResponse };
  }
}

// Short, deterministic spoken phrases for the offline path (no LLM available).
function offlineSpokenResponse(type, userInput) {
  switch (type) {
    case "google-open": return "Opening Google.";
    case "youtube-open": return "Opening YouTube.";
    case "google-search": return "Here is what I found on Google.";
    case "youtube-search": return `Here are the YouTube results for ${userInput}.`;
    case "youtube-play": return `Playing ${userInput} now.`;
    case "calculator-open": return "Opening the calculator.";
    case "instagram-open": return "Opening Instagram.";
    case "facebook-open": return "Opening Facebook.";
    case "weather-show": return "Showing the weather.";
    default: return "Sure.";
  }
}

export const askToAssistant = async (req, res) => {
  try {
    const { command } = req.body;

    // Boundary validation: this field is forwarded to a paid LLM API.
    if (typeof command !== "string" || command.trim().length === 0) {
      return res.status(400).json({ response: "command is required" });
    }
    if (command.length > 500) {
      return res.status(400).json({ response: "command is too long" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ response: "user not found" });
    }

    user.history.push(command);
    await user.save();

    const userName = user.name;
    const assistantName = user.assistantName;

    // --- Stage 1: offline ML intent classifier (fast, private, network-free) ---
    const prediction = getClassifier().predict(command);
    if (
      prediction.confidence >= OFFLINE_CONFIDENCE_THRESHOLD &&
      OFFLINE_ANSWERABLE.has(prediction.label)
    ) {
      const userInput = command.replace(new RegExp(assistantName || "", "ig"), "").trim() || command;
      const spoken = offlineSpokenResponse(prediction.label, userInput);
      return res.json({ ...resolveIntent(prediction.label, userInput, spoken), source: "offline" });
    }

    // --- Stage 2: LLM fallback for low-confidence / open-ended commands ---
    const result = await geminiResponse(command, userName, assistantName);
    if (!result) {
      return res.status(502).json({ response: "assistant service is temporarily unavailable" });
    }

    const gemResult = extractJson(result);
    if (!isValidAssistantResponse(gemResult)) {
      return res.status(422).json({ response: "sorry, I couldn't understand that" });
    }

    return res.json({ ...resolveIntent(gemResult.type, gemResult.userInput, gemResult.response), source: "llm" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ response: "ask assistant error" });
  }
};
