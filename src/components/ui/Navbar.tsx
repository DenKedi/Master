"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, Fragment, useEffect } from "react";
import { getRankProgress } from "@/lib/ranks";
import { usePrefetch } from "@/hooks/usePrefetch";

/* ─── Nav data ─────────────────────────────────────────────────────────── */

const navLinks = [
  { href: "/hub",        label: "Missions",      icon: "\uD83D\uDC80" },
  { href: "/collection", label: "Collection",     icon: "\uD83D\uDDE1\uFE0F" },
  { href: "/shop",       label: "Black Market",   icon: "\uD83D\uDC00" },
  { href: "/friends",    label: "Inquisition",    icon: "\u2696\uFE0F" },
];

const LINK_ACCENT: Record<string, { bg: string; border: string }> = {
  "/hub":        { bg: "rgba(200,150,42,0.15)",  border: "rgba(200,150,42,0.5)" },
  "/collection": { bg: "rgba(59,130,246,0.15)",  border: "rgba(59,130,246,0.5)" },
  "/shop":       { bg: "rgba(124,60,237,0.15)",  border: "rgba(124,60,237,0.5)" },
  "/friends":    { bg: "rgba(155,26,42,0.18)",   border: "rgba(155,26,42,0.6)" },
  "/admin":      { bg: "rgba(224,64,251,0.15)",  border: "rgba(224,64,251,0.5)" },
  "/hub/master": { bg: "rgba(180,130,255,0.12)", border: "rgba(180,130,255,0.5)" },
};

/* Trapezoid geometry */
const W = 280;
const INSET = 80;

/* ─── Components ───────────────────────────────────────────────────────── */

function Divider() {
  return (
    <div
      className="w-full flex-shrink-0"
      style={{
        height: "1px",
        background:
          "linear-gradient(to right, rgba(200,150,42,0.06), rgba(200,150,42,0.28) 50%, rgba(200,150,42,0.10))",
      }}
    />
  );
}

