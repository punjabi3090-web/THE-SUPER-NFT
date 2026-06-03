import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) window.location.replace('/login');
    });
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif',
    }}>
      <button
        onClick={() => window.location.replace('/dashboard')}
        style={{
          padding: '16px 40px', background: '#6d28d9',
          color: '#fff', border: 'none', borderRadius: 12,
          fontWeight: 700, fontSize: 18, cursor: 'pointer',
        }}
      >
        Continue to Dashboard
      </button>
    </div>
  );
}
