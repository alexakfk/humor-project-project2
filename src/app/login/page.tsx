"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const unauthorizedError = searchParams.get("error") === "unauthorized";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center scanline-overlay">
      <div className="w-full max-w-md p-8">
        <pre className="text-[#00ff41] text-center mb-10 text-xs leading-tight glow-text select-none">
          {`
 ╔═════════════════════════════════╗
 ║   HUMOR OPS // ADMIN ACCESS    ║
 ║   ───────────────────────────   ║
 ║   AUTHENTICATION  REQUIRED     ║
 ╚═════════════════════════════════╝`}
        </pre>

        {unauthorizedError && (
          <div className="mb-6 p-3 border border-[#ff0033]/30 bg-[#ff0033]/5 text-[#ff0033] text-xs">
            ACCESS DENIED: Superadmin clearance required.
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 border border-[#ff0033]/30 bg-[#ff0033]/5 text-[#ff0033] text-xs">
            ERROR: {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[#00ff41] text-[10px] mb-1.5 uppercase tracking-widest">
              {"> "}Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-terminal"
              placeholder="operator@humor-ops.net"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[#00ff41] text-[10px] mb-1.5 uppercase tracking-widest">
              {"> "}Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-terminal"
              placeholder="••••••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-[#00ff41]/10 border border-[#00ff41]/30 text-[#00ff41] text-sm uppercase tracking-widest hover:bg-[#00ff41]/20 hover:border-[#00ff41]/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "[ AUTHENTICATING... ]" : "[ ACCESS SYSTEM ]"}
          </button>
        </form>

        <p className="mt-10 text-center text-[#1a3a1a] text-[9px] uppercase tracking-widest">
          Secure Terminal v2.0 // Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-[#00ff41] text-xs animate-pulse">
            Initializing secure terminal...
          </p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
