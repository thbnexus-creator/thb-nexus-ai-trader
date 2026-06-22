import { Router, type IRouter } from "express";
import { store } from "../lib/store";
import { requireAuth } from "../middlewares/auth";
import { CreateDepositBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/deposits", requireAuth, async (req, res): Promise<void> => {
  const userDeposits = store.getDeposits(req.session.userId!);
  res.json(userDeposits);
});

router.post("/deposits", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateDepositBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { amount, txHash } = parsed.data;
  const deposit = store.createDeposit(req.session.userId!, amount, txHash ?? null);

  req.log.info({ userId: req.session.userId, amount }, "Deposit created");

  res.status(201).json(deposit);
});

router.get("/deposits/balance", requireAuth, async (req, res): Promise<void> => {
  const balance = store.getBalance(req.session.userId!);
  res.json(balance);
});

export default router;
