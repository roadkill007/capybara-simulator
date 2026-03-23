import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ccoRouter from "./cco";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ccoRouter);

export default router;
