import { Router, type IRouter } from "express";
import { store } from "../lib/store";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/trades", requireAuth, async (req, res): Promise<void> => {
  const userTrades = store.getTrades(req.session.userId!);
  res.json(userTrades);
});

router.get("/trades/stats", requireAuth, async (req, res): Promise<void> => {
  const stats = store.getTradeStats(req.session.userId!);
  res.json(stats);
});

export default router;
