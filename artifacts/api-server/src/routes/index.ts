import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import nftRouter from "./nft";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use("/nft", nftRouter);

export default router;
