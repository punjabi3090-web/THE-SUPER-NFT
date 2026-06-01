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
import { type AdminNotif, type User, type WithdrawResult } from "./lib/api";
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

// legacy shim referenced by a few pages
export const TEST_MODE = false;
export const testUser = { uid: 'SUPER000000', name: 'User', team: { rewards: 0, valid: 0, a: 0, bc: 0 }, orders: { total: 0, processing: 0, bought: 0, sold: 0 } };

// ── Helper: map Supabase user row → User type ────────────────────────────────

function mapUser(row: Record<string, unknown>): User {
  const inc = (row.user_income as Record<string, unknown>[] | null)?.[0] ?? {};
  return {
    id: 0,
    userId: String(row.id ?? ''),
    email: String(row.email ?? ''),
    name: String(row.username ?? row.full_name ?? row.email ?? ''),
    username: String(row.username ?? ''),
    phone: String(row.phone ?? ''),
    country: String(row.country ?? ''),
    myReferralCode: String(row.referral_code ?? ''),
    referralCode: String(row.referral_code ?? ''),
    joinedWithCode: (row.referred_by as string | null) ?? null,
    referredBy: (row.referred_by as string | null) ?? null,
    coins: 0,
    walletBalance: Number(row.wallet_balance) || 0,
    nftAccountBalance: 0,
    totalDeposit: Number(row.total_deposit) || 0,
    totalWithdraw: Number(row.total_withdraw) || 0,
    reserveIncome: Number(inc.reserve_income) || 0,
    teamIncome: Number(inc.team_income) || 0,
    activityIncome: Number(inc.activity_income) || 0,
    level: Number(row.level) || 1,
    isAdmin: row.role === 'admin',
    isBlocked: !!row.is_blocked,
    googleAuthBound: false,
    googleAuthSecret: null,
    withdrawalAddress: (row.trc20_address as string | null) ?? null,
    bep20Address: (row.bep20_address as string | null) ?? null,
    trc20Address: (row.trc20_address as string | null) ?? null,
    addressBindDate: null,
    registeredAt: String(row.created_at ?? ''),
    joinDate: String(row.created_at ?? ''),
    lastLogin: '',
    password: '',
    myActivityHistory: [],
  };
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
        if (!session) { setUser(null); return; }
        const { data } = await supabase
          .from('users')
          .select('*, user_income(*)')
          .eq('id', session.user.id)
          .single();
        if (data) setUser(mapUser(data as Record<string, unknown>));
      } catch { setUser(null); }
    };
    fetchUser();
  }, [tick]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) { setUser(null); return; }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        try {
          const { data } = await supabase
            .from('users')
            .select('*, user_income(*)')
            .eq('id', session.user.id)
            .single();
          if (data) setUser(mapUser(data as Record<string, unknown>));
        } catch { /* user row may not exist yet */ }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch notifications from Supabase
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30);
        setNotifications((data ?? []).map((n: Record<string, unknown>): AdminNotif => ({
          id: n.id as number,
          title: String(n.title ?? ''),
          message: String(n.message ?? ''),
          type: String(n.type ?? 'announcement'),
          createdAt: String(n.created_at ?? ''),
          date: String(n.created_at ?? ''),
          read: [],
        })));
      } catch { /* notifications table may not exist yet */ }
    };
    fetchNotifs();
  }, [tick]);

  const balance = user?.walletBalance ?? 0;
  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  const addDeposit = useCallback((_amount: number, _network: string) => {
    // Admin handles deposits from the admin panel
  }, []);

  const requestWithdraw = useCallback(async (amount: number): Promise<WithdrawResult> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return 'no_auth';
      const { data: userData } = await supabase
        .from('users')
        .select('wallet_balance, trc20_address, is_blocked')
        .eq('id', session.user.id)
        .single();
      const u = userData as Record<string, unknown> | null;
      if (!u) return 'insufficient';
      if (u.is_blocked) return 'blocked';
      if (!u.trc20_address) return 'no_address';
      const bal = Number(u.wallet_balance) || 0;
      if (amount < 10) return 'min';
      if (amount > 10000) return 'max';
      if (bal < amount) return 'insufficient';
      const { error } = await supabase.from('withdrawals').insert({
        user_id: session.user.id,
        amount,
        network: 'TRC20',
        address: u.trc20_address,
        status: 'pending',
      });
      if (error) return 'insufficient';
      await supabase.from('users').update({ wallet_balance: bal - amount }).eq('id', session.user.id);
      refresh();
      return 'ok';
    } catch {
      return 'insufficient';
    }
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
