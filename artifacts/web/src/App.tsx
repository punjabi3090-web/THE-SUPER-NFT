import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import Stake from "./pages/Stake";
import Earn from "./pages/Earn";
import Reserve from "./pages/Reserve";
import Assets from "./pages/Assets";
import My from "./pages/My";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import './index.css';

export const TEST_MODE = true;
export const testUser = {
  id: 1, name: "Test User", uid: "SUPER123456", balance: 0.00,
  team: { rewards: 0, valid: 0, a: 0, bc: 0 },
  orders: { total: 0, processing: 0, bought: 0, sold: 0 }
};
export const testNFTs = [
  { id: 1, name: "Super Ape #1234", price: 50, img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300" },
  { id: 2, name: "Meta Lion #567", price: 120, img: "https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=300" },
  { id: 3, name: "Cyber Wolf #890", price: 80, img: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300" },
  { id: 4, name: "Golden Eagle #321", price: 200, img: "https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=300" }
];

function App() {
  const [location, setLocation] = useLocation();
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user && location !== '/login') setLocation('/login');
    if (user && location === '/login') setLocation('/stake');
  }, [location]);

  return (
    <div className="bg-gradient-to-br from-blue-50 via-green-50 to-purple-50 min-h-screen">
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/stake" component={Stake} />
        <Route path="/earn" component={Earn} />
        <Route path="/reserve" component={Reserve} />
        <Route path="/assets" component={Assets} />
        <Route path="/my" component={My} />
        <Route path="/deposit" component={Deposit} />
        <Route path="/withdraw" component={Withdraw} />
        <Route path="/" component={Stake} />
      </Switch>
    </div>
  );
}
export default App;
