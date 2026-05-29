---
name: NFT DB Migration
description: How THE SUPER NFT app's data layer works after the localStorage→PostgreSQL migration
---

## What changed
- All user/admin data now lives in PostgreSQL (not localStorage)
- `lib/db/src/schema/nft.ts` — 6 tables: nftUsers, nftSettings, nftReferrals, nftWithdrawals, nftNotifications, nftAdminLogs
- `artifacts/api-server/src/routes/nft.ts` — 25+ REST endpoints at `/api/nft/*`
- `artifacts/web/src/lib/api.ts` — async fetch client; all page imports now use this
- `artifacts/web/src/lib/store.ts` — now just `export * from "./api"` for backward compat

## Admin credentials
- Seeded on server startup via `seedAdmin()` called in `artifacts/api-server/src/index.ts`
- Email stored in `nft_settings` key `admin_email`, bcrypt hash in `admin_password`
- Default: admin@supernft.com / SuperAdmin@2026
- In-memory token Set (`adminSessions`) for admin sessions; invalidated on logout
- Admin can change email/password from Settings tab in admin panel → `PATCH /api/nft/admin/password`

## Session strategy
- User session: `localStorage.setItem('nftUserId', id)` after login; all data re-fetched from DB
- Admin session: `localStorage.setItem('nftAdminToken', token)` — UUID token verified on each request via `x-admin-token` header

**Why:** Multi-device support requires server-side state; localStorage alone cannot sync across devices.

## Key routes
- `POST /api/nft/auth/register` — create user, auto-generate referral code
- `POST /api/nft/auth/login` — verify bcrypt password, return user
- `POST /api/nft/admin/login` — return UUID token
- `GET  /api/nft/users/:id/team` — downline by referral code
- `POST /api/nft/users/:id/withdraw` — deducts balance, creates pending request
- `PATCH /api/nft/admin/withdrawals/:id/approve` — marks approved, records txHash, adds to totalWithdraw
- `PATCH /api/nft/admin/withdrawals/:id/reject` — marks rejected, refunds balance

## TypeScript gotcha
- Express 5: `req.params["id"]` must be cast `as string` to avoid `string | string[]` type error
