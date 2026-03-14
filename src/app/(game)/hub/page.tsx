import { auth } from "@/lib/nextauth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import tutorialImg from "@/app/Tutorial.webp";
import HubPrefetchStatus from "@/components/ui/HubPrefetchStatus";

export default async function HubPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user as any;

  const playOptions = [
    {
      href: "/hub/battle-v2",
      label: "Quick Battle",
      sub: "Face the Spider Queen",
      color: "rgba(200,150,42,0.15)",
      border: "var(--border-gold)",
      image: tutorialImg,
    },
  ];

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="mb-10">
        <div className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: "var(--gold)" }}>✦ Master of ✦</div>
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="font-display font-black text-4xl sm:text-5xl tracking-widest uppercase text-gold-gradient">
            Missions
          </h1>
          {user.role === "admin" && <HubPrefetchStatus />}
        </div>
        <p className="text-sm mt-2 tracking-wide" style={{ color: "var(--text-muted)" }}>Choose your path to glory.</p>
      </div>

      {/* Play Options */}
      <div className="mb-4 flex items-center gap-4">
        <div className="divider-rune flex-1">Available Missions</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {playOptions.map((option) => (
          <Link
            key={option.href}
            href={option.href}
            className="relative group block p-6 transition-all duration-200 card-lift overflow-hidden min-h-[200px] flex flex-col justify-end"
            style={{
              background: option.color,
              border: `1px solid ${option.border}`,
              clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
            }}
          >
            {option.image && (
              <div className="absolute inset-0 z-0 opacity-50 group-hover:opacity-75 transition-opacity duration-300">
                <Image
                  src={option.image}
                  alt={option.label}
                  fill
                  className="object-contain"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111111] to-transparent" />
              </div>
            )}

            <div className="relative z-10">
              <div className="corner-tl" style={{ borderColor: option.border }} />
              <div
                className="font-display font-bold text-lg tracking-widest uppercase mb-1 transition-colors drop-shadow-md"
                style={{ color: "var(--text-primary)" }}
              >
                {option.label}
              </div>
              <div
                className="text-xs tracking-wide drop-shadow-md"
                style={{ color: "var(--text-muted)" }}
              >
                {option.sub}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Admin */}
      {user.role === "admin" && (
        <div>
          <Link
            href="/admin"
            className="btn-game btn-game-arcane px-6 py-3 text-sm"
          >
            👁 &nbsp;Overlord Command
          </Link>
        </div>
      )}
    </div>
  );
}
