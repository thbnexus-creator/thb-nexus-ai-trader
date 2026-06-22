import { Router, type IRouter } from "express";
import { store } from "../lib/store";
import { requireAuth } from "../middlewares/auth";
import { SaveMt5ConnectionBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/mt5/connection", requireAuth, async (req, res): Promise<void> => {
  const conn = store.getMt5Connection(req.session.userId!);
  res.json({
    isConnected: conn.isConnected,
    brokerName: conn.brokerName,
    loginId: conn.loginId,
    server: conn.server,
    bridgeRunning: conn.bridgeRunning,
    connectedAt: conn.connectedAt,
    status: conn.status,
  });
});

router.post("/mt5/connection", requireAuth, async (req, res): Promise<void> => {
  const parsed = SaveMt5ConnectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { brokerName, loginId, password, server } = parsed.data;
  const conn = store.saveMt5Connection(req.session.userId!, brokerName, loginId, password, server);

  req.log.info({ userId: req.session.userId, brokerName, server }, "MT5 connection saved");

  res.json({
    isConnected: conn.isConnected,
    brokerName: conn.brokerName,
    loginId: conn.loginId,
    server: conn.server,
    bridgeRunning: conn.bridgeRunning,
    connectedAt: conn.connectedAt,
    status: conn.status,
  });
});

router.post("/mt5/start-bridge", requireAuth, async (req, res): Promise<void> => {
  const conn = store.startMt5Bridge(req.session.userId!);

  req.log.info({ userId: req.session.userId }, "MT5 bridge start requested");

  res.json({
    isConnected: conn.isConnected,
    brokerName: conn.brokerName,
    loginId: conn.loginId,
    server: conn.server,
    bridgeRunning: conn.bridgeRunning,
    connectedAt: conn.connectedAt,
    status: conn.status,
  });
});

export default router;
