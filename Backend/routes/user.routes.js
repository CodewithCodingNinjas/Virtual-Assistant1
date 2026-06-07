import express from "express";
import { getCurrentUser, updateAssitant, askToAssistant } from "../controllers/user.controller.js";
import isAuth from "../middlewares/isAuth.js";
import upload from "../middlewares/multer.js";
import rateLimit from "../middlewares/rateLimit.js";

const userRouter = express.Router();

// The assistant endpoint fans out to a paid LLM API — rate-limit per user.
const assistantLimiter = rateLimit({ windowMs: 60_000, max: 20 });

userRouter.get("/current", isAuth, getCurrentUser);
userRouter.post("/update", isAuth, upload.single("assistantImage"), updateAssitant);
userRouter.post("/asktoassistant", isAuth, assistantLimiter, askToAssistant);

export default userRouter;
