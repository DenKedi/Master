"use client";

import { useState, useMemo, useCallback } from "react";
import type { CardType, CardRarity, CharacterType } from "@/types";

/* ═══════════════════════════════════════════════════════════════════════════
 *  DeckBuilder — Build / edit a 20-card deck from your collection.
 *
 *  Left pane:  collection cards (filterable)      → click to add
 *  Right pane: current deck contents              → click to remove
 *  Bottom bar: deck name, save/cancel, validation
 * ═══════════════════════════════════════════════════════════════════════════ */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CollectionCard {
  _id: string;
  name: string;
  description: string;
  rarity: CardRarity;
  type: CardType;
  tier: "base" | "advanced";
  imageUrl: string;
  attack: number;
  defense: number;
  effect?: string;
  cost: number;
  characterType?: CharacterType;
}

export interface CollectionEntry {
  _id: string;
  quantity: number;
  cardId: CollectionCard;
}

export interface DeckData {
  _id?: string;
  name: string;
  cards: CollectionCard[];
  isActive: boolean;
}

interface DeckBuilderProps {
  /** All collection entries the player owns */
  collection: CollectionEntry[];
  /** Existing deck to edit (null = create new) */
  deck: DeckData | null;
  /** Required deck size */
  deckSize: number;
  onSave: (name: string, cardIds: string[], isActive: boolean) => Promise<void>;
  onCancel: () => void;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, string> = {
  character: "👤",
  arsenal: "⚔️",
  destination: "🏟️",
  trick: "✨",
};

const CHARACTER_TYPE_ICONS: Record<string, string> = {
  human: "🧑",
  goblin: "👺",
  beast: "🐺",
  demon: "😈",
};

const RARITY_COLORS: Record<string, string> = {
  normal: "#9ca3af",
  nice: "#60a5fa",
  special: "#f87171",
  uiiiii: "#4ade80",
  unknown: "#a855f7",
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function DeckBuilder({
  collection,
  deck,
  deckSize,
  onSave,
  onCancel,
}: DeckBuilderProps) {
  const [deckName, setDeckName] = useState(deck?.name ?? "");
  const [deckCards, setDeckCards] = useState<CollectionCard[]>(deck?.cards ?? []);
  const [isActive, setIsActive] = useState(deck?.isActive ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<CardType | "all">("all");
  const [search, setSearch] = useState("");

  // Count how many of each card are currently in the deck
  const deckCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of deckCards) {
      map.set(c._id, (map.get(c._id) || 0) + 1);
    }
    return map;
  }, [deckCards]);

  // Available cards: collection minus what's already in deck (respecting quantities)
  const availableCards = useMemo(() => {
    return collection
      .filter((e) => {
        if (!e.cardId) return false;
        const inDeck = deckCounts.get(e.cardId._id) ?? 0;
        if (inDeck >= e.quantity) return false;
        if (typeFilter !== "all" && e.cardId.type !== typeFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            e.cardId.name.toLowerCase().includes(q) ||
            e.cardId.type.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .map((e) => ({
        card: e.cardId,
        remaining: e.quantity - (deckCounts.get(e.cardId._id) ?? 0),
      }));
  }, [collection, deckCounts, typeFilter, search]);

  // Deck composition stats
  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    for (const c of deckCards) {
      byType[c.type] = (byType[c.type] || 0) + 1;
    }
    return byType;
  }, [deckCards]);

  const isFull = deckCards.length >= deckSize;
  const isValid = deckCards.length === deckSize && deckName.trim().length > 0;

  const addCard = useCallback(
    (card: CollectionCard) => {
      if (isFull) return;
      setDeckCards((prev) => [...prev, card]);
      setError(null);
    },
    [isFull],
  );

  const removeCard = useCallback((index: number) => {
    setDeckCards((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  }, []);

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(
        deckName.trim(),
        deckCards.map((c) => c._id),
        isActive,
      );
    } catch (e: any) {
      setError(e?.message ?? "Failed to save deck");
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full gap-4 animate-slide-up">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div
            className="text-xs tracking-[0.3em] uppercase mb-1"
            style={{ color: "var(--gold)" }}
          >
            ✦ {deck ? "Edit Deck" : "New Deck"} ✦
          </div>
          <input
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder="Deck Name..."
            maxLength={40}
            className="input-game text-lg font-display font-bold tracking-wider"
            style={{ maxWidth: 300 }}
          />
        </div>
        <div className="flex items-center gap-3">
          <label
            className="flex items-center gap-2 text-xs cursor-pointer select-none"
            style={{ color: isActive ? "var(--gold-bright)" : "var(--text-muted)" }}
          >
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-yellow-500"
            />
            Active Deck
          </label>
          <button
            onClick={onCancel}
            className="btn-game btn-game-arcane px-3 py-1.5 text-xs"
          >
            ✕ Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid || saving}
            className="btn-game btn-game-crimson px-4 py-1.5 text-xs"
          >
            {saving ? "Saving..." : "✦ Save Deck"}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="px-3 py-2 rounded text-sm"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
        >
          {error}
        </div>
      )}

