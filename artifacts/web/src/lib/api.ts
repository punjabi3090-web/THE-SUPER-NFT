// ── API base ──────────────────────────────────────────────────────────────────
const API = "/api/nft";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HistoryItem {
  id: number; type: string; title: string;
  desc?: string; date: string; icon: string; color: string;
  amount?: number; status?: string; txHash?: string; rewardType?: string;
  nftLevel?: number; from?: string; commissionType?: string;
}

export interface User {
  id: number;
  userId: string;
  email: string;
  name: string;
  username: string;
  phone: string;
  country: string;
  myReferralCode: string;
  referralCode: string;
  joinedWithCode: string | null;
  referredBy: string | null;
  coins: number;
  walletBalance: number;
  nftAccountBalance: number;
  totalDeposit: number;
  totalWithdraw: number;
  level: number;
  isAdmin: boolean;
  isBlocked: boolean;
  googleAuthBound: boolean;
  googleAuthSecret: null;
  withdrawalAddress: string | null;
  addressBindDate: string | null;
  registeredAt: string;
  joinDate: string;
  lastLogin: string;
  password: string;
  myActivityHistory: HistoryItem[];
}

export interface WithdrawalRequest {
  id: number;
  userId: number;
  userEmail: string;
  userName: string;
  amount: number;
  address: string;
  status: string;
  txHash: string | null;
  rejectReason: string | null;
  requestedAt: string;
  processedAt: string | null;
  requestDate: string;
}

export interface AdminNotif {
  id: number;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  date: string;
  read: string[];
}

export interface NftOrder {
  id: number;
  userId: number;
  nftName: string;
  nftImage: string;
  nftPrice: number;
  status: "bought" | "sold";
  createdAt: string;
  soldAt: string | null;
}

export interface AdminLog {
  id: number;
  admin: string;
  action: string;
  target: string;
  amount: number;
  details: string;
  createdAt: string;
  timestamp: string;
}

export type WithdrawResult = "ok" | "insufficient" | "no_address" | "min" | "max" | "disabled" | "no_auth" | "delay" | "time_restricted" | "blocked";

export interface RewardSettings {
  depositBonusPct: number; minDepositForBonus: number;
  referralBonusPct: number; level2BonusPct: number;
  levelThresholds: number[]; levelBonuses: number[];
}

export interface WithdrawalSettings {
  enabled: boolean; minAmount: number; maxAmount: number;
  requireGoogleAuth: boolean; requireAddress: boolean;
  addressBindDelay: number; timeRestriction: boolean;
  allowedHours: [number, number];
}

// ── Session helpers ───────────────────────────────────────────────────────────

const STORAGE_USER_ID   = "nftUserId";
const STORAGE_ADMIN_TOK = "nftAdminToken";
const STORAGE_ADMIN_EMAIL = "nftAdminEmail";
const NOTIF_READ_KEY    = "nftReadNotifs";

export function getCurrentUserId(): string | null {
  return localStorage.getItem(STORAGE_USER_ID);
}

export function setCurrentUser(userId: string | number) {
  localStorage.setItem(STORAGE_USER_ID, String(userId));
}

export function logoutUser() {
  localStorage.removeItem(STORAGE_USER_ID);
}

export function getAdminToken(): string | null {
  return localStorage.getItem(STORAGE_ADMIN_TOK);
}

export function isAdminLoggedIn(): boolean {
  return !!localStorage.getItem(STORAGE_ADMIN_TOK);
}

export function adminLogout() {
  const token = getAdminToken();
  if (token) {
    fetch(`${API}/admin/logout`, {
      method: "POST",
      headers: { "x-admin-token": token },
    }).catch(() => {});
  }
  localStorage.removeItem(STORAGE_ADMIN_TOK);
  localStorage.removeItem(STORAGE_ADMIN_EMAIL);
}

// ── Fetch helper ─────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  opts: RequestInit & { adminAuth?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string>),
  };
  if (opts.adminAuth) {
    const tok = getAdminToken();
    if (tok) headers["x-admin-token"] = tok;
  }
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function registerUser(data: {
  name: string; email: string; phone?: string;
  password: string; country?: string; referralCode?: string;
}): Promise<"email_exists" | "otp_sent"> {
  try {
    await apiFetch<{ needsOtp: boolean }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return "otp_sent";
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("already")) return "email_exists";
    throw e;
  }
}

export async function verifySignupOtp(email: string, otp: string): Promise<"ok" | "invalid" | "expired"> {
  try {
    await apiFetch("/auth/verify-signup-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
    return "ok";
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.toLowerCase().includes("expired")) return "expired";
    return "invalid";
  }
}

