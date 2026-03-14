"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface BattleMenuProps {
  /** Whether sound is currently enabled */
  soundEnabled?: boolean;
  /** Toggle sound callback */
  onToggleSound?: () => void;
}

export default function BattleMenu({ soundEnabled = true, onToggleSound }: BattleMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close menu on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirmLeave(false);
      }
    }
    document.addEventListener("pointerdown", handleClick);
    return () => document.removeEventListener("pointerdown", handleClick);
  }, [open]);

  return (
    <div ref={menuRef} className="fixed top-3 right-3 z-40">
      {/* Gear button */}
      <button
        onClick={() => { setOpen(v => !v); setConfirmLeave(false); }}
        className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200"
        style={{
          background: open ? "rgba(200,150,42,0.2)" : "rgba(8,0,20,0.85)",
          border: "1px solid rgba(200,150,42,0.3)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
        }}
        aria-label="Battle menu"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
            stroke="var(--gold-bright)"
            strokeWidth="1.5"
          />
          <path
            d="M16.18 12.32a1.25 1.25 0 00.25 1.38l.04.04a1.5 1.5 0 11-2.12 2.12l-.04-.04a1.25 1.25 0 00-1.38-.25 1.25 1.25 0 00-.76 1.15v.12a1.5 1.5 0 11-3 0v-.06a1.25 1.25 0 00-.82-1.15 1.25 1.25 0 00-1.38.25l-.04.04a1.5 1.5 0 11-2.12-2.12l.04-.04a1.25 1.25 0 00.25-1.38 1.25 1.25 0 00-1.15-.76H3.84a1.5 1.5 0 110-3h.06a1.25 1.25 0 001.15-.82 1.25 1.25 0 00-.25-1.38l-.04-.04a1.5 1.5 0 112.12-2.12l.04.04a1.25 1.25 0 001.38.25h.06a1.25 1.25 0 00.76-1.15V3.84a1.5 1.5 0 013 0v.06a1.25 1.25 0 00.76 1.15 1.25 1.25 0 001.38-.25l.04-.04a1.5 1.5 0 112.12 2.12l-.04.04a1.25 1.25 0 00-.25 1.38v.06a1.25 1.25 0 001.15.76h.12a1.5 1.5 0 110 3h-.06a1.25 1.25 0 00-1.15.76z"
            stroke="var(--gold-bright)"
            strokeWidth="1.2"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-12 right-0 w-48 rounded-lg overflow-hidden animate-slide-up"
          style={{
            background: "rgba(10,0,25,0.95)",
            border: "1px solid rgba(200,150,42,0.3)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Sound toggle */}
          <button
            onClick={() => onToggleSound?.()}
            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
          >
            <span className="text-sm">{soundEnabled ? "🔊" : "🔇"}</span>
            <span className="text-xs tracking-wider uppercase" style={{ color: "var(--text-primary)" }}>
              Sound {soundEnabled ? "On" : "Off"}
            </span>
          </button>

          <div style={{ height: 1, background: "rgba(200,150,42,0.15)" }} />

          {/* Leave battle */}
          {!confirmLeave ? (
            <button
              onClick={() => setConfirmLeave(true)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
            >
              <span className="text-sm">🚪</span>
              <span className="text-xs tracking-wider uppercase" style={{ color: "var(--text-primary)" }}>
                Leave Battle
              </span>
            </button>
          ) : (
            <div className="px-4 py-3">
              <p className="text-[10px] tracking-wider uppercase mb-2" style={{ color: "#ef4444" }}>
                Leaving counts as a loss. Are you sure?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setOpen(false); router.push("/hub"); }}
                  className="flex-1 px-2 py-1.5 rounded text-[10px] font-bold tracking-wider uppercase transition-colors"
                  style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444" }}
                >
                  Leave
                </button>
                <button
                  onClick={() => setConfirmLeave(false)}
                  className="flex-1 px-2 py-1.5 rounded text-[10px] font-bold tracking-wider uppercase transition-colors hover:bg-white/5"
                  style={{ border: "1px solid rgba(200,150,42,0.3)", color: "var(--text-muted)" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
