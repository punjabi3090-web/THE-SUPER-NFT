import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
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
import {
  initializeApp, getCurrentUser, getCurrentUserId,
  processDeposit, submitWithdrawalRequest, WithdrawResult,
  getAdminNotifications, markNotifRead, markAllNotifsRead,
  type AdminNotif, type User,
} from "./lib/store";
import './index.css';

// ── Context ────────────────────────────────────────────────────────────────

interface AppCtx {
  user: User | null;
  balance: number;
  refresh: () => void;
  addDeposit: (amount: number, network: string) => void;
  requestWithdraw: (amount: number) => WithdrawResult;
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

// legacy helpers still referenced in a few places
export const TEST_MODE = false;
export const testUser  = { uid: 'SUPER000000', name: 'User', team: { rewards:0, valid:0, a:0, bc:0 }, orders: { total:0, processing:0, bought:0, sold:0 } };

// ── Provider ───────────────────────────────────────────────────────────────

function AppProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick(t => t + 1), []);

  const user  = useMemo(() => getCurrentUser(), [tick]);
  const balance = user?.walletBalance ?? 0;

  const uid = getCurrentUserId();

  const notifications = useMemo(() => {
    const n = getAdminNotifications();
    if (!uid) return n;
    return n;
  }, [tick, uid]);

  const unreadCount = useMemo(() => {
    if (!uid) return 0;
    return notifications.filter(n => !n.read.includes(uid)).length;
  }, [notifications, uid]);

  const addDeposit = useCallback((amount: number, network: string) => {
    const id = getCurrentUserId();
    if (!id) return;
    processDeposit(id, amount, network);
    refresh();
  }, [refresh]);

  const requestWithdraw = useCallback((amount: number): WithdrawResult => {
    const id = getCurrentUserId();
    if (!id) return 'insufficient';
    const result = submitWithdrawalRequest(id, amount);
    if (result === 'ok') refresh();
    return result;
  }, [refresh]);

  const markNotificationRead = useCallback((id: number) => {
    const userId = getCurrentUserId();
    if (userId) { markNotifRead(id, userId); refresh(); }
  }, [refresh]);

  const markAllRead = useCallback(() => {
    const userId = getCurrentUserId();
    if (userId) { markAllNotifsRead(userId); refresh(); }
  }, [refresh]);

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

// ── Routes ─────────────────────────────────────────────────────────────────

function Routes() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    // Skip auth check for admin routes
    if (location.startsWith('/admin')) return;
    const uid = getCurrentUserId();
    if (!uid && location !== '/login') setLocation('/login');
    if (uid  && location === '/login')  setLocation('/showcase');
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
      <Route path="/admin"           component={AdminPanel} />
      <Route path="/notifications"   component={Notifications} />
      <Route path="/settings"        component={Settings} />
      <Route path="/security"        component={Security} />
      <Route path="/deposit-record"  component={DepositRecord} />
      <Route path="/withdraw-record" component={WithdrawRecord} />
      <Route path="/my-history"      component={MyHistory} />
      <Route path="/reserve-history" component={ReserveHistory} />
      <Route path="/team"            component={MyTeam} />
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
