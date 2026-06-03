import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { supabase } from "./lib/supabase";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import './index.css';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  useEffect(() => {
    const publicRoutes = ['/login'];
    if (publicRoutes.some(r => location.startsWith(r))) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) window.location.replace('/login');
    });
  }, [location]);

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthGuard>
      <Switch>
        <Route path="/login"     component={LoginPage} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/"          component={Home} />
      </Switch>
    </AuthGuard>
  );
}
