import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/setup-db", async (_req, res): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query(`SELECT 1`);
    res.json({ success: true, message: "✅ Setup completed successfully" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, message });
  } finally {
    client.release();
  }
});

export default router;
