import { useState } from "react";
import { useLocation } from "wouter";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl w-96 border border-purple-500/30">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl mx-auto mb-3"></div>
          <h1 className="text-3xl font-bold text-white">THE SUPER NFT</h1>
          <p className="text-purple-300 text-sm mt-1">
            {isLogin ? "Welcome Back" : "Create Account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg border border-slate-700 focus:border-purple-500 outline-none"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg border border-slate-700 focus:border-purple-500 outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full bg-slate-800 text-white px-4 py-3 rounded-lg border border-slate-700 focus:border-purple-500 outline-none"
          />
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/50"
          >
            {isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <p className="text-center mt-6 text-slate-400 text-sm">
          {isLogin ? "Don't have account?" : "Already have account?"}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-purple-400 ml-1 font-semibold hover:text-purple-300"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}
