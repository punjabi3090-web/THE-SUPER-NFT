import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/setup-db", async (_req, res): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_income (
        id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id        TEXT        NOT NULL,
        comprehensive  NUMERIC     NOT NULL DEFAULT 0,
        daily          NUMERIC     NOT NULL DEFAULT 0,
        team           NUMERIC     NOT NULL DEFAULT 0,
        activity       NUMERIC     NOT NULL DEFAULT 0,
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS income_transactions (
        id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id        TEXT        NOT NULL,
        type           TEXT        NOT NULL CHECK (type IN ('comprehensive','daily','team','activity','bid')),
        amount         NUMERIC     NOT NULL DEFAULT 0,
        source_user_id TEXT,
        description    TEXT,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS referrals (
        id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_id    TEXT        NOT NULL,
        referred_id    TEXT        NOT NULL UNIQUE,
        level          TEXT        NOT NULL CHECK (level IN ('A','B','C')),
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS daily_claims (
        id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id        TEXT        NOT NULL,
        claim_date     DATE        NOT NULL DEFAULT CURRENT_DATE,
        amount         NUMERIC     NOT NULL DEFAULT 0,
        type           TEXT        NOT NULL DEFAULT 'daily_profit',
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (user_id, claim_date)
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
