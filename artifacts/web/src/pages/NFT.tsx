import { useAuth } from "../lib/useAuth";

export default function NFT() {
  const { loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-3">🖼️</p>
        <h1 className="text-2xl font-bold">NFT Collections</h1>
        <p className="text-slate-400 text-sm mt-2">Coming soon</p>
      </div>
    </div>
  );
}
