import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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
import './index.css';

export const TEST_MODE = true;
export const testUser = {
  id: 1, name: "Test User", uid: "SUPER123456",
  team: { rewards: 0, valid: 0, a: 0, bc: 0 },
  orders: { total: 0, processing: 0, bought: 0, sold: 0 }
};
export const testNFTs = [
  { id: 1, name: "Super Ape #1234", price: 50, img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300" },
  { id: 2, name: "Meta Lion #567", price: 120, img: "https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=300" },
  { id: 3, name: "Cyber Wolf #890", price: 80, img: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300" },
  { id: 4, name: "Golden Eagle #321", price: 200, img: "https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=300" }
];

// ── Types ──────────────────────────────────────────────────────────────────

export type NotifType = 'deposit' | 'withdraw' | 'order' | 'stake' | 'admin' | 'security';

export type AppNotification = {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  date: string;
  read: boolean;
};

export type WithdrawRecord = {
  id: string;
  amount: number;
  address: string;
  fee: number;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
};

export type OrderRecord = {
  id: string;
  name: string;
  price: number;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
};

export type StakeRecord = {
  id: string;
  amount: number;
  plan: string;
  apy: string;
  dailyProfit: number;
  date: string;
  status: 'active' | 'completed';
  endDate: string;
};

export type DepositRecord = {
  id: string;
  amount: number;
  network: string;
  status: string;
  date: string;
};

export type AdminLog = {
  id: string;
  action: string;
  details: string;
  date: string;
};

// ── Context ────────────────────────────────────────────────────────────────

interface BalanceContextType {
  balance: number;
  deposits: DepositRecord[];
  withdraws: WithdrawRecord[];
  orders: OrderRecord[];
  stakes: StakeRecord[];
  notifications: AppNotification[];
  adminLogs: AdminLog[];
  addDeposit: (amount: number, network: string) => void;
  requestWithdraw: (amount: number, address: string) => 'ok' | 'insufficient' | 'min' | 'invalid_addr';
  approveWithdraw: (id: string, txHash: string) => void;
  rejectWithdraw: (id: string, reason: string) => void;
  addOrder: (name: string, price: number) => boolean;
  cancelOrder: (id: string) => void;
  addStake: (amount: number, plan: string, dailyProfit: number, apy: string) => boolean;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  addNotification: (n: Omit<AppNotification, 'id' | 'date' | 'read'>) => void;
  adminAddBalance: (amount: number, reason: string) => void;
  adminDeductBalance: (amount: number, reason: string) => void;
  logAdminAction: (action: string, details: string) => void;
}

const BalanceContext = createContext<BalanceContextType | null>(null);

export const useBalance = () => {
  const ctx = useContext(BalanceContext);
  if (!ctx) throw new Error("useBalance must be inside BalanceProvider");
  return ctx;
};

// ── localStorage helpers ───────────────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : fallback;
  } catch { return fallback; }
}
function save(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── Admin session helpers ──────────────────────────────────────────────────

const ADMIN_TIMEOUT = 60 * 60 * 1000; // 1 hour

export function isAdminAuthed(): boolean {
  const ts = sessionStorage.getItem('snft_admin_ts');
  if (!ts) return false;
  return Date.now() - parseInt(ts) < ADMIN_TIMEOUT;
}
export function setAdminAuthed() {
  sessionStorage.setItem('snft_admin_ts', Date.now().toString());
}
export function clearAdminAuth() {
  sessionStorage.removeItem('snft_admin_ts');
}

// ── Provider ───────────────────────────────────────────────────────────────

function BalanceProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance]               = useState(() => load<number>('snft_balance', 111.50));
  const [deposits, setDeposits]             = useState<DepositRecord[]>(() => load('snft_deposits', []));
  const [withdraws, setWithdraws]           = useState<WithdrawRecord[]>(() => load('snft_withdraws', []));
  const [orders, setOrders]                 = useState<OrderRecord[]>(() => load('snft_orders', []));
  const [stakes, setStakes]                 = useState<StakeRecord[]>(() => load('snft_stakes', []));
  const [notifications, setNotifications]   = useState<AppNotification[]>(() => load('snft_notifs', []));
  const [adminLogs, setAdminLogs]           = useState<AdminLog[]>(() => load('snft_adminlogs', []));

  useEffect(() => { save('snft_balance', balance); },           [balance]);
  useEffect(() => { save('snft_deposits', deposits); },         [deposits]);
  useEffect(() => { save('snft_withdraws', withdraws); },       [withdraws]);
  useEffect(() => { save('snft_orders', orders); },             [orders]);
  useEffect(() => { save('snft_stakes', stakes); },             [stakes]);
  useEffect(() => { save('snft_notifs', notifications); },      [notifications]);
  useEffect(() => { save('snft_adminlogs', adminLogs); },       [adminLogs]);

  const addNotification = (n: Omit<AppNotification, 'id' | 'date' | 'read'>) => {
    setNotifications(prev => [
      { id: Date.now().toString(), date: new Date().toISOString(), read: false, ...n },
      ...prev
    ]);
  };

  const logAdminAction = (action: string, details: string) => {
    setAdminLogs(prev => [
      { id: Date.now().toString(), action, details, date: new Date().toISOString() },
      ...prev
    ].slice(0, 100));
  };

  const addDeposit = (amount: number, network: string) => {
    setBalance(p => p + amount);
    setDeposits(p => [
      { id: Date.now().toString(), amount, network, status: 'completed', date: new Date().toISOString() },
      ...p
    ]);
    addNotification({
      type: 'deposit',
      title: 'Deposit Successful ✅',
      message: `$${amount.toFixed(2)} USDT added to your wallet via ${network}`
    });
  };

  const requestWithdraw = (amount: number, address: string): 'ok' | 'insufficient' | 'min' | 'invalid_addr' => {
    if (amount < 10) return 'min';
    if (!/^T[A-Za-z1-9]{33}$/.test(address)) return 'invalid_addr';
    if (amount > balance) return 'insufficient';
    setBalance(p => p - amount);
    setWithdraws(p => [
      { id: Date.now().toString(), amount, address, fee: 1, date: new Date().toISOString(), status: 'pending' },
      ...p
    ]);
    addNotification({
      type: 'withdraw',
      title: 'Withdrawal Requested ⏳',
      message: `$${amount.toFixed(2)} pending admin approval. Processing: 1-24 hours`
    });
    return 'ok';
  };

  const approveWithdraw = (id: string, txHash: string) => {
    // capture current list before state update
    const w = withdraws.find(x => x.id === id);
    setWithdraws(p => p.map(x => x.id === id ? { ...x, status: 'approved', adminNote: txHash } : x));
    if (w) {
      addNotification({
        type: 'withdraw',
        title: 'Withdrawal Approved ✅',
        message: `$${w.amount.toFixed(2)} sent. TX: ${txHash.slice(0, 12)}...`
      });
      logAdminAction('WITHDRAW_APPROVED', `$${w.amount} to ${w.address.slice(0, 15)}...`);
    }
  };

  const rejectWithdraw = (id: string, reason: string) => {
    const w = withdraws.find(x => x.id === id);
    if (w) {
      setBalance(p => p + w.amount);
      setWithdraws(p => p.map(x => x.id === id ? { ...x, status: 'rejected', adminNote: reason } : x));
      addNotification({
        type: 'withdraw',
        title: 'Withdrawal Rejected ❌',
        message: `$${w.amount.toFixed(2)} refunded. Reason: ${reason}`
      });
      logAdminAction('WITHDRAW_REJECTED', `$${w.amount} — ${reason}`);
    }
  };

  const addOrder = (name: string, price: number): boolean => {
    if (balance < price) return false;
    setBalance(p => p - price);
    setOrders(p => [
      { id: Date.now().toString(), name, price, date: new Date().toISOString(), status: 'completed' },
      ...p
    ]);
    addNotification({
      type: 'order',
      title: 'NFT Reserved 🎉',
      message: `${name} added to your collection for $${price}`
    });
    return true;
  };

  const cancelOrder = (id: string) => {
    const o = orders.find(x => x.id === id);
    if (o && o.status === 'pending') {
      setBalance(p => p + o.price);
      setOrders(p => p.map(x => x.id === id ? { ...x, status: 'cancelled' } : x));
      addNotification({
        type: 'order',
        title: 'Order Cancelled',
        message: `${o.name} cancelled. $${o.price} refunded`
      });
    }
  };

  const addStake = (amount: number, plan: string, dailyProfit: number, apy: string): boolean => {
    if (balance < amount) return false;
    setBalance(p => p - amount);
    const days = plan.includes('7') ? 7 : plan.includes('30') ? 30 : 90;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    setStakes(p => [
      {
        id: Date.now().toString(),
        amount, plan, apy, dailyProfit,
        date: new Date().toISOString(),
        status: 'active',
        endDate: endDate.toISOString()
      },
      ...p
    ]);
    addNotification({
      type: 'stake',
      title: 'Staking Started 📈',
      message: `$${amount} staked for ${plan}. Daily profit: $${dailyProfit.toFixed(2)}`
    });
    return true;
  };

  const adminAddBalance = (amount: number, reason: string) => {
    setBalance(p => p + amount);
    addNotification({
      type: 'admin',
      title: 'Admin Credit 🎁',
      message: `Admin added $${amount.toFixed(2)} USDT. Reason: ${reason}`
    });
    logAdminAction('BALANCE_ADDED', `+$${amount} — ${reason}`);
  };

  const adminDeductBalance = (amount: number, reason: string) => {
    setBalance(p => Math.max(0, p - amount));
    addNotification({
      type: 'admin',
      title: 'Admin Deduction',
      message: `Admin deducted $${amount.toFixed(2)} USDT. Reason: ${reason}`
    });
    logAdminAction('BALANCE_DEDUCTED', `-$${amount} — ${reason}`);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(p => p.map(n => ({ ...n, read: true })));
  };

  return (
    <BalanceContext.Provider value={{
      balance, deposits, withdraws, orders, stakes, notifications, adminLogs,
      addDeposit, requestWithdraw, approveWithdraw, rejectWithdraw,
      addOrder, cancelOrder, addStake,
      markNotificationRead, markAllRead, addNotification,
      adminAddBalance, adminDeductBalance, logAdminAction
    }}>
      {children}
    </BalanceContext.Provider>
  );
}

// ── Routes ─────────────────────────────────────────────────────────────────

function Routes() {
  const [location, setLocation] = useLocation();
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user && location !== '/login') setLocation('/login');
    if (user && location === '/login') setLocation('/');
  }, [location]);

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={Home} />
      <Route path="/stake" component={Stake} />
      <Route path="/reserve" component={Reserve} />
      <Route path="/assets" component={Assets} />
      <Route path="/my" component={My} />
      <Route path="/deposit" component={Deposit} />
      <Route path="/withdraw" component={Withdraw} />
      <Route path="/tutorials" component={Tutorials} />
      <Route path="/service" component={Service} />
      <Route path="/language" component={Language} />
      <Route path="/admin" component={AdminPanel} />
    </Switch>
  );
}

export default function App() {
  return (
    <BalanceProvider>
      <div className="bg-gradient-to-br from-blue-50 via-green-50 to-purple-50 min-h-screen">
        <Routes />
      </div>
    </BalanceProvider>
  );
}
