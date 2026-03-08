import Link from "next/link";

const features = [
  { icon: "🗡️", label: "Blood Duels" },
  { icon: "📦", label: "Cursed Packs" },
  { icon: "💀", label: "Monster Cards" },
  { icon: "🐉", label: "Legendary Beasts" },
  { icon: "⚖️", label: "Inquisition" },
];

export default function HomePage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center text-white relative overflow-hidden px-4"
      style={{ background: 'var(--bg-void)' }}
    >
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(ellipse, #4a1e8a 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-0 w-[500px] h-[300px] rounded-full opacity-15"
        style={{ background: 'radial-gradient(ellipse, #9b1a2a 0%, transparent 70%)' }} />

      {/* Decorative rune lines */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px opacity-10"
        style={{ background: 'linear-gradient(to right, transparent, var(--gold), transparent)' }} />

      <div className="relative z-10 text-center max-w-3xl animate-slide-up">
        {/* Title */}
        <div className="mb-2 text-xs tracking-[0.4em] uppercase" style={{ color: 'var(--gold)' }}>
          ✦ Dark Card Conquest ✦
        </div>
        <h1 className="text-7xl sm:text-8xl font-black tracking-widest mb-6 text-gold-gradient font-display">
          MASTER
        </h1>

        <div className="divider-rune mb-8">The Abyss Awaits</div>

        <p className="text-lg mb-10 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Summon monsters from the deep. Forge dark pacts. Defy the Inquisition.
          <br />Your descent begins with a single blade.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-5 justify-center mb-14">
          <Link href="/register" className="btn-game btn-game text-base px-10 py-4 animate-glow-pulse">
            🗡️ &nbsp;Swear the Blood Oath
          </Link>
          <Link
            href="/login"
            className="relative inline-flex items-center justify-center gap-2 px-10 py-4 text-sm font-display font-bold tracking-widest uppercase"
            style={{
              color: 'var(--text-muted)',
              border: '1px solid rgba(200,150,42,0.2)',
              background: 'rgba(15,0,32,0.5)',
              clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)'
            }}
          >
            Enter
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3">
          {features.map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-2 px-4 py-2 text-sm"
              style={{
                background: 'rgba(15,0,32,0.7)',
                border: '1px solid rgba(200,150,42,0.2)',
                color: 'var(--text-muted)',
                clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)'
              }}
            >
              <span>{f.icon}</span>
              <span className="font-semibold tracking-wide">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
