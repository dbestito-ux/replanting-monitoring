"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Email atau password salah");
      setLoading(false);
      return;
    }

    // ambil user login
    const user = data.user;

    // ambil role dari tabel profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error(profileError);
      router.push("/dashboard");
      return;
    }

    // redirect berdasarkan role
    if (profile.role === "admin") {
      router.push("/dashboard");
    } else if (profile.role === "supervisor") {
      router.push("/supervisor-dashboard");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black text-white px-4">
      <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-zinc-800">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-wide">
            Monitoring Replanting
          </h1>
          <p className="text-zinc-400 text-sm mt-2">
            Silakan login untuk melanjutkan
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">

          <div>
            <label className="text-sm text-zinc-400">Email</label>
            <input
              type="email"
              required
              placeholder="admin@kebun.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-2 px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-green-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-2 px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-green-500 focus:outline-none transition"
            />
          </div>

          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-400 text-sm px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 transition py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-zinc-500 mt-6">
          © {new Date().getFullYear()} Monitoring Replanting System
        </div>
      </div>
    </div>
  );
}