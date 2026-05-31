---
name: DB lib rebuild pattern
description: After changing lib/db schema, composite declarations must be rebuilt before dependent packages can typecheck
---

After adding columns or tables to `lib/db/src/schema/`, TypeScript in `artifacts/api-server` will see stale types until the composite lib is rebuilt.

**Rule:** Always run `pnpm run typecheck:libs` (which runs `tsc --build`) from the workspace root after any schema change, before running `pnpm --filter @workspace/api-server run typecheck`.

**Why:** `lib/db` is a composite TypeScript project (`composite: true`, `emitDeclarationOnly: true`). The api-server references it via `tsconfig.json` `references`. TypeScript uses the emitted `.d.ts` files in `lib/db/dist/` — if these are stale, new columns/tables are invisible.

**How to apply:** Schema change workflow:
1. Edit `lib/db/src/schema/nft.ts`
2. `pnpm --filter @workspace/db run push` — push to DB
3. `pnpm run typecheck:libs` — rebuild declarations
4. `pnpm --filter @workspace/api-server run typecheck` — should now be clean
