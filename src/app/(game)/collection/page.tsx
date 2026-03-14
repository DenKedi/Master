"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useSearchParams, useRouter } from "next/navigation";
import { CardRarity, CardType, CharacterType } from "@/types";
import LoadingDots from "@/components/ui/LoadingDots";
import FlippableCard from "@/components/ui/FlippableCard";
import DeckBuilder, {
  type CollectionCard,
  type CollectionEntry,
  type DeckData,
} from "@/components/cards/DeckBuilder";
import { MIN_DECK_SIZE, MAX_DECK_SIZE } from "@/lib/battle/constants";
import { usePrefetch } from "@/hooks/usePrefetch";
import { RENDER_V } from "@/lib/renderVersion";
import { RARITY_COLORS } from "@/lib/rarityColors";

import Image from "next/image";

const RARITY_FILTER_COLORS: Record<string, string> = {
  all: "var(--gold)",
  ...RARITY_COLORS,
};

const RARITY_ORDER: Record<string, number> = {
  unknown: 5,
  uiiiii: 4,
  special: 3,
  nice: 2,
  normal: 1,
};

const TYPE_LABELS: Record<CardType, { icon: React.ReactNode; label: string }> = {
  character: { icon: <Image src="/icons/types/character.png" alt="Character" width={16} height={16} className="inline-block" />, label: "Character" },
  arsenal: { icon: <Image src="/icons/types/arsenal.png" alt="Arsenal" width={16} height={16} className="inline-block" />, label: "Arsenal" },
  destination: { icon: <Image src="/icons/types/destination.png" alt="Destination" width={16} height={16} className="inline-block" />, label: "Destination" },
  trick: { icon: <Image src="/icons/types/trick.png" alt="Trick" width={16} height={16} className="inline-block" />, label: "Trick" },
};

