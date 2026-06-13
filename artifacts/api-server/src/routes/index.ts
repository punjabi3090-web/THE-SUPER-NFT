import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import nftRouter from "./nft";
import setupDbRouter from "./setup-db";
import nowpaymentsRouter from "./nowpayments";
import twofaRouter from "./twofa";
import teamRouter from './team';

const router: IRouter = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/nft", nftRouter);
router.use("/setup-db", setupDbRouter);
router.use("/nowpayments", nowpaymentsRouter);
router.use("/twofa", twofaRouter);
router.use('/team', teamRouter);

export default router;