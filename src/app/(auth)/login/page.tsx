"use client";
import { useState, FormEvent } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/hub");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'var(--bg-void)' }}
    >
      {/* Ambient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-25 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #4a1e8a 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[250px] rounded-full opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #9b1a2a 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-xs tracking-[0.4em] uppercase mb-3" style={{ color: 'var(--gold)' }}>✦ Login ✦</div>
          <h1 className="text-4xl font-black tracking-widest text-gold-gradient font-display">MASTER</h1>
        </div>

        {/* Panel */}
        <div className="panel panel-ornate p-8 relative">
          <div className="corner-tl" />
          <div className="corner-br" />

          <h2 className="font-display font-bold text-xl tracking-widest uppercase mb-1" style={{ color: 'var(--text-primary)' }}>Welcome Back</h2>
          <p className="text-sm mb-7" style={{ color: 'var(--text-muted)' }}>Enter your credentials to access the game.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs tracking-widest uppercase mb-2 font-semibold" style={{ color: 'var(--gold)' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-game"
                placeholder="Email address"
              />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase mb-2 font-semibold" style={{ color: 'var(--gold)' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-game"
                placeholder="Password"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm px-3 py-2" style={{ background: 'rgba(155,26,42,0.2)', border: '1px solid rgba(155,26,42,0.4)', color: '#ff8888' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-game w-full mt-2 py-3">
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="divider-rune my-6">or</div>

          <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Need an account?{" "}
            <Link href="/register" className="font-semibold hover:opacity-80 transition" style={{ color: 'var(--gold)' }}>
              Register Now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
