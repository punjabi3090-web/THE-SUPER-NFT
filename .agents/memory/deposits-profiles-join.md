---
name: Deposits/withdrawals → profiles join
description: No FK relationship between deposits/withdrawals and profiles in Supabase schema cache
---

## Rule
`deposits.user_id` and `withdrawals.user_id` reference `auth.users.id` (the auth UUID), but there is NO FK constraint in Supabase's PostgREST schema cache to `profiles`. The embedded resource syntax `profiles(email, name)` in Supabase queries fails with "Could not find a relationship".

**Why:** Supabase PostgREST joins only work with FK constraints defined in the DB. The deposits/withdrawals tables were created without a FK to profiles.

**How to apply:** Always do a two-step fetch:
1. Load deposits/withdrawals normally (no join)
2. Collect unique `user_id` values, batch-load `profiles.select("user_id, email, name").in("user_id", uids)`
3. Build a `Map<user_id, {email, name}>` and merge with rows client-side

Also: the column is `profiles.name` (NOT `profiles.full_name`).
