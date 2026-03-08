"use client";
import { useEffect, useState, useCallback } from "react";
import { CardRarity, CardType, CardTier, CharacterType } from "@/types";
import LoadingDots from "@/components/ui/LoadingDots";
import DeckBuilder, {
  type CollectionCard,
  type CollectionEntry,
  type DeckData,
} from "@/components/cards/DeckBuilder";
import { DECK_SIZE } from "@/lib/battle/constants";

const RARITY_COLORS: Record<string, string> = {
  all: "var(--gold)",
  normal: "#9ca3af",
  nice: "#60a5fa",
  special: "#f87171",
  uiiiii: "#4ade80",
  unknown: "#a855f7",
};

const TYPE_LABELS: Record<CardType, { icon: string; label: string }> = {
  character: { icon: "\u{1F9B9}", label: "Character" },
  arsenal: { icon: "\u2694\uFE0F", label: "Arsenal" },
  destination: { icon: "\u{1F3F0}", label: "Destination" },
  trick: { icon: "\u2728", label: "Trick" },
};

const CHARACTER_TYPE_LABELS: Record<CharacterType, { icon: string; label: string }> = {
  human: { icon: "\u{1F9D1}", label: "Human" },
  goblin: { icon: "\u{1F47A}", label: "Goblin" },
  beast: { icon: "\u{1F43A}", label: "Beast" },
  demon: { icon: "\u{1F608}", label: "Demon" },
};

function FilterButton({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-xs font-bold tracking-widest uppercase transition-all duration-200"
      style={{
        color: active ? "#fff" : color,
        background: active ? `${color}22` : "rgba(15,0,32,0.6)",
        border: `1px solid ${active ? color : "rgba(200,150,42,0.15)"}`,
        clipPath: "polygon(5px 0%, 100% 0%, calc(100% - 5px) 100%, 0% 100%)",
      }}
    >
      {children}
    </button>
  );
}

