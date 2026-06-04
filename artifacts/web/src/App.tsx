import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Login      from "./pages/Login";
import MainLayout from "./layouts/MainLayout";
import Deposit    from "./pages/Deposit";
import Withdraw   from "./pages/Withdraw";
import NFT        from "./pages/NFT";
import MyTeam     from "./pages/MyTeam";
import Admin      from "./pages/Admin";
import CronTest   from "./pages/CronTest";
import './index.css';

function AppRoutes() {
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="w-10 h-10 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <Routes>
      <Route path="/login"     element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/"          element={session ? <MainLayout />  : <Navigate to="/login" replace />} />
      <Route path="/deposit"   element={session ? <Deposit />     : <Navigate to="/login" replace />} />
      <Route path="/withdraw"  element={session ? <Withdraw />    : <Navigate to="/login" replace />} />
      <Route path="/nft"       element={session ? <NFT />         : <Navigate to="/login" replace />} />
      <Route path="/team"      element={session ? <MyTeam />      : <Navigate to="/login" replace />} />
      <Route path="/admin"     element={session ? <Admin />       : <Navigate to="/login" replace />} />
      <Route path="/cron-test" element={session ? <CronTest />    : <Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
