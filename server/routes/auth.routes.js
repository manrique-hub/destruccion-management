import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { login, register } from "../services/auth.service.js";

export const authRouter = Router();

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const user = await login(req.body?.email, req.body?.password);
    res.json({ user });
  })
);

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const user = await register(req.body);
    res.status(201).json({ user });
  })
);