/* ────────────────────── Deck list types & card ────────────────────── */
interface DeckListEntry {
  _id: string;
  name: string;
  cards: CollectionCard[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function DeckCard({
  deck,
  onEdit,
  onDelete,
  onSetActive,
}: {
  deck: DeckListEntry;
  onEdit: () => void;
  onDelete: () => void;
  onSetActive: () => void;
}) {
  const types = deck.cards.reduce<Record<string, number>>((acc, c) => {
    acc[c.type] = (acc[c.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div
      className="panel p-4 flex flex-col gap-3 transition-all hover:scale-[1.01]"
      style={{
        border: deck.isActive ? "1px solid var(--gold)" : undefined,
        boxShadow: deck.isActive ? "0 0 12px rgba(200,150,42,0.15)" : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-sm tracking-wider uppercase truncate" style={{ color: "var(--text-primary)" }}>
          {deck.name}
        </h3>
        {deck.isActive && (
          <span
            className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded"
            style={{ background: "rgba(200,150,42,0.2)", color: "var(--gold)" }}
          >
            Active
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
        <span>{deck.cards.length}/{DECK_SIZE} cards</span>
        {Object.entries(types).map(([t, n]) => (
          <span key={t}>
            {TYPE_LABELS[t as CardType]?.icon} {n}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-2" style={{ borderTop: "1px solid rgba(200,150,42,0.1)" }}>
        <button onClick={onEdit} className="btn-game px-3 py-1.5 text-xs flex-1">
          ✎ Edit
        </button>
        {!deck.isActive && (
          <button onClick={onSetActive} className="btn-game px-3 py-1.5 text-xs flex-1" style={{ color: "var(--gold)" }}>
            ★ Set Active
          </button>
        )}
        <button
          onClick={onDelete}
          className="btn-game px-3 py-1.5 text-xs"
          style={{ color: "var(--crimson)" }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default function CollectionPage() {
  const [entries, setEntries] = useState<CollectionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [rarityFilter, setRarityFilter] = useState<CardRarity | "all">("all");
  const [typeFilter, setTypeFilter] = useState<CardType | "all">("all");
  const [tierFilter, setTierFilter] = useState<CardTier | "all">("all");
  const [characterTypeFilter, setCharacterTypeFilter] = useState<CharacterType | "all">("all");

  // ─── Deck state ───────────────────────────────────────────────────────
  type ViewMode = "collection" | "decks" | "deck-builder";
  const [viewMode, setViewMode] = useState<ViewMode>("collection");
  const [decks, setDecks] = useState<DeckListEntry[]>([]);
  const [decksLoading, setDecksLoading] = useState(false);
  const [editingDeck, setEditingDeck] = useState<DeckData | null>(null);

  useEffect(() => {
    fetch("/api/cards?mine=true")
      .then((r) => r.json())
      .then((d) => {
        setEntries(d.data ?? []);
        setLoading(false);
      });
  }, []);

  // Fetch decks
  const fetchDecks = useCallback(async () => {
    setDecksLoading(true);
    try {
      const res = await fetch("/api/decks");
      const d = await res.json();
      setDecks(d.data ?? []);
    } finally {
      setDecksLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  // ─── Deck CRUD handlers ───────────────────────────────────────────────
  const handleNewDeck = () => {
    setEditingDeck(null);
    setViewMode("deck-builder");
  };

  const handleEditDeck = (deck: DeckListEntry) => {
    setEditingDeck({
      _id: deck._id,
      name: deck.name,
      cards: deck.cards as CollectionCard[],
      isActive: deck.isActive,
    });
    setViewMode("deck-builder");
  };

  const handleSaveDeck = async (name: string, cardIds: string[], isActive: boolean) => {
    if (editingDeck?._id) {
      // Update
      const res = await fetch(`/api/decks/${editingDeck._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, cards: cardIds, isActive }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error ?? "Failed to save");
    } else {
      // Create
      const res = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, cards: cardIds }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error ?? "Failed to create");
    }
    await fetchDecks();
    setViewMode("decks");
    setEditingDeck(null);
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (!confirm("Delete this deck?")) return;
    await fetch(`/api/decks/${deckId}`, { method: "DELETE" });
    await fetchDecks();
  };

  const handleSetActive = async (deckId: string) => {
    await fetch(`/api/decks/${deckId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: true }),
    });
    await fetchDecks();
  };

  const filtered = entries.filter((e) => {
    if (!e.cardId) return false;
    if (rarityFilter !== "all" && e.cardId.rarity !== rarityFilter) return false;
    if (typeFilter !== "all" && e.cardId.type !== typeFilter) return false;
    if (tierFilter !== "all" && e.cardId.tier !== tierFilter) return false;
    if (characterTypeFilter !== "all" && e.cardId.characterType !== characterTypeFilter) return false;
    return true;
  });

  // ─── Deck Builder mode ─────────────────────────────────────────────────
  if (viewMode === "deck-builder") {
    return (
      <div className="h-[calc(100vh-120px)]">
        <DeckBuilder
          collection={entries}
          deck={editingDeck}
          deckSize={DECK_SIZE}
          onSave={handleSaveDeck}
          onCancel={() => {
            setViewMode("decks");
            setEditingDeck(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div
              className="text-xs tracking-[0.3em] uppercase mb-2"
              style={{ color: "var(--gold)" }}
            >
              {"\u2726"} Collection {"\u2726"}
            </div>
            <h1 className="font-display font-black text-3xl tracking-widest uppercase text-gold-gradient">
              {viewMode === "decks" ? "My Decks" : "My Collection"}
            </h1>
            <p
              className="text-sm mt-1 tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              {viewMode === "decks"
                ? `${decks.length} deck${decks.length !== 1 ? "s" : ""}`
                : `${entries.length} cards collected`}
            </p>
          </div>

          {/* View toggle tabs */}
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "rgba(15,0,32,0.6)", border: "1px solid rgba(200,150,42,0.15)" }}>
            <button
              onClick={() => setViewMode("collection")}
              className="px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all rounded"
              style={{
                color: viewMode === "collection" ? "#fff" : "var(--text-muted)",
                background: viewMode === "collection" ? "rgba(200,150,42,0.2)" : "transparent",
              }}
            >
              🃏 Cards
            </button>
            <button
              onClick={() => setViewMode("decks")}
              className="px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all rounded"
              style={{
                color: viewMode === "decks" ? "#fff" : "var(--text-muted)",
                background: viewMode === "decks" ? "rgba(200,150,42,0.2)" : "transparent",
              }}
            >
              📋 Decks
            </button>
          </div>
        </div>

        {/* Filters (collection view only) */}
        {viewMode === "collection" && (
          <div className="flex flex-col gap-3">
            {/* Rarity */}
            <div className="flex gap-2 flex-wrap items-center">
              <span
                className="text-xs font-bold tracking-widest uppercase mr-1"
                style={{ color: "var(--text-muted)" }}
              >
                Rarity
              </span>
              {(["all", "normal", "nice", "special", "uiiiii", "unknown"] as const).map((r) => (
                <FilterButton
                  key={r}
                  active={rarityFilter === r}
                  color={RARITY_COLORS[r]}
                  onClick={() => setRarityFilter(r)}
                >
                  {r === "unknown" ? "?" : r}
                </FilterButton>
              ))}
            </div>

            {/* Type */}
            <div className="flex gap-2 flex-wrap items-center">
              <span
                className="text-xs font-bold tracking-widest uppercase mr-1"
                style={{ color: "var(--text-muted)" }}
              >
                Type
              </span>
              <FilterButton
                active={typeFilter === "all"}
                color="var(--gold)"
                onClick={() => setTypeFilter("all")}
              >
                All
              </FilterButton>
              {(["character", "arsenal", "destination", "trick"] as const).map((t) => (
                <FilterButton
                  key={t}
                  active={typeFilter === t}
                  color="var(--gold)"
                  onClick={() => setTypeFilter(t)}
                >
                  {TYPE_LABELS[t].icon} {TYPE_LABELS[t].label}
                </FilterButton>
              ))}
            </div>

            {/* Tier */}
            <div className="flex gap-2 flex-wrap items-center">
              <span
                className="text-xs font-bold tracking-widest uppercase mr-1"
                style={{ color: "var(--text-muted)" }}
              >
                Tier
              </span>
              {(["all", "base", "advanced"] as const).map((t) => (
                <FilterButton
                  key={t}
                  active={tierFilter === t}
                  color="var(--gold)"
                  onClick={() => setTierFilter(t)}
                >
                  {t}
                </FilterButton>
              ))}
            </div>

            {/* Character Type */}
            {(typeFilter === "all" || typeFilter === "character") && (
              <div className="flex gap-2 flex-wrap items-center">
                <span
                  className="text-xs font-bold tracking-widest uppercase mr-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Species
                </span>
                <FilterButton
                  active={characterTypeFilter === "all"}
                  color="var(--gold)"
                  onClick={() => setCharacterTypeFilter("all")}
                >
                  All
                </FilterButton>
                {(["human", "goblin", "beast", "demon"] as const).map((ct) => (
                  <FilterButton
                    key={ct}
                    active={characterTypeFilter === ct}
                    color="var(--gold)"
                    onClick={() => setCharacterTypeFilter(ct)}
                  >
                    {CHARACTER_TYPE_LABELS[ct].icon} {CHARACTER_TYPE_LABELS[ct].label}
                  </FilterButton>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ Collection View ═══ */}
      {viewMode === "collection" && (
        <>
          {loading ? (
            <LoadingDots label="Summoning from the Tome…" />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <p className="text-2xl mb-2">{"\u{1F4DC}"}</p>
              <p
                className="font-display font-bold tracking-widest uppercase"
                style={{ color: "var(--gold)" }}
              >
                Arsenal Empty
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                Visit the Black Market to get cards.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map((entry) => {
                const card = entry.cardId;
                if (!card) return null;
                const rarityClass = `rarity-${card.rarity}`;
                const isAdvanced = card.tier === "advanced";

                return (
                  <div
                    key={entry._id}
                    className={`card-lift relative flex flex-col border-2 ${rarityClass}`}
                    style={{
                      background: isAdvanced
                        ? "linear-gradient(160deg, rgba(40,10,60,0.95) 0%, rgba(15,0,32,0.95) 100%)"
                        : "linear-gradient(160deg, rgba(15,0,32,0.95) 0%, rgba(8,0,18,0.95) 100%)",
                      clipPath:
                        "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
                    }}
                  >
                    {entry.quantity > 1 && (
                      <span
                        className="absolute top-2 right-2 z-10 text-xs font-black px-1.5 py-0.5 font-display"
                        style={{
                          background: "var(--arcane)",
                          color: "#e0ccff",
                          clipPath: "polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)",
                        }}
                      >
                        x{entry.quantity}
                      </span>
                    )}
                    {isAdvanced && (
                      <span
                        className="absolute top-2 left-2 z-10 text-[10px] font-black px-1.5 py-0.5 font-display tracking-wider uppercase"
                        style={{
                          background: "linear-gradient(135deg, var(--gold), #d4a017)",
                          color: "#1a0030",
                        }}
                      >
                        ADV
                      </span>
                    )}
                    <div
                      className="w-full aspect-[3/4] flex items-center justify-center text-5xl select-none"
                      style={{ background: "rgba(0,0,0,0.4)" }}
                    >
                      {TYPE_LABELS[card.type].icon}
                    </div>
                    <div className="p-3 flex flex-col gap-1">
                      <div
                        className="font-display font-bold text-xs tracking-wider uppercase truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {card.name}
                      </div>
                      <div
                        className="flex justify-between text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <span className="capitalize">{card.type}{card.characterType ? ` • ${CHARACTER_TYPE_LABELS[card.characterType as CharacterType]?.icon ?? ''} ${card.characterType}` : ''}</span>
                        <span className={`font-bold capitalize rarity-${card.rarity}`}>
                          {card.rarity === "unknown" ? "?" : card.rarity}
                        </span>
                      </div>
                      <div className="flex gap-3 text-xs mt-1">
                        <span style={{ color: "#f87171" }}>{"\u2694"} {card.attack}</span>
                        <span style={{ color: "#60a5fa" }}>{"\u{1F6E1}"} {card.defense}</span>
                      </div>
                      {card.effect && (
                        <div
                          className="text-[10px] mt-1 italic truncate"
                          style={{ color: "var(--gold)" }}
                          title={card.effect}
                        >
                          {"\u2728"} {card.effect}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ═══ Decks View ═══ */}
      {viewMode === "decks" && (
        <div>
          {/* New Deck button */}
          <div className="mb-6">
            <button
              onClick={handleNewDeck}
              className="btn-game btn-game-crimson px-5 py-2.5 text-sm"
            >
              ✦ Build New Deck
            </button>
          </div>

          {decksLoading ? (
            <LoadingDots label="Loading decks…" />
          ) : decks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <p className="text-2xl mb-2">📋</p>
              <p
                className="font-display font-bold tracking-widest uppercase"
                style={{ color: "var(--gold)" }}
              >
                No Decks Yet
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                Build your first deck of {DECK_SIZE} cards to use in battle.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {decks.map((d) => (
                <DeckCard
                  key={d._id}
                  deck={d}
                  onEdit={() => handleEditDeck(d)}
                  onDelete={() => handleDeleteDeck(d._id)}
                  onSetActive={() => handleSetActive(d._id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