      {/* ── Deck Stats Bar ── */}
      <div
        className="flex items-center gap-4 px-4 py-2 rounded-lg text-xs font-bold tracking-wider"
        style={{
          background: "rgba(15,0,32,0.8)",
          border: `1px solid ${isValid ? "rgba(34,197,94,0.3)" : "rgba(200,150,42,0.2)"}`,
        }}
      >
        <span
          style={{
            color: deckCards.length === deckSize ? "#4ade80" : "var(--gold)",
          }}
        >
          {deckCards.length}/{deckSize} Cards
        </span>
        <span className="h-3 w-px" style={{ background: "rgba(255,255,255,0.1)" }} />
        {(["character", "arsenal", "destination", "trick"] as const).map((t) => (
          <span key={t} style={{ color: "var(--text-muted)" }}>
            {TYPE_ICONS[t]} {stats[t] ?? 0}
          </span>
        ))}
        {/* Progress bar */}
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${(deckCards.length / deckSize) * 100}%`,
              background: deckCards.length === deckSize
                ? "linear-gradient(90deg, #22c55e, #4ade80)"
                : "linear-gradient(90deg, var(--gold-dim), var(--gold))",
            }}
          />
        </div>
      </div>

      {/* ── Main Content: Collection (left) + Deck (right) ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 min-h-0 overflow-hidden">
        {/* Left: Available Cards */}
        <div className="flex flex-col gap-2 min-h-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] font-bold tracking-widest uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              Collection
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="input-game text-xs py-1 px-2"
              style={{ maxWidth: 180 }}
            />
            {(["all", "character", "arsenal", "destination", "trick"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-all"
                style={{
                  color: typeFilter === t ? "#fff" : "var(--text-muted)",
                  background: typeFilter === t ? "rgba(200,150,42,0.15)" : "transparent",
                  border: `1px solid ${typeFilter === t ? "var(--border-gold)" : "rgba(255,255,255,0.05)"}`,
                }}
              >
                {t === "all" ? "All" : `${TYPE_ICONS[t]} ${t}`}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 content-start">
            {availableCards.length === 0 ? (
              <div
                className="col-span-full text-center py-8 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                {deckCards.length >= deckSize
                  ? "Deck is full!"
                  : "No matching cards available"}
              </div>
            ) : (
              availableCards.map(({ card, remaining }) => (
                <button
                  key={card._id}
                  onClick={() => addCard(card)}
                  disabled={isFull}
                  className={`relative flex flex-col border rounded text-left transition-all duration-150 ${
                    isFull ? "opacity-40 cursor-not-allowed" : "card-lift cursor-pointer"
                  }`}
                  style={{
                    background: "linear-gradient(160deg, rgba(15,0,32,0.95), rgba(8,0,18,0.95))",
                    borderColor: RARITY_COLORS[card.rarity] ?? "var(--border-gold)",
                  }}
                >
                  {remaining > 1 && (
                    <span
                      className="absolute top-1 right-1 z-10 text-[10px] font-bold px-1 py-0.5 rounded"
                      style={{ background: "var(--arcane)", color: "#e0ccff" }}
                    >
                      x{remaining}
                    </span>
                  )}
                  <div
                    className="w-full aspect-[3/2] flex items-center justify-center text-3xl"
                    style={{ background: "rgba(0,0,0,0.3)" }}
                  >
                    {TYPE_ICONS[card.type]}
                  </div>
                  <div className="p-2">
                    <div
                      className="text-[10px] font-bold truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {card.name}
                    </div>
                    <div className="flex gap-2 text-[10px] mt-0.5">
                      <span style={{ color: "#f87171" }}>⚔{card.attack}</span>
                      <span style={{ color: "#60a5fa" }}>🛡{card.defense}</span>
                      {card.characterType && (
                        <span style={{ color: "var(--text-muted)" }}>{CHARACTER_TYPE_ICONS[card.characterType] ?? ''}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Current Deck */}
        <div
          className="flex flex-col gap-2 min-h-0 rounded-lg p-3"
          style={{
            background: "linear-gradient(180deg, rgba(15,0,32,0.6), rgba(8,0,18,0.8))",
            border: "1px solid rgba(200,150,42,0.15)",
          }}
        >
          <div
            className="text-[10px] font-bold tracking-widest uppercase"
            style={{ color: "var(--gold)" }}
          >
            ✦ Deck ({deckCards.length}/{deckSize})
          </div>

          <div className="flex-1 overflow-y-auto space-y-1">
            {deckCards.length === 0 ? (
              <div
                className="text-center py-8 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                Click cards on the left to add them
              </div>
            ) : (
              deckCards.map((card, index) => (
                <button
                  key={`${card._id}-${index}`}
                  onClick={() => removeCard(index)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-all duration-150 hover:bg-red-500/10 group"
                  style={{
                    background: "rgba(0,0,0,0.2)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <span className="text-sm flex-shrink-0">
                    {TYPE_ICONS[card.type]}
                  </span>
                  <span
                    className="text-[11px] font-bold truncate flex-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {card.name}
                  </span>
                  {card.characterType && (
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {CHARACTER_TYPE_ICONS[card.characterType] ?? ''}
                    </span>
                  )}
                  <span className="text-[10px]" style={{ color: "#f87171" }}>
                    ⚔{card.attack}
                  </span>
                  <span className="text-[10px]" style={{ color: "#60a5fa" }}>
                    🛡{card.defense}
                  </span>
                  <span
                    className="text-[10px] font-bold capitalize"
                    style={{ color: RARITY_COLORS[card.rarity] }}
                  >
                    {card.rarity === "unknown" ? "?" : card.rarity}
                  </span>
                  <span
                    className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "#ef4444" }}
                  >
                    ✕
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Quick-fill hint */}
          {deckCards.length > 0 && deckCards.length < deckSize && (
            <div className="text-[10px] text-center" style={{ color: "rgba(255,255,255,0.25)" }}>
              Need {deckSize - deckCards.length} more card{deckSize - deckCards.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