const CHARACTER_TYPE_LABELS: Record<CharacterType, { icon: React.ReactNode; label: string }> = {
  human: { icon: <Image src="/icons/character-types/human.png" alt="Human" width={16} height={16} className="inline-block" />, label: "Human" },
  goblin: { icon: <Image src="/icons/character-types/goblin.png" alt="Goblin" width={16} height={16} className="inline-block" />, label: "Goblin" },
  beast: { icon: <Image src="/icons/character-types/beast.png" alt="Beast" width={16} height={16} className="inline-block" />, label: "Beast" },
  underworld: { icon: <Image src="/icons/character-types/underworld.png" alt="Underworld" width={16} height={16} className="inline-block" />, label: "Underworld" },
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
  onSetActive,
}: {
  deck: DeckListEntry;
  onEdit: () => void;
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
        <span>{deck.cards.length}/{MAX_DECK_SIZE} cards</span>
        {Object.entries(types).map(([t, n]) => (
          <span key={t}>
            {TYPE_LABELS[t as CardType]?.icon} {n}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-2 justify-end" style={{ borderTop: "1px solid rgba(200,150,42,0.1)" }}>
        <button onClick={onEdit} className="btn-game px-2 py-1 text-[11px] font-bold tracking-wider">
          ✎ EDIT
        </button>
        {!deck.isActive && (
          <button onClick={onSetActive} className="btn-game px-2 py-1 text-[11px] font-bold tracking-wider" style={{ color: "var(--gold)" }}>
            ★ SET ACTIVE
          </button>
        )}
      </div>
    </div>
  );
}

export default function CollectionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const prefetch = usePrefetch();
  const [entries, setEntries] = useState<CollectionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [rarityFilter, setRarityFilter] = useState<CardRarity | "all">("all");
  const [typeFilter, setTypeFilter] = useState<CardType | "all">("all");

  const [characterTypeFilter, setCharacterTypeFilter] = useState<CharacterType | "all">("all");
  const [showNewDeckBanner, setShowNewDeckBanner] = useState(false);

  // ─── Deck state ───────────────────────────────────────────────────────
  type ViewMode = "collection" | "decks" | "deck-builder";
  const [viewMode, setViewMode] = useState<ViewMode>("collection");
  const [decks, setDecks] = useState<DeckListEntry[]>([]);
  const [decksLoading, setDecksLoading] = useState(false);
  const [editingDeck, setEditingDeck] = useState<DeckData | null>(null);

  // ─── Card preview state ────────────────────────────────────────────────
  const [previewCard, setPreviewCard] = useState<CollectionCard | null>(null);

  // ─── New deck notification from tutorial ───────────────────────────────
  useEffect(() => {
    if (searchParams.get("newDeck") === "1") {
      setShowNewDeckBanner(true);
      setViewMode("decks");
      // Clean the URL without triggering navigation
      router.replace("/collection", { scroll: false });
    }
  }, [searchParams, router]);

  // Seed from prefetch (cards)
  useEffect(() => {
    if (prefetch.cards.data) {
      setEntries(prefetch.cards.data);
      setLoading(false);
    }
  }, [prefetch.cards.data]);

  // Seed from prefetch (decks)
  useEffect(() => {
    if (prefetch.decks.data) {
      setDecks(prefetch.decks.data);
      setDecksLoading(false);
    }
  }, [prefetch.decks.data]);

  // Re-fetch decks (used after mutations)
  const fetchDecks = useCallback(async () => {
    setDecksLoading(true);
    try {
      const res = await fetch("/api/decks");
      if (!res.ok) {
        console.warn("fetchDecks: server responded", res.status);
        setDecks([]);
        return;
      }
      const d = await res.json();
      setDecks(d.data ?? []);
    } catch (err) {
      console.warn("fetchDecks error:", err);
      setDecks([]);
    } finally {
      setDecksLoading(false);
    }
  }, []);

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
    if (characterTypeFilter !== "all" && e.cardId.characterType !== characterTypeFilter) return false;
    return true;
  }).sort((a, b) => {
    const rarityA = RARITY_ORDER[a.cardId?.rarity || "normal"] || 0;
    const rarityB = RARITY_ORDER[b.cardId?.rarity || "normal"] || 0;
    if (rarityA !== rarityB) {
      return rarityB - rarityA;
    }
    return (a.cardId?.name || "").localeCompare(b.cardId?.name || "");
  });

  // ─── Deck Builder mode ─────────────────────────────────────────────────
  if (viewMode === "deck-builder") {
    return (
      <div className="h-[calc(100vh-120px)]">
        <DeckBuilder
          collection={entries}
          deck={editingDeck}
          deckSize={MAX_DECK_SIZE}
          minDeckSize={MIN_DECK_SIZE}
          onSave={handleSaveDeck}
          onCancel={() => {
            setViewMode("decks");
            setEditingDeck(null);
          }}
          onDelete={editingDeck?._id ? async () => {
             await handleDeleteDeck(editingDeck._id as string);
             setViewMode("decks");
             setEditingDeck(null);
          } : undefined}
        />
      </div>
    );
  }

  return (
    <>
    <div className="animate-slide-up">
      {/* ─── New Deck Acquired Banner ─── */}
      {showNewDeckBanner && (
        <div
          className="mb-6 p-4 rounded-lg flex items-center justify-between gap-4 animate-slide-up"
          style={{
            background: "linear-gradient(135deg, rgba(200,150,42,0.15), rgba(15,0,32,0.9))",
            border: "1px solid rgba(200,150,42,0.4)",
            boxShadow: "0 0 20px rgba(200,150,42,0.15)",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <div className="font-display font-bold text-sm tracking-wider uppercase" style={{ color: "var(--gold)" }}>
                New Deck Acquired: First Steps
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Your starter deck and cards have been added to your collection!
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowNewDeckBanner(false)}
            className="text-sm px-3 py-1 rounded transition-colors hover:bg-white/10"
            style={{ color: "var(--text-muted)" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div
              className="text-xs tracking-[0.3em] uppercase mb-2"
              style={{ color: "var(--gold)" }}
            >
              {"\u2726"} MASTER OF {"\u2726"}
            </div>
            <h1 className="font-display font-black text-3xl tracking-widest uppercase text-gold-gradient">
              {viewMode === "decks" ? "Decks" : "Cards"}
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
                  color={RARITY_FILTER_COLORS[r]}
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
                {(["human", "goblin", "beast", "underworld"] as const).map((ct) => (
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filtered.map((entry) => {
                const card = entry.cardId;
                if (!card) return null;

                return (
                  <div
                    key={entry._id}
                    className="card-lift relative rounded-lg overflow-hidden border-2 transition-all duration-150 cursor-pointer"
                    style={{
                      borderColor: RARITY_COLORS[card.rarity] ?? "var(--border-gold)",
                    }}
                    onClick={() => setPreviewCard(card)}
                  >
                    {entry.quantity > 1 && (
                      <span
                        className="absolute top-1.5 right-1.5 z-10 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: "rgba(0,0,0,0.75)",
                          color: RARITY_COLORS[card.rarity],
                          border: `1px solid ${RARITY_COLORS[card.rarity]}44`,
                        }}
                      >
                        ×{entry.quantity}
                      </span>
                    )}

                    {card.type === "destination" ? (
                      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "560/880" }}>
                        <img
                          src={`/api/cards/render/${encodeURIComponent(card.cardId)}?v=${RENDER_V}`}
                          alt={card.name}
                          loading="lazy"
                          draggable={false}
                          className="absolute top-1/2 left-1/2 drop-shadow-md"
                          onLoad={(e) => { (e.target as HTMLElement).style.opacity = '1'; }}
                          style={{
                            width: "157.14%",
                            height: "auto",
                            transform: "translate(-50%, -50%) rotate(90deg)",
                            opacity: 0,
                            transition: "opacity 0.3s ease",
                            maxWidth: "none",
                          }}
                        />
                      </div>
                    ) : (
                      <img
                        src={`/api/cards/render/${encodeURIComponent(card.cardId)}?v=${RENDER_V}`}
                        alt={card.name}
                        loading="lazy"
                        draggable={false}
                        className="w-full h-auto drop-shadow-md"
                        onLoad={(e) => { (e.target as HTMLElement).style.opacity = '1'; }}
                        style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
                      />
                    )}
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
                Build your first deck of {MIN_DECK_SIZE}–{MAX_DECK_SIZE} cards to use in battle.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {decks.map((d) => (
                <DeckCard
                  key={d._id}
                  deck={d}
                  onEdit={() => handleEditDeck(d)}
                  onSetActive={() => handleSetActive(d._id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

    </div>

      {/* ═══ Card Preview Modal (portal) ═══ */}
      {previewCard && createPortal(
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.92)",
          }}
          onClick={() => setPreviewCard(null)}
        >
          {/* Close button */}
          <button
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 10000,
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              fontSize: 20,
              fontWeight: 700,
              background: "rgba(0,0,0,0.6)",
              color: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(255,255,255,0.15)",
              cursor: "pointer",
            }}
            onClick={(e) => { e.stopPropagation(); setPreviewCard(null); }}
          >
            ✕
          </button>

          {/* FlippableCard with holographic spin */}
          <div onClick={(e) => e.stopPropagation()} style={{ width: "min(80vw, 340px)" }}>
            <FlippableCard
              frontSrc={`/api/cards/render/${encodeURIComponent(previewCard.cardId)}?v=${RENDER_V}`}
              name={previewCard.name}
              rarity={previewCard.rarity}
              rarityColor={RARITY_COLORS[previewCard.rarity] ?? "#9ca3af"}
              cardType={previewCard.type as any}
            />
          </div>
        </div>,
        document.body
      )}


    </>
  );
}
