import { Router, type IRouter } from "express";
import { store } from "../lib/store";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function requireAdmin(req: any, res: any, next: any) {
  if (!req.session.userId || !store.isAdmin(req.session.userId)) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

router.get("/admin/overview", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  res.json(store.getAdminOverview());
});

router.get("/admin/users", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  res.json(store.getAllUsers());
});

router.post("/admin/users/:userId/toggle", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  try {
    const updated = store.toggleUserActive(String(req.params.userId));
    res.json(updated);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

router.get("/admin/all-trades", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  res.json(store.getAllTrades());
});

router.get("/admin/all-deposits", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  res.json(store.getAllDeposits());
});

router.get("/admin/activation-keys", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  res.json(store.getActivationKeys());
});

router.post("/admin/activation-keys", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { plan = "Standard", expiryDays = 30 } = req.body;
  const key = store.generateActivationKey(plan, Number(expiryDays));
  req.log.info({ plan }, "Activation key generated");
  res.json(key);
});

export default router;
