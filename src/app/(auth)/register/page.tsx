"use client";
import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    setLoading(false);
    if (!data.success) {
      setError(data.error ?? "Registration failed");
    } else {
      router.push("/login?registered=true");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'var(--bg-void)' }}
    >
      {/* Ambient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #4a1e8a 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[200px] rounded-full opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #9b1a2a 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="text-xs tracking-[0.4em] uppercase mb-3" style={{ color: 'var(--gold)' }}>✦ Create Account ✦</div>
          <h1 className="text-4xl font-black tracking-widest text-gold-gradient font-display">MASTER OF MASTERS</h1>
        </div>

        <div className="panel panel-ornate p-8 relative">
          <div className="corner-tl" />
          <div className="corner-br" />

          <h2 className="font-display font-bold text-xl tracking-widest uppercase mb-1" style={{ color: 'var(--text-primary)' }}>Register</h2>
          <p className="text-sm mb-7" style={{ color: 'var(--text-muted)' }}>Join the Master&apos;s mission to claim ultimate power and dominate the realm.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs tracking-widest uppercase mb-2 font-semibold" style={{ color: 'var(--gold)' }}>Username</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
                required minLength={3} maxLength={32}
                className="input-game"
                placeholder="Username"
              />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase mb-2 font-semibold" style={{ color: 'var(--gold)' }}>Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
                className="input-game"
                placeholder="Email Address"
              />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase mb-2 font-semibold" style={{ color: 'var(--gold)' }}>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required minLength={8}
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
              {loading ? "Registering..." : "Sign Up"}
            </button>
          </form>

          <p className="text-[10px] text-center mt-4 uppercase tracking-widest opacity-50" style={{ color: 'var(--text-muted)' }}>
            By registering, you agree to our Terms of Service and Privacy Policy.
          </p>

          <div className="divider-rune my-6">or</div>

          <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold hover:opacity-80 transition" style={{ color: 'var(--gold)' }}>
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
