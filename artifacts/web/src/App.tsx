import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Switch, Route, useLocation } from "wouter";
import LoginPage from "./pages/LoginPage";
import Home from "./pages/Home";
import Stake from "./pages/Stake";
import Reserve from "./pages/Reserve";
import Assets from "./pages/Assets";
import My from "./pages/My";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import Tutorials from "./pages/Tutorials";
import Service from "./pages/Service";
import Language from "./pages/Language";
import AdminPanel from "./pages/AdminPanel";
import Notifications from "./pages/Notifications";
import Showcase from "./pages/Showcase";
import Settings from "./pages/Settings";
import Security from "./pages/Security";
import DepositRecord from "./pages/DepositRecord";
import WithdrawRecord from "./pages/WithdrawRecord";
import MyHistory from "./pages/MyHistory";
import ReserveHistory from "./pages/ReserveHistory";
import MyTeam from "./pages/MyTeam";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import {
  type AdminNotif, type User, type WithdrawResult,
  setCachedUserId, getCurrentUserId,
  getNotifications, markNotifRead, markAllNotifsRead,
  submitWithdrawalRequest,
} from "./lib/api";
import { supabase } from "./lib/supabase";
import './index.css';

// ── Context ─────────────────────────────────────────────────────────────────

interface AppCtx {
  user: User | null;
  balance: number;
  refresh: () => void;
  addDeposit: (amount: number, network: string) => void;
  requestWithdraw: (amount: number) => Promise<WithdrawResult>;
  notifications: AdminNotif[];
  unreadCount: number;
  markNotificationRead: (id: number) => void;
  markAllRead: () => void;
}

const AppContext = createContext<AppCtx | null>(null);

export function useBalance() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useBalance must be inside AppProvider');
  return ctx;
}

// legacy shims — kept for import compatibility; values live in lib/testData.ts
export { TEST_MODE, testUser } from "./lib/testData";

// ── Helper: sync with Express/Drizzle DB after every Supabase login ──────────
// Returns the full User object (with walletBalance, team data, etc.) and
// sets the numeric nftUsers id in the module-level cache so all Express
// routes that expect a numeric userId continue to work unchanged.

async function syncUserWithExpress(
  session: { user: { email?: string; user_metadata?: Record<string, unknown> } },
): Promise<User | null> {
  try {
    const meta = session.user.user_metadata ?? {};
    const res = await fetch('/api/nft/auth/supabase-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: session.user.email ?? '',
        name: String(meta['full_name'] ?? meta['name'] ?? '').trim(),
        phone: String(meta['phone'] ?? '').trim(),
        referralCode: String(meta['referral_code'] ?? '').trim(),
      }),
    });
    if (!res.ok) return null;
    const { numericId, user } = await res.json() as { numericId: number; user: User };
    setCachedUserId(String(numericId));
    return user;
  } catch {
    return null;
  }
}

// ── Provider ─────────────────────────────────────────────────────────────────

function AppProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<AdminNotif[]>([]);
  const [readIds, setReadIds] = useState<Set<number>>(new Set());

  const refresh = useCallback(() => setTick(t => t + 1), []);

  // Fetch current user from Supabase users table
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setUser(null); setCachedUserId(null); return; }
        const u = await syncUserWithExpress(session);
        setUser(u);
      } catch { setUser(null); setCachedUserId(null); }
    };
    fetchUser();
  }, [tick]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) { setUser(null); setCachedUserId(null); return; }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        try {
          const u = await syncUserWithExpress(session);
          if (u) setUser(u);
        } catch { /* silent — sync failure does not block the session */ }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch notifications from Supabase
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const notifs = await getNotifications();
        setNotifications(notifs);
      } catch { /* silent */ }
    };
    fetchNotifs();
  }, [tick]);

  const balance = user?.walletBalance ?? 0;
  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  const addDeposit = useCallback((_amount: number, _network: string) => {
    // Admin handles deposits from the admin panel
  }, []);

  const requestWithdraw = useCallback(async (amount: number): Promise<WithdrawResult> => {
    const uid = getCurrentUserId();
    if (!uid) return 'no_auth';
    const result = await submitWithdrawalRequest(uid, amount, 'TRC20');
    if (result === 'ok') refresh();
    return result;
  }, [refresh]);

  const markNotificationRead = useCallback((id: number) => {
    setReadIds(prev => new Set([...prev, id]));
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, read: ['_all_'] } : n
    ));
  }, []);

  const markAllRead = useCallback(() => {
    const ids = notifications.map(n => n.id);
    setReadIds(new Set(ids));
    setNotifications(prev => prev.map(n => ({ ...n, read: ['_all_'] })));
  }, [notifications]);

  return (
    <AppContext.Provider value={{
      user, balance, refresh,
      addDeposit, requestWithdraw,
      notifications, unreadCount,
      markNotificationRead, markAllRead,
    }}>
      {children}
    </AppContext.Provider>
  );
}

// ── Routes ───────────────────────────────────────────────────────────────────

function Routes() {
  const [location] = useLocation();

  useEffect(() => {
    // Auto-redirect ?ref= links to /login so signup form pre-fills referral code
    const search = window.location.search;
    if (search.includes('ref=') && location !== '/login' && !location.startsWith('/admin')) {
      window.location.replace('/login' + search);
      return;
    }
    // Admin and reset-password routes manage their own auth
    if (location.startsWith('/admin') || location.startsWith('/reset-password')) return;
    // Supabase session guard
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && location !== '/login') window.location.replace('/login');
      if (session && location === '/login') window.location.replace('/showcase');
    });
  }, [location]);

  return (
    <Switch>
      <Route path="/login"           component={LoginPage} />
      <Route path="/"                component={Home} />
      <Route path="/stake"           component={Stake} />
      <Route path="/reserve"         component={Reserve} />
      <Route path="/assets"          component={Assets} />
      <Route path="/my"              component={My} />
      <Route path="/deposit"         component={Deposit} />
      <Route path="/withdraw"        component={Withdraw} />
      <Route path="/tutorials"       component={Tutorials} />
      <Route path="/service"         component={Service} />
      <Route path="/language"        component={Language} />
      <Route path="/showcase"        component={Showcase} />
      <Route path="/dashboard"       component={Dashboard} />
      <Route path="/admin"           component={AdminPanel} />
      <Route path="/notifications"   component={Notifications} />
      <Route path="/settings"        component={Settings} />
      <Route path="/security"        component={Security} />
      <Route path="/deposit-record"  component={DepositRecord} />
      <Route path="/withdraw-record" component={WithdrawRecord} />
      <Route path="/my-history"      component={MyHistory} />
      <Route path="/reserve-history" component={ReserveHistory} />
      <Route path="/team"            component={MyTeam} />
      <Route path="/reset-password"  component={ResetPassword} />
    </Switch>
  );
}

export default function App() {
  return (
    <AppProvider>
      <div className="bg-gradient-to-br from-blue-50 via-green-50 to-purple-50 min-h-screen">
        <Routes />
      </div>
    </AppProvider>
  );
}
