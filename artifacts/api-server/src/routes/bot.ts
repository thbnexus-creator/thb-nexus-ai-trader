import { Router, type IRouter } from "express";
import { store } from "../lib/store";
import { requireAuth } from "../middlewares/auth";
import { StartBotBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/bot/status", requireAuth, async (req, res): Promise<void> => {
  const status = store.getBotStatus(req.session.userId!);
  res.json(status);
});

router.post("/bot/start", requireAuth, async (req, res): Promise<void> => {
  const parsed = StartBotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { strategy, riskLevel, symbols, timeframe } = parsed.data;
  const status = store.startBot(
    req.session.userId!,
    strategy,
    riskLevel,
    symbols ?? [],
    timeframe ?? "5min",
  );

  req.log.info({ userId: req.session.userId, strategy, riskLevel, timeframe }, "Bot started");
  res.json(status);
});

router.post("/bot/stop", requireAuth, async (req, res): Promise<void> => {
  const status = store.stopBot(req.session.userId!);
  req.log.info({ userId: req.session.userId }, "Bot stopped");
  res.json(status);
});

export default router;
