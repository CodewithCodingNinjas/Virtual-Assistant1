import User from "../models/user.model.js";
import uploadOnCloudinary from "../config/cloudinary.js";
import geminiResponse from "../gemini.js";
import { response } from "express";
import moment from "moment"; // ✅ fixed typo from 'mpment' to 'moment'

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select("-password"); // exclude password
    if (!user) {
      return res.status(400).json({ message: "user not found" });
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
      {
        assistantName,
        assistantImage,
      },
      { new: true }
    ).select("-password");

    return res.status(200).json(user);
  } catch (error) {
    return res.status(400).json({ message: "updateAssistant error" });
  }
};

export const askToAssistant = async (req, res) => {
  try {
    const { command } = req.body;
    const user = await User.findById(req.userId); // ✅ fixed typo: 'findVyId' → 'findById'
    user.history.push(command)
    user.save()
    const userName = user.name;
    const assistantName = user.assistantName;
    // ✅ Handle instant commands locally (no Gemini delay)
const lowerCommand = command.toLowerCase();

if (lowerCommand.includes("open google")) {
  return res.json({
    type: "google-open",
    userInput: "google",
    response: "Opening Google."
  });
}

if (lowerCommand.includes("open youtube")) {
  return res.json({
    type: "youtube-open",
    userInput: "youtube",
    response: "Opening YouTube."
  });
}

// ✅ For all other commands, still call Gemini
const result = await geminiResponse(command, userName, assistantName);


    const jsonMatch = result.match(/{[\s\S]*}/); // ✅ fixed typo: 'macth' → 'match'
    if (!jsonMatch) {
      return res.status(400).json({ response: "sorry,i can't understand" });
    }

    const gemResult = JSON.parse(jsonMatch[0]);
    const { type } = gemResult; // ✅ fixed destructuring: no longer tries to destructure type from itself

    switch (type) {
      case "get-date":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: `current date is ${moment().format("YYYY-MM-DD")}`, // ✅ fixed format string
        });

      case "get-time":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: `current time is ${moment().format("hh:mm A")}`, // ✅ fixed format string
        });

      case "get-day":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: `today is ${moment().format("dddd")}`, // ✅ fixed format string
        });

      case "get-month":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: `current month is ${moment().format("MMMM")}`, // ✅ fixed format string
        });

      case "google-search":
      case "youtube-search":
      case "youtube-play":
      case "general":
      case "calculator-open":
      case "instagram-open":
      case "facebook-open":
      case "weather-show":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: gemResult.response,
        });

      default:
        return res
          .status(400)
          .json({ response: "I didn't understant that command." }); // ✅ left as-is (typo is yours)
    }
  } catch (error) {
    return res.status(500).json({ response: "ask assistant error" });
  }
};
