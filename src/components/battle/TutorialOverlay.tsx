"use client";

import { useState, useEffect } from "react";

interface TutorialOverlayProps {
  title: string;
  description: string;
  instruction: string;
  stepIndex: number;
  totalSteps: number;
  blocking: boolean;
  onContinue?: () => void;
  /** When blocking=true and there's a required action, don't show the Continue button */
  waitingForAction?: boolean;
}

export default function TutorialOverlay({
  title,
  description,
  instruction,
  stepIndex,
  totalSteps,
  blocking,
  onContinue,
  waitingForAction,
}: TutorialOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, [stepIndex]);

  if (!blocking && !visible) return null;

  // Non-blocking: render as a floating tooltip on the left side
  if (!blocking) {
    return (
      <div
        className="fixed top-1/2 left-4 -translate-y-1/2 z-40 max-w-xs w-full animate-slide-up"
        style={{ pointerEvents: "none" }}
      >
        <div
          className="rounded-lg px-4 py-3"
          style={{
            background: "rgba(10,0,25,0.9)",
            border: "1px solid rgba(200,150,42,0.3)",
            backdropFilter: "blur(8px)",
            pointerEvents: "auto",
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs" style={{ color: "var(--gold)" }}>
              📖 Step {stepIndex + 1}/{totalSteps}
            </span>
            <span
              className="text-[10px] font-display font-bold tracking-wider uppercase"
              style={{ color: "var(--gold-bright)" }}
            >
              {title}
            </span>
          </div>
          <div
            className="text-xs leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            {renderMarkdown(instruction)}
          </div>
        </div>
      </div>
    );
  }

  // Blocking: full overlay with spotlight
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ pointerEvents: "auto" }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Dialog */}
      <div
        className="relative max-w-lg w-full mx-4 rounded-lg overflow-hidden animate-slide-up"
        style={{
          background: "linear-gradient(135deg, rgba(15,0,32,0.98), rgba(8,0,18,0.98))",
          border: "1px solid rgba(200,150,42,0.4)",
          boxShadow: "0 0 40px rgba(200,150,42,0.15), 0 0 80px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4"
          style={{
            background: "linear-gradient(135deg, rgba(200,150,42,0.1), rgba(200,150,42,0.02))",
            borderBottom: "1px solid rgba(200,150,42,0.15)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] tracking-[0.3em] uppercase mb-1" style={{ color: "var(--gold-dim)" }}>
                ✦ Tutorial · Step {stepIndex + 1}/{totalSteps} ✦
              </div>
              <h2 className="font-display font-bold text-lg tracking-wider uppercase text-gold-gradient">
                {title}
              </h2>
            </div>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {description}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <div
            className="text-sm leading-relaxed"
            style={{ color: "var(--text-primary)" }}
          >
            {renderMarkdown(instruction)}
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 flex items-center justify-end gap-3"
          style={{ borderTop: "1px solid rgba(200,150,42,0.1)" }}
        >
          {waitingForAction ? (
            <div
              className="text-xs tracking-wider uppercase"
              style={{ color: "var(--gold-dim)" }}
            >
              ▸ Perform the action above to continue
            </div>
          ) : (
            <button
              onClick={onContinue}
              className="btn-game px-6 py-2 text-sm"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Simple markdown-like renderer for bold text */
function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} style={{ color: "var(--gold-bright)" }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    // Handle newlines
    return part.split("\n").map((line, j) => (
      <span key={`${i}-${j}`}>
        {j > 0 && <br />}
        {line}
      </span>
    ));
  });
}
