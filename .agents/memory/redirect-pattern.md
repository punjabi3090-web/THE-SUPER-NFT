---
name: Redirect pattern
description: Use window.location.replace() for all auth/guard redirects — wouter setLocation and window.location.href are unreliable
---

## Rule
Always use `window.location.replace()` for all authentication redirects and route guards in this app.

**Why:** wouter's `setLocation()` fails to redirect reliably after Supabase auth events. `window.location.href` was also reported as unreliable by the user. `window.location.replace()` is a full navigation that bypasses the SPA router and works correctly in all cases.

## How to apply
- After login success: `window.location.replace('/showcase')`
- Auth guard (no session): `window.location.replace('/login')`
- Admin guard (no admin role): `window.location.replace('/dashboard')`
- After logout: `window.location.replace('/login')`
- For ?ref= param redirect: `window.location.replace('/login' + search)`
- Dashboard "Enter Dashboard": `window.location.replace('/dashboard')`

## Session guard pattern
In every protected page's useEffect:
```typescript
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session) window.location.replace('/login');
  });
}, []);
```

## LoginPage pattern
LoginPage has TWO mechanisms:
1. `getSession()` check on mount (covers page refresh)
2. `onAuthStateChange` listener for SIGNED_IN event (covers async auth completion)
Both must call `window.location.replace('/showcase')`.
