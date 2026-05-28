import { createContext, useContext, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import Home from "./pages/Home";
import Stake from "./pages/Stake";
import Reserve from "./pages/Reserve";
import Assets from "./pages/Assets";
import My from "./pages/My";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
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

export interface DepositRecord {
  id: number; amount: number; network: string; status: string; date: Date;
}
export interface WithdrawRecord {
  id: number; amount: number; address: string; fee: number; status: string; date: Date;
}
export interface StakeRecord {
  id: number; plan: string; amount: number; apy: string; duration: string; date: Date;
}

interface BalanceContextType {
  balance: number;
  deposits: DepositRecord[];
  withdraws: WithdrawRecord[];
  stakes: StakeRecord[];
  addDeposit: (amount: number, network: string) => void;
  addWithdraw: (amount: number, address: string) => boolean;
  addStake: (plan: string, amount: number, apy: string, duration: string) => boolean;
}

const BalanceContext = createContext<BalanceContextType | null>(null);
export const useBalance = () => {
  const ctx = useContext(BalanceContext);
  if (!ctx) throw new Error("useBalance must be used inside BalanceProvider");
  return ctx;
};

function BalanceProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState(111.50);
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [withdraws, setWithdraws] = useState<WithdrawRecord[]>([]);
  const [stakes, setStakes] = useState<StakeRecord[]>([]);

  const addDeposit = (amount: number, network: string) => {
    setBalance(prev => prev + amount);
    setDeposits(prev => [
      { id: Date.now(), amount, network, status: "Success", date: new Date() },
      ...prev,
    ]);
  };

  const addWithdraw = (amount: number, address: string): boolean => {
    if (balance < amount) return false;
    const fee = 1;
    setBalance(prev => prev - amount);
    setWithdraws(prev => [
      { id: Date.now(), amount, address, fee, status: "Processing", date: new Date() },
      ...prev,
    ]);
    return true;
  };

  const addStake = (plan: string, amount: number, apy: string, duration: string): boolean => {
    if (balance < amount) return false;
    setBalance(prev => prev - amount);
    setStakes(prev => [
      { id: Date.now(), plan, amount, apy, duration, date: new Date() },
      ...prev,
    ]);
    return true;
  };

  return (
    <BalanceContext.Provider value={{ balance, deposits, withdraws, stakes, addDeposit, addWithdraw, addStake }}>
      {children}
    </BalanceContext.Provider>
  );
}

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
