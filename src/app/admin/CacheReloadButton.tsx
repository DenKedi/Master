"use client";
import { useState } from "react";

export default function CacheReloadButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [info, setInfo] = useState("");

  async function handleReload() {
    setStatus("loading");
    setInfo("");
    try {
      const res = await fetch("/api/admin/cache", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setStatus("done");
        setInfo(`Cards: ${data.data.cardsAfter} | Fonts cleared`);
        setTimeout(() => setStatus("idle"), 4000);
      } else {
        setStatus("error");
        setInfo(data.error ?? "Failed");
      }
    } catch {
      setStatus("error");
      setInfo("Network error");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleReload}
        disabled={status === "loading"}
        className="px-5 py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50"
        style={{
          background: status === "done" ? "rgba(34,197,94,0.2)" : "rgba(180,80,240,0.15)",
          border: `1px solid ${status === "done" ? "rgba(34,197,94,0.4)" : "rgba(180,80,240,0.3)"}`,
          color: status === "done" ? "#4ade80" : "#c084fc",
        }}
      >
        {status === "loading" ? "Reloading..." : status === "done" ? "Reloaded" : "Reload All Caches"}
      </button>
      {info && (
        <span className="text-xs" style={{ color: status === "error" ? "#f87171" : "rgba(200,150,240,0.7)" }}>
          {info}
        </span>
      )}
    </div>
  );
}
