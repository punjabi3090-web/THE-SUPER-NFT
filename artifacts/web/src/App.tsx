import { Route, Switch, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import './index.css';

function App() {
  const [location, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!session && location !== '/login') setLocation('/login');
    if (session && location === '/login') setLocation('/dashboard');
  }, [session, location, loading, setLocation]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      Loading...
    </div>
  );

  return (
    <Switch>
      <Route path="/login"     component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/">{session ? <Dashboard /> : <Login />}</Route>
    </Switch>
  );
}

export default App;
