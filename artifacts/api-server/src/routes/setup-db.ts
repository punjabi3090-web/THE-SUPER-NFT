import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/setup-db", async (_req, res): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        email      TEXT        NOT NULL UNIQUE,
        password   TEXT        NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS students (
        id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        name       TEXT        NOT NULL,
        class      TEXT        NOT NULL,
        phone      TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS classes (
        id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        name       TEXT        NOT NULL,
        teacher    TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    res.json({ success: true, message: "✅ Setup completed successfully" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ success: false, message });
  } finally {
    client.release();
  }
});

export default router;
