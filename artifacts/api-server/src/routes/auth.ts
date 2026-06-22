import { Router, type IRouter } from "express";
import { store } from "../lib/store";
import { requireAuth } from "../middlewares/auth";
import {
  RegisterBody,
  VerifyOtpBody,
  LoginBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password, name } = parsed.data;

  const existing = store.findUserByEmail(email);
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const user = store.createUser(email, password, name);

  req.log.info({ email: user.email, otp: user.otp }, "OTP generated for new registration");

  res.status(201).json({
    message: "Registration successful. Check console for your OTP (email simulation).",
    email: user.email,
  });
});

router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, otp } = parsed.data;

  const verified = store.verifyUserOtp(email, otp);
  if (!verified) {
    res.status(400).json({ error: "Invalid or expired OTP" });
    return;
  }

  const user = store.findUserByEmail(email)!;
  req.session.userId = user.id;

  store.seedTrades(user.id);

  res.json({
    user: store.getPublicUser(user),
    message: "Account verified and activated",
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const user = store.findUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (!user.isVerified) {
    res.status(403).json({ error: "Account not verified. Please verify your OTP first." });
    return;
  }

  if (!store.checkPassword(user, password)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  req.session.userId = user.id;

  store.seedTrades(user.id);

  res.json({
    user: store.getPublicUser(user),
    message: "Login successful",
  });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => {});
  res.json({ success: true, message: "Logged out successfully" });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const user = store.findUserById(req.session.userId!)!;
  res.json(store.getPublicUser(user));
});

export default router;
