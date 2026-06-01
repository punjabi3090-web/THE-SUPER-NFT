---
name: Supabase admin migration
description: How AdminPanel.tsx and Showcase.tsx were migrated from localStorage/Express auth to Supabase auth + Supabase DB
---

## Rule
AdminPanel uses Supabase auth (signInWithPassword) + role check (`users.role === 'admin'`) instead of the old localStorage `nftAdminToken` pattern.

**Why:** The old system stored a custom token in localStorage and passed it as `x-admin-token` header to Express. Migration replaces this with Supabase session — same session as the regular users but gated on `role === 'admin'` in the users table.

## How to apply

- `isAdminLoggedIn()` → `supabase.auth.getSession()` + check `users.role === 'admin'` for the session user id
- `adminLogin()` → `supabase.auth.signInWithPassword()` + role check; sign out if not admin
- `adminLogout()` → `supabase.auth.signOut()`
- `adminForgotPassword()` → `supabase.auth.resetPasswordForEmail()`
- `adminResetPassword()` → `supabase.auth.verifyOtp({ type: 'recovery' })` + `supabase.auth.updateUser({ password })`
- `changeAdminPassword()` → `supabase.auth.updateUser({ password, email })`
- All data reads → `supabase.from('users/withdrawals/deposits/notifications/admin_logs').select(...)`
- All data writes → `supabase.from(...).update/insert/delete/upsert`
- Settings → `supabase.from('admin_settings').upsert({ id: 1, ... }, { onConflict: 'id' })`

## Supabase gotcha: PromiseLike has no .catch()
Supabase query builder returns `PromiseLike`, not a full `Promise`. This means `.then(...).catch(...)` chaining fails with TS2339 ("Property 'catch' does not exist on type 'PromiseLike<void>'"). Always use `async/await` inside an IIFE or async function + try/catch block inside useEffect.

## Data mapping
Supabase `users` rows get mapped to the existing `User` type at the point of setState — fields like `walletBalance`, `totalDeposit`, `level`, `isBlocked`, `referralCode` use defensive `Number(...) || 0` / `!!` / `String(...)` coercions since some columns may not exist yet in the schema.

For joined data (`withdrawals` + `users`), the nested join object is cast via `wa.users as Record<string, unknown> | null`.