export async function loginUser(email: string, password: string): Promise<User | "blocked" | "invalid" | "unverified"> {
  try {
    const r = await apiFetch<{ user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return r.user;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.toLowerCase().includes("block")) return "blocked";
    if (msg.toLowerCase().includes("verify")) return "unverified";
    return "invalid";
  }
}

export async function forgotPasswordOtp(email: string): Promise<void> {
  await apiFetch("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPasswordOtp(email: string, otp: string, password: string): Promise<"ok" | "invalid" | "expired"> {
  try {
    await apiFetch("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, otp, password }),
    });
    return "ok";
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.toLowerCase().includes("expired")) return "expired";
    return "invalid";
  }
}

export async function adminLogin(email: string, password: string): Promise<boolean> {
  try {
    const r = await apiFetch<{ token: string; email: string }>("/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem(STORAGE_ADMIN_TOK, r.token);
    localStorage.setItem(STORAGE_ADMIN_EMAIL, r.email);
    return true;
  } catch {
    return false;
  }
}

// ── Current user ──────────────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<User | null> {
  const id = getCurrentUserId();
  if (!id) return null;
  try {
    const r = await apiFetch<{ user: User }>(`/users/${id}`);
    return r.user;
  } catch {
    return null;
  }
}

// ── Notifications (user-facing) ──────────────────────────────────────────────

export async function getNotifications(): Promise<AdminNotif[]> {
  try {
    const r = await apiFetch<{ notifications: AdminNotif[] }>("/notifications");
    const readIds: number[] = JSON.parse(localStorage.getItem(NOTIF_READ_KEY) || "[]");
    return r.notifications.map(n => ({
      ...n,
      date: n.createdAt,
      read: readIds.includes(n.id) ? ["_all_"] : [],
    }));
  } catch {
    return [];
  }
}

export function markNotifRead(id: number) {
  const readIds: number[] = JSON.parse(localStorage.getItem(NOTIF_READ_KEY) || "[]");
  if (!readIds.includes(id)) {
    readIds.push(id);
    localStorage.setItem(NOTIF_READ_KEY, JSON.stringify(readIds));
  }
}

export function markAllNotifsRead(notifIds: number[]) {
  localStorage.setItem(NOTIF_READ_KEY, JSON.stringify(notifIds));
}

// ── User operations ───────────────────────────────────────────────────────────

export async function updateUserAddress(userId: string, address: string): Promise<void> {
  await apiFetch(`/users/${userId}/address`, {
    method: "PATCH",
    body: JSON.stringify({ address }),
  });
}

export async function updateGoogleAuth(userId: string, enabled: boolean): Promise<void> {
  await apiFetch(`/users/${userId}/google-auth`, {
    method: "PATCH",
    body: JSON.stringify({ enabled }),
  });
}

export async function submitWithdrawalRequest(userId: string, amount: number): Promise<WithdrawResult> {
  try {
    await apiFetch(`/users/${userId}/withdraw`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
    return "ok";
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "no_address") return "no_address";
    if (msg === "min") return "min";
    if (msg === "max") return "max";
    if (msg === "disabled") return "disabled";
    if (msg === "blocked") return "blocked";
    if (msg === "insufficient") return "insufficient";
    return "insufficient";
  }
}

export async function getUserTeam(userId: string): Promise<{ team: User[]; referralCode: string }> {
  const r = await apiFetch<{ team: User[]; referralCode: string }>(`/users/${userId}/team`);
  return r;
}

// ── Admin operations ──────────────────────────────────────────────────────────

export async function getAllUsers(): Promise<User[]> {
  const r = await apiFetch<{ users: User[] }>("/admin/users", { adminAuth: true });
  return r.users;
}

export async function editUserBalance(userId: string, amount: number, type: "add" | "sub", reason: string): Promise<void> {
  await apiFetch(`/admin/users/${userId}`, {
    method: "PATCH",
    adminAuth: true,
    body: JSON.stringify({ field: "walletBalance", value: String(amount), type, reason }),
  });
}

export async function blockUser(userId: string): Promise<void> {
  await apiFetch(`/admin/users/${userId}`, {
    method: "PATCH",
    adminAuth: true,
    body: JSON.stringify({ field: "isBlocked" }),
  });
}

export async function deleteUser(userId: string): Promise<void> {
  await apiFetch(`/admin/users/${userId}`, {
    method: "DELETE",
    adminAuth: true,
  });
}

export async function updateUserReferralCode(userId: string, code: string): Promise<true | "taken" | "not_found"> {
  try {
    await apiFetch(`/admin/users/${userId}`, {
      method: "PATCH",
      adminAuth: true,
      body: JSON.stringify({ field: "myReferralCode", value: code }),
    });
    return true;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("taken")) return "taken";
    return "not_found";
  }
}

