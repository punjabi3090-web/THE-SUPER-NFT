import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/not-found";
import './index.css';

function App() {
  const [location, setLocation] = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) setIsLoggedIn(true);
    setChecking(false);
  }, []);

  useEffect(() => {
    if (!checking) {
      if (!isLoggedIn && location !== '/login') {
        setLocation('/login');
      }
      if (isLoggedIn && location === '/login') {
        setLocation('/');
      }
    }
  }, [isLoggedIn, location, checking]);

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f8fafc 0%, #d1fae5 100%)'}}>Loading...</div>;
  }

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}
export default App;
