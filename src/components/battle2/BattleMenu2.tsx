"use client";

import { MenuIcon, SpeakerIcon, SpeakerOffIcon, LeaveIcon } from "./icons";
import { useState, useRef, useEffect } from "react";

interface BattleMenu2Props {
  onLeave?: () => void;
}

export default function BattleMenu2({ onLeave }: BattleMenu2Props) {
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Click-outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirmLeave(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={menuRef} className="absolute top-3 right-3 z-30">
      {/* Trigger */}
      <button
        className="b2-btn p-2"
        onClick={() => {
          setOpen(!open);
          setConfirmLeave(false);
        }}
        aria-label="Battle menu"
      >
        <MenuIcon size={18} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full right-0 mt-2 b2-glass-strong rounded-lg min-w-[180px] py-1.5 b2-animate-slide-down">
          {/* Sound toggle */}
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-white/5 transition-colors"
            onClick={() => setMuted(!muted)}
          >
            {muted ? (
              <SpeakerOffIcon size={16} style={{ color: "var(--b2-text-muted)" }} />
            ) : (
              <SpeakerIcon size={16} style={{ color: "var(--b2-text-muted)" }} />
            )}
            <span style={{ color: "var(--b2-text)" }}>
              Sound {muted ? "Off" : "On"}
            </span>
          </button>

          {/* Divider */}
          <div className="my-1 mx-3 h-px" style={{ background: "var(--b2-border)" }} />

          {/* Leave */}
          {confirmLeave ? (
            <div className="px-3 py-2">
              <p className="text-xs mb-2" style={{ color: "var(--b2-danger)" }}>
                Leave this battle?
              </p>
              <div className="flex gap-2">
                <button
                  className="b2-btn b2-btn-danger flex-1 text-xs py-1.5"
                  onClick={() => {
                    setOpen(false);
                    onLeave?.();
                  }}
                >
                  Leave
                </button>
                <button
                  className="b2-btn flex-1 text-xs py-1.5"
                  onClick={() => setConfirmLeave(false)}
                >
                  Stay
                </button>
              </div>
            </div>
          ) : (
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-white/5 transition-colors"
              onClick={() => setConfirmLeave(true)}
            >
              <LeaveIcon size={16} style={{ color: "var(--b2-danger)" }} />
              <span style={{ color: "var(--b2-danger)" }}>Leave Battle</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
