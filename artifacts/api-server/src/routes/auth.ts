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
    res.status(400).json({ error: "Invalid request: " + parsed.error.issues[0]?.message });
    return;
  }

  const { email, password, name } = parsed.data;

  const existing = store.findUserByEmail(email);
  if (existing && existing.isVerified) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  if (existing && !existing.isVerified) {
    const refreshed = store.refreshOtp(email);
    req.log.info({ email, otp: refreshed.otp }, "OTP refreshed for existing unverified user");
    res.status(201).json({
      message: "OTP refreshed. Check the OTP below.",
      email: refreshed.email,
      otpPreview: refreshed.otp,
    });
    return;
  }

  const user = store.createUser(email, password, name);
  req.log.info({ email: user.email, otp: user.otp }, "New user registered, OTP generated");

  res.status(201).json({
    message: "Registration successful.",
    email: user.email,
    otpPreview: user.otp,
  });
});

router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const { email, otp } = parsed.data;

  const verified = store.verifyUserOtp(email, otp);
  if (!verified) {
    res.status(400).json({ error: "Invalid or expired OTP. Check the code and try again." });
    return;
  }

  const user = store.findUserByEmail(email)!;
  await new Promise<void>((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  req.session.userId = user.id;

  store.seedTrades(user.id);
  store.seedDeposits(user.id);

  res.json({
    user: store.getPublicUser(user),
    message: "Account verified and activated",
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const { email, password } = parsed.data;

  const user = store.findUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (!user.isVerified) {
    res.status(403).json({ error: "Account not verified. Please check your OTP." });
    return;
  }

  if (!store.checkPassword(user, password)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  await new Promise<void>((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  req.session.userId = user.id;

  store.seedTrades(user.id);
  store.seedDeposits(user.id);

  req.log.info({ userId: user.id }, "User logged in");

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

router.get("/auth/otp", async (req, res): Promise<void> => {
  const email = (req.query.email as string)?.toLowerCase();
  if (!email) {
    res.status(400).json({ error: "Email required" });
    return;
  }
  const user = store.findUserByEmail(email);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (user.isVerified) {
    res.status(400).json({ error: "User already verified" });
    return;
  }
  res.json({ otp: user.otp, expiresAt: user.otpExpiresAt });
});

export default router;
