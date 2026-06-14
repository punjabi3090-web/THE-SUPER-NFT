---
name: Profiles lookup pattern
description: How to query a user's own profile row — profiles.id ≠ profiles.user_id for most rows
---

## Rule
Always use `.eq('user_id', user.id)` when looking up a Supabase auth user's own profile row. Never use `.eq('id', user.id)`.

**Why:** `profiles.id` is an auto-generated PK UUID. `profiles.user_id` is the Supabase auth UUID. Only one row coincidentally has `id = user_id`. Using `.eq('id', user.id)` silently returns no rows for all other users.

**How to apply:** In every profile select/update keyed to the logged-in user:
- Select: `.from("profiles").select(...).eq("user_id", userId).single()`
- Update: `.from("profiles").update({...}).eq("user_id", userId)`

The old in-session note ("ALWAYS use .eq('id', user.id)") was incorrect — that was written when it happened to work for the admin user only.
