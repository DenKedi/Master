"use client";

interface GameOverScreenProps {
  won: boolean;
  tie?: boolean;
  xpReward: number;
  onContinue: () => void;
  isTutorial?: boolean;
}

export default function GameOverScreen({
  won,
  tie,
  xpReward,
  onContinue,
  isTutorial,
}: GameOverScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ pointerEvents: "auto" }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: tie
            ? "radial-gradient(ellipse at center, rgba(100,100,100,0.15), rgba(0,0,0,0.85))"
            : won
            ? "radial-gradient(ellipse at center, rgba(200,150,42,0.15), rgba(0,0,0,0.85))"
            : "radial-gradient(ellipse at center, rgba(155,26,42,0.15), rgba(0,0,0,0.85))",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Card */}
      <div
        className="relative max-w-md w-full mx-4 rounded-lg overflow-hidden animate-slide-up text-center"
        style={{
          background: "linear-gradient(135deg, rgba(15,0,32,0.98), rgba(8,0,18,0.98))",
          border: `1px solid ${tie ? "rgba(150,150,150,0.4)" : won ? "rgba(200,150,42,0.5)" : "rgba(155,26,42,0.5)"}`,
          boxShadow: tie
            ? "0 0 60px rgba(150,150,150,0.15)"
            : won
            ? "0 0 60px rgba(200,150,42,0.2)"
            : "0 0 60px rgba(155,26,42,0.2)",
        }}
      >
        <div className="px-6 pt-8 pb-4">
          {/* Icon */}
          <div className="text-5xl mb-4 animate-float" style={{ display: "inline-block" }}>
            {tie ? "🤝" : won ? "🏆" : "💀"}
          </div>

          {/* Title */}
          <h2
            className={`font-display font-black text-3xl tracking-widest uppercase ${
              won && !tie ? "text-gold-gradient" : ""
            }`}
            style={tie ? { color: "#9ca3af" } : won ? {} : { color: "var(--crimson-bright)" }}
          >
            {tie ? "Draw!" : won ? "Victory!" : "Defeat"}
          </h2>

          <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
            {tie
              ? "Both fighters fell at the same moment. Neither wins today."
              : won
              ? isTutorial
                ? "You've completed the tutorial! The Dark Lord is... mildly impressed."
                : "Your enemies have fallen before you!"
              : "You'll do better next time, minion."}
          </p>
        </div>

        {/* Rewards */}
        {xpReward > 0 && (
          <div
            className="mx-6 mb-4 px-4 py-3 rounded"
            style={{
              background: "rgba(200,150,42,0.08)",
              border: "1px solid rgba(200,150,42,0.2)",
            }}
          >
            <div className="text-[10px] tracking-[0.2em] uppercase mb-1" style={{ color: "var(--gold-dim)" }}>
              Rewards
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">⭐</span>
              <span className="font-display font-bold text-xl" style={{ color: "var(--gold-bright)" }}>
                +{xpReward} XP
              </span>
            </div>
          </div>
        )}

        {isTutorial && won && (
          <div className="mx-6 mb-4 px-4 py-2 rounded" style={{
            background: "rgba(124,60,237,0.08)",
            border: "1px solid rgba(124,60,237,0.2)",
          }}>
            <div className="text-xs" style={{ color: "#c4a0ff" }}>
              🔓 <strong>The Master</strong> campaign has been unlocked!
            </div>
          </div>
        )}

        {/* Action */}
        <div className="px-6 pb-6 pt-2">
          <button
            onClick={onContinue}
            className={`btn-game ${tie ? "" : won ? "" : "btn-game-crimson"} px-8 py-3 text-sm w-full`}
          >
            {tie
              ? isTutorial ? "Try Again" : "Return to Hub"
              : won
              ? isTutorial ? "Return to Hub" : "Continue"
              : isTutorial ? "Try Again" : "Return to Hub"}
          </button>
        </div>
      </div>
    </div>
  );
}
