import { auth } from "@/lib/nextauth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { connectDB } from "@/lib/mongodb";
import UserModel from "@/models/User";
import tutorialImg from "@/app/Tutorial.webp";

export default async function HubPage() {
  const [session] = await Promise.all([auth(), connectDB()]);
  if (!session) redirect("/login");

  const user = session.user as any;
  const dbUser = await UserModel.findById(user.id).select("tutorialCompleted").lean();
  const tutorialDone = dbUser?.tutorialCompleted ?? false;

  const playOptions = [
    {
      href: "/hub/tutorial",
      label: "Tutorial",
      sub: tutorialDone ? "Completed ✓  —  Replay anytime" : "Learn the ways of the Keep",
      color: "rgba(200,150,42,0.15)",
      border: "var(--border-gold)",
      image: tutorialImg,
      badge: tutorialDone ? "✓" : null,
    },
  ];

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="mb-10">
        <div className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: "var(--gold)" }}>✦ Missions ✦</div>
        <h1 className="font-display font-black text-4xl sm:text-5xl tracking-widest uppercase text-gold-gradient">
          Missions
        </h1>
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

            {/* Badge */}
            {option.badge && (
              <span
                className="absolute top-3 right-3 z-20 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold"
                style={{ background: "rgba(200,150,42,0.9)", color: "#111" }}
              >
                {option.badge}
              </span>
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
