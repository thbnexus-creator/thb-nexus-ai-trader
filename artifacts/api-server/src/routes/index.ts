import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import marketRouter from "./market";
import botRouter from "./bot";
import mt5Router from "./mt5";
import depositsRouter from "./deposits";
import tradesRouter from "./trades";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(marketRouter);
router.use(botRouter);
router.use(mt5Router);
router.use(depositsRouter);
router.use(tradesRouter);
router.use(adminRouter);

export default router;
