---
name: Drizzle dynamic update fix
description: Drizzle .set() rejects dynamically-built Record objects; use explicit if/else branches
---

**Rule:** Never pass a dynamically-built `Record<string, unknown>` (even with a cast) to `db.update(table).set(...)`. Drizzle's set() type is strictly shaped to the table columns and TypeScript rejects the cast pattern at the object-literal level.

**Why:** TypeScript performs excess property checking on object literals passed directly to typed functions. A cast like `set(obj as any)` may work at runtime but `set(obj as Parameters<...>)` fails with TS2353 at compile time. The safe pattern is explicit branches.

**How to apply:**
```typescript
// WRONG
const updates: Record<string, string> = { walletBalance: "100" };
if (type === "reserve") updates.reserveIncome = "50";
await db.update(tbl).set(updates as any).where(...);

// CORRECT
if (type === "reserve") {
  await db.update(tbl).set({ walletBalance: "100", reserveIncome: "50" }).where(...);
} else if (type === "team") {
  await db.update(tbl).set({ walletBalance: "100", teamIncome: "50" }).where(...);
} else {
  await db.update(tbl).set({ walletBalance: "100", activityIncome: "50" }).where(...);
}
```
