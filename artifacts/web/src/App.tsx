import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import Home from "./pages/Home";
import Market from "./pages/Market";
import MyNFT from "./pages/MyNFT";
import Team from "./pages/Team";
import Mine from "./pages/Mine";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import './index.css';

export const TEST_MODE = true;
export const testUser = { id: 1, name: "Test User", balance: 111.50, uid: "SUPER123456" };
export const testNFTs = [
  { id: 1, name: "Super Ape #1234", price: 50, img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300", profit: "+12%", level: "R", daily: 2.5 },
  { id: 2, name: "Meta Lion #567", price: 120, img: "https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=300", profit: "+8%", level: "SR", daily: 5.2 },
  { id: 3, name: "Cyber Wolf #890", price: 80, img: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300", profit: "+15%", level: "SSR", daily: 3.8 },
  { id: 4, name: "Golden Eagle #321", price: 200, img: "https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=300", profit: "+5%", level: "UR", daily: 8.5 }
];

function App() {
  const [location, setLocation] = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    setIsLoggedIn(!!user);
    if (!user && location !== '/login') setLocation('/login');
    if (user && location === '/login') setLocation('/');
  }, [location]);

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={Home} />
      <Route path="/market" component={Market} />
      <Route path="/nft" component={MyNFT} />
      <Route path="/team" component={Team} />
      <Route path="/mine" component={Mine} />
      <Route path="/deposit" component={Deposit} />
      <Route path="/withdraw" component={Withdraw} />
    </Switch>
  );
}
export default App;
