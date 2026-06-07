import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { setCachedUserId } from "./lib/api";
import Login          from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ShowCase       from "./pages/ShowCase";
import MainLayout     from "./layouts/MainLayout";
import Deposit        from "./pages/Deposit";
import Withdraw       from "./pages/Withdraw";
import NFT            from "./pages/NFT";
import MyTeam         from "./pages/MyTeam";
import Orders         from "./pages/Orders";
import Admin          from "./pages/Admin";
import AdminDashboard from "./pages/AdminDashboard";
import CronTest       from "./pages/CronTest";
import './index.css';

async function syncUser(
  supaUser: { email?: string; user_metadata?: Record<string, unknown> } | null,
): Promise<void> {
  if (!supaUser?.email) { setCachedUserId(null); return; }
  try {
    const meta = (supaUser.user_metadata ?? {}) as Record<string, string>;
    const r = await fetch("/api/nft/auth/supabase-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: supaUser.email,
        name:          meta["name"]             ?? "",
        phone:         meta["phone"]            ?? "",
        referralCode:  meta["referred_by_code"] ?? null,
      }),
    });
    const d = await r.json() as { numericId?: number };
    if (d.numericId) setCachedUserId(String(d.numericId));
  } catch { /* silent — pages degrade gracefully */ }
}

function AppRoutes() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<ReturnType<typeof Object> | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      await syncUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      void syncUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F8F9FA" }}>
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#DC2626 transparent transparent transparent" }} />
    </div>
  );

  return (
    <Routes>
      <Route path="/login"           element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/showcase"        element={session ? <ShowCase />    : <Navigate to="/login" replace />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/"                element={session ? <MainLayout />  : <Navigate to="/login" replace />} />
      <Route path="/deposit"         element={session ? <Deposit />     : <Navigate to="/login" replace />} />
      <Route path="/withdraw"        element={session ? <Withdraw />    : <Navigate to="/login" replace />} />
      <Route path="/nft"             element={session ? <NFT />         : <Navigate to="/login" replace />} />
      <Route path="/team"            element={session ? <MyTeam />      : <Navigate to="/login" replace />} />
      <Route path="/orders"          element={session ? <Orders />      : <Navigate to="/login" replace />} />
      <Route path="/admin"           element={session ? <Admin />       : <Navigate to="/login" replace />} />
      <Route path="/admin/dashboard" element={session ? <AdminDashboard /> : <Navigate to="/login" replace />} />
      <Route path="/cron-test"       element={session ? <CronTest />    : <Navigate to="/login" replace />} />
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
