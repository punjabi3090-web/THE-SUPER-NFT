import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

type Profile = {
  full_name: string | null;
  email: string | null;
  balance: number | null;
};

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        window.location.replace('/login');
        return;
      }
      setAuthEmail(user.email ?? "");
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email, balance')
        .eq('id', user.id)
        .single();
      setProfile(data);
      setLoading(false);
    };
    load();
  }, []);

  const handleLogout = async () => {
    localStorage.clear();
    sessionStorage.clear();
    await supabase.auth.signOut();
    window.location.replace('/login');
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '60px auto', padding: '0 20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 22, marginBottom: 24 }}>Dashboard</h1>

      <div style={{ background: '#f1f5f9', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <span style={{ color: '#64748b', fontSize: 12 }}>Name</span>
          <p style={{ margin: '4px 0 0', fontWeight: 600 }}>
            {profile?.full_name || authEmail.split('@')[0] || '—'}
          </p>
        </div>
        <div style={{ marginBottom: 12 }}>
          <span style={{ color: '#64748b', fontSize: 12 }}>Email</span>
          <p style={{ margin: '4px 0 0', fontWeight: 600 }}>
            {profile?.email || authEmail || '—'}
          </p>
        </div>
        <div>
          <span style={{ color: '#64748b', fontSize: 12 }}>Balance</span>
          <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: 20, color: '#16a34a' }}>
            ${(profile?.balance ?? 0).toFixed(2)}
          </p>
        </div>
      </div>

      <button
        onClick={handleLogout}
        style={{
          width: '100%', padding: '12px', background: '#ef4444',
          color: '#fff', border: 'none', borderRadius: 8,
          fontWeight: 600, fontSize: 15, cursor: 'pointer',
        }}
      >
        Logout
      </button>
    </div>
  );
}