export default function Sidebar() {
  const { data: session } = useSession();
  const prefetch = usePrefetch();
  const pathname = usePathname();
  const user = session?.user as any;
  const [hovered, setHovered] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [tutorialDone, setTutorialDone] = useState(false);
  const { rank, next, pct } = getRankProgress(user?.xp ?? 0);

  /* Fetch tutorial status */
  useEffect(() => {
    if (!session) return;
    fetch("/api/tutorial")
      .then((r) => r.json())
      .then((d) => { if (d.data?.tutorialCompleted) setTutorialDone(true); })
      .catch(() => {});
  }, [session]);

  /* Close sidebar on route change (mobile) */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /* Lock body scroll when sidebar is open on mobile */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const allLinks = [
    ...navLinks,
    ...(user?.role === "admin"
      ? [{ href: "/admin", label: "Overlord", icon: "\uD83D\uDC41" }]
      : []),
  ];

  return (
    <>
      {/* ── Mobile toggle button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed top-4 right-4 z-50 flex items-center justify-center w-11 h-11 rounded-lg lg:hidden transition-all duration-200"
        style={{
          background: open ? "rgba(200,150,42,0.2)" : "rgba(8,0,20,0.9)",
          border: "1px solid rgba(200,150,42,0.3)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
        }}
        aria-label={open ? "Close menu" : "Open menu"}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          className="transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          {open ? (
            /* ✕ close — comic-style jagged X */
            <>
              <line x1="6" y1="6" x2="22" y2="22" stroke="var(--gold-bright)" strokeWidth="3" strokeLinecap="round" />
              <line x1="22" y1="6" x2="6" y2="22" stroke="var(--gold-bright)" strokeWidth="3" strokeLinecap="round" />
              {/* Ink splat accents */}
              <circle cx="14" cy="14" r="2" fill="var(--gold)" opacity="0.3" />
              <circle cx="6" cy="6" r="1.5" fill="var(--crimson-bright)" opacity="0.5" />
              <circle cx="22" cy="22" r="1.5" fill="var(--crimson-bright)" opacity="0.5" />
            </>
          ) : (
            /* ☰ burger — wobbly hand-drawn comic lines */
            <>
              {/* Top line — slight wave */}
              <path d="M4 7 C7 6, 11 8.5, 14 7.5 C17 6.5, 21 8, 24 7" stroke="var(--gold-bright)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              {/* Middle line — opposite wave */}
              <path d="M4 14 C7 15, 11 12.5, 14 14 C17 15.5, 21 13, 24 14" stroke="var(--gold-bright)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              {/* Bottom line — slight wave */}
              <path d="M4 21 C7 20, 11 22.5, 14 21.5 C17 20.5, 21 22, 24 21" stroke="var(--gold-bright)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              {/* Comic drip from bottom line */}
              <path d="M10 22.5 Q10 25, 9.5 26" stroke="var(--gold)" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.4" />
              <circle cx="9.5" cy="26.5" r="0.8" fill="var(--gold)" opacity="0.4" />
            </>
          )}
        </svg>
      </button>

      {/* ── Backdrop (mobile only) ── */}
      {open && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar panel ── */}
      <aside
        className={[
          "fixed right-0 top-0 h-screen z-40 transition-transform duration-300 ease-out",
          /* Desktop: always visible. Mobile: slide in/out. */
          "lg:translate-x-0",
          open ? "translate-x-0" : "translate-x-full lg:translate-x-0",
        ].join(" ")}
        style={{ width: `${W}px` }}
      >
        {/* ── SVG: right-angled trapezoid background ── */}
        <svg
          className="absolute inset-0 z-0 pointer-events-none"
          preserveAspectRatio="none"
          viewBox={`0 0 ${W} 1000`}
          style={{ width: "100%", height: "100%", overflow: "visible" }}
        >
          <defs>
            <linearGradient id="trapBg" x1="0" y1="0" x2="0.25" y2="1">
              <stop offset="0%"   stopColor="rgba(10,0,22,0.97)" />
              <stop offset="100%" stopColor="rgba(5,0,14,0.99)" />
            </linearGradient>
            <filter id="trapShadow" x="-30%" y="0%" width="160%" height="100%">
              <feDropShadow dx="-8" dy="0" stdDeviation="18" floodColor="rgba(0,0,0,0.7)" />
            </filter>
          </defs>
          <polygon
            points={`${INSET},0 ${W},0 ${W},1000 0,1000`}
            fill="url(#trapBg)"
            filter="url(#trapShadow)"
          />
          <line
            x1={INSET} y1="0" x2="0" y2="1000"
            stroke="rgba(200,150,42,0.3)"
            strokeWidth="1.5"
          />
        </svg>

        {/* ── Content clipped to trapezoid ── */}
        <div
          className="relative z-10 h-full flex flex-col overflow-y-auto overflow-x-hidden"
          style={{
            clipPath: `polygon(${INSET}px 0, 100% 0, 100% 100%, 0% 100%)`,
          }}
        >
          {/* === Logo === */}
          <div className="flex-shrink-0 pt-7 pb-5 pr-5 pl-24 text-right">
            <Link href="/hub" className="inline-block" onClick={() => setOpen(false)}>
              <div
                className="text-[10px] tracking-[0.3em] uppercase mb-1"
                style={{ color: "var(--gold-dim)" }}
              >
                {"\u2726"} master of {"\u2726"}
              </div>
              <div className="font-display font-black text-xl tracking-[0.2em] text-gold-gradient">
                MASTERS
              </div>
            </Link>
          </div>

          <Divider />

          {/* === Nav cells === */}
          {allLinks.map((link) => {
            const active =
              pathname === link.href ||
              (link.href === "/admin" && pathname.startsWith("/admin"));
            const isHovered = hovered === link.href;
            const accent = LINK_ACCENT[link.href];
            const lit = active || isHovered;

            return (
              <Fragment key={link.href}>
                <Link
                  href={link.href}
                  onMouseEnter={() => setHovered(link.href)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setOpen(false)}
                  className="relative flex items-center gap-3 py-4 pr-5 pl-24 flex-shrink-0 transition-all duration-200 select-none"
                  style={{
                    color: active
                      ? "var(--gold-bright)"
                      : isHovered
                      ? "#fff"
                      : "var(--text-muted)",
                    background: lit
                      ? accent?.bg ?? "rgba(200,150,42,0.12)"
                      : "transparent",
                    borderRight: active
                      ? `2px solid ${accent?.border ?? "var(--gold)"}`
                      : "2px solid transparent",
                  }}
                >
                  <span className="text-base leading-none">{link.icon}</span>
                  <span className="font-display font-bold text-xs tracking-[0.18em] uppercase whitespace-nowrap">
                    {link.label}
                  </span>
                  {active && (
                    <span
                      className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{
                        background: accent?.border ?? "var(--gold)",
                        boxShadow: `0 0 6px ${accent?.border ?? "var(--gold)"}`,
                      }}
                    />
                  )}
                </Link>
                <Divider />
              </Fragment>
            );
          })}

          {/* === The Master — locked / unlocked === */}
          {tutorialDone ? (() => {
            const masterActive = pathname === "/hub/master" || pathname.startsWith("/hub/master/");
            const masterAccent = LINK_ACCENT["/hub/master"];
            return (
              <Link
                href="/hub/master"
                onMouseEnter={() => setHovered("/hub/master")}
                onMouseLeave={() => setHovered(null)}
                className="relative flex items-center gap-3 py-4 pr-5 pl-24 flex-shrink-0 transition-colors"
                style={{
                  color: masterActive
                    ? "var(--arcane)"
                    : hovered === "/hub/master"
                      ? "rgba(200,180,255,0.85)"
                      : "rgba(200,180,255,0.5)",
                  background:
                    masterActive
                      ? masterAccent?.bg
                      : hovered === "/hub/master"
                        ? "rgba(180,130,255,0.06)"
                        : "transparent",
                  borderRight: masterActive
                    ? `2px solid ${masterAccent?.border}`
                    : "2px solid transparent",
                }}
              >
                <span className="text-base leading-none">{"\u2694\uFE0F"}</span>
                <span className="font-display font-bold text-xs tracking-[0.18em] uppercase">
                  The Master
                </span>
                {masterActive && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      background: masterAccent?.border ?? "var(--arcane)",
                      boxShadow: `0 0 6px ${masterAccent?.border ?? "var(--arcane)"}`,
                    }}
                  />
                )}
              </Link>
            );
          })() : (
            <div
              className="relative flex items-center gap-3 py-4 pr-5 pl-24 flex-shrink-0 cursor-not-allowed group"
              style={{ color: "rgba(180,130,255,0.25)" }}
            >
              <span className="text-base leading-none">{"\uD83D\uDD12"}</span>
              <span className="font-display font-bold text-xs tracking-[0.18em] uppercase">
                The Master
              </span>
              <span
                className="absolute right-3 bottom-full mb-2 hidden group-hover:flex items-center text-[10px] tracking-wide px-2 py-1 rounded whitespace-nowrap z-50"
                style={{
                  background: "rgba(10,0,25,0.97)",
                  border: "1px solid rgba(180,130,255,0.3)",
                  color: "rgba(200,180,255,0.7)",
                }}
              >
                Complete the tutorial to unlock
              </span>
            </div>
          )}

          <Divider />

          {/* === Spacer === */}
          <div className="flex-1 min-h-0" />

          <Divider />

          {/* === Bottom status === */}
          <div className="flex-shrink-0 pr-5 pl-8 pb-5 pt-3 flex flex-col gap-2.5">
            {user && (
              <div
                className="flex items-center gap-2 text-xs font-bold"
                style={{ color: "var(--gold-bright)" }}
              >
                {"\uD83E\uDE99"} <span>{(prefetch.currency.data?.balance ?? user.currency ?? 0).toLocaleString()}</span>
              </div>
            )}

            <div
              className="text-xs tracking-wider uppercase truncate"
              style={{ color: "var(--text-muted)" }}
            >
              {user?.name}
            </div>

            {/* Rank + XP bar */}
            <div className="flex flex-col gap-1">
              <div
                className="text-[10px] font-bold tracking-widest uppercase truncate"
                style={{ color: rank.color }}
                title={rank.description}
              >
                {rank.title}
              </div>
              <div
                className="h-0.5 w-full rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: rank.color }}
                />
              </div>
              {next && (
                <div
                  className="text-[9px] tracking-wide"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                >
                  {pct}% {"\u2192"} {next.title}
                </div>
              )}
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#ffaaaa";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "rgba(200,80,80,0.6)";
              }}
              className="text-left text-xs tracking-widest uppercase font-bold transition-colors duration-200 mt-1"
              style={{
                color: "rgba(200,80,80,0.6)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {"\u2620"} Leave
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