export async function processDeposit(userId: string, amount: number, network: string): Promise<void> {
  await apiFetch("/admin/deposit", {
    method: "POST",
    adminAuth: true,
    body: JSON.stringify({ userId, amount, network }),
  });
}

export async function sendAirdrop(amount: number): Promise<void> {
  await apiFetch("/admin/airdrop", {
    method: "POST",
    adminAuth: true,
    body: JSON.stringify({ amount }),
  });
}

export async function sendAdminNotification(title: string, message: string, type: string): Promise<void> {
  await apiFetch("/admin/notify", {
    method: "POST",
    adminAuth: true,
    body: JSON.stringify({ title, message, type }),
  });
}

export async function getAdminNotifications(): Promise<AdminNotif[]> {
  try {
    const r = await apiFetch<{ notifications: AdminNotif[] }>("/admin/notifications", { adminAuth: true });
    return r.notifications.map(n => ({ ...n, date: n.createdAt, read: [] }));
  } catch {
    return [];
  }
}

export async function getAdminLogs(): Promise<AdminLog[]> {
  try {
    const r = await apiFetch<{ logs: AdminLog[] }>("/admin/logs", { adminAuth: true });
    return r.logs.map(l => ({ ...l, timestamp: l.createdAt, amount: parseFloat(String(l.amount)) || 0 }));
  } catch {
    return [];
  }
}

export async function getAdminSettings(): Promise<Record<string, string>> {
  try {
    const r = await apiFetch<{ settings: Record<string, string> }>("/admin/settings", { adminAuth: true });
    return r.settings;
  } catch {
    return {};
  }
}

export async function changeAdminPassword(newPassword: string, newEmail?: string): Promise<void> {
  await apiFetch("/admin/password", {
    method: "PATCH",
    adminAuth: true,
    body: JSON.stringify({ newPassword, newEmail }),
  });
}

export async function getAdminWithdrawals(): Promise<WithdrawalRequest[]> {
  try {
    const r = await apiFetch<{ withdrawals: WithdrawalRequest[] }>("/admin/withdrawals", { adminAuth: true });
    return r.withdrawals.map(w => ({ ...w, requestDate: w.requestedAt }));
  } catch {
    return [];
  }
}

export async function approveWithdrawal(id: number, txHash: string): Promise<void> {
  await apiFetch(`/admin/withdrawals/${id}/approve`, {
    method: "PATCH",
    adminAuth: true,
    body: JSON.stringify({ txHash }),
  });
}

export async function rejectWithdrawal(id: number, reason: string): Promise<void> {
  await apiFetch(`/admin/withdrawals/${id}/reject`, {
    method: "PATCH",
    adminAuth: true,
    body: JSON.stringify({ reason }),
  });
}

export async function getMyOrders(userId: string | number): Promise<NftOrder[]> {
  try {
    const r = await apiFetch<{ orders: NftOrder[] }>(`/me/orders?userId=${userId}`);
    return r.orders;
  } catch {
    return [];
  }
}

export async function reserveNft(
  userId: string | number, nftName: string, nftImage: string, nftPrice: number
): Promise<"ok" | "insufficient"> {
  try {
    await apiFetch("/me/orders", {
      method: "POST",
      body: JSON.stringify({ userId: String(userId), nftName, nftImage, nftPrice }),
    });
    return "ok";
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "insufficient") return "insufficient";
    return "insufficient";
  }
}

export async function sellNft(userId: string | number, orderId: number): Promise<void> {
  await apiFetch(`/me/orders/${orderId}/sell`, {
    method: "PUT",
    body: JSON.stringify({ userId: String(userId) }),
  });
}

// ── Stubs kept for import compatibility ───────────────────────────────────────
export function initializeApp() { /* no-op: DB is seeded on server */ }
export function addToUserHistory(_uid: string, _item: unknown) { /* no-op */ }
export function updateUser(_uid: string, _updates: Partial<User>) { /* no-op */ }
export function getRewardSettings(): RewardSettings {
  return { depositBonusPct: 5, minDepositForBonus: 20, referralBonusPct: 5, level2BonusPct: 2, levelThresholds: [0, 50, 200, 500], levelBonuses: [0, 10, 25, 50] };
}
export function getWithdrawalSettings(): WithdrawalSettings {
  return { enabled: true, minAmount: 10, maxAmount: 10000, requireGoogleAuth: false, requireAddress: true, addressBindDelay: 0, timeRestriction: false, allowedHours: [0, 24] };
}
