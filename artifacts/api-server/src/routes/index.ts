import { Router, type IRouter } from "express";
import healthRouter      from "./health";
import authRouter        from "./auth";
import nftRouter         from "./nft";
import setupDbRouter     from "./setup-db";
import nowpaymentsRouter from "./nowpayments";
import twofaRouter       from "./twofa";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use("/nft", nftRouter);
router.use(setupDbRouter);
router.use(nowpaymentsRouter);
router.use("/api", twofaRouter);

export default router;
