"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import ArmoryPanel from "@/components/shop/ArmoryPanel";
import FlippableCard from "@/components/ui/FlippableCard";
import { RENDER_V } from "@/lib/renderVersion";
import { RARITY_COLORS } from "@/lib/rarityColors";
import { usePrefetch } from "@/hooks/usePrefetch";

export default function ShopPage() {
  const prefetch = usePrefetch();
  const [data, setData] = useState<{ packs: any[]; sleeves: any[]; cards: any[] }>({ packs: [], sleeves: [], cards: [] });
  const [ownedCardIds, setOwnedCardIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [previewCard, setPreviewCard] = useState<any | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/store").then(res => res.json()),
      fetch("/api/admin/store/sleeves").then(res => res.json()),
      fetch("/api/admin/store/cards").then(res => res.json()),
      fetch("/api/shop/cards").then(res => res.json()),
    ]).then(([packRes, sleeveRes, cardRes, ownedRes]) => {
      setData({ packs: packRes.data || [], sleeves: sleeveRes.data || [], cards: cardRes.data || [] });
      setOwnedCardIds(new Set((ownedRes.data?.ownedIds ?? []) as string[]));
      setLoading(false);
    });
  }, []);

  const handleBuy = useCallback(async (cardId: string) => {
    setBuying(cardId);
    setBuyError(null);
    try {
      const res = await fetch("/api/shop/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setBuyError(json.error ?? "Purchase failed");
      } else {
        setOwnedCardIds(prev => new Set([...prev, cardId]));
        prefetch.cards.refetch();
        if (previewCard?._id === cardId) {
          setBuyError(null);
        }
      }
    } catch {
      setBuyError("Network error");
    } finally {
      setBuying(null);
    }
  }, [previewCard]);

  if (loading) return <div className="text-white p-10">Loading Store...</div>;

  const featuredPacks = data.packs.filter(p => p.isActive && p.isFeatured);
  const featureSleeves = data.sleeves.filter(s => s.isActive && s.isFeatured);
  const featuredCards = data.cards.filter(c => c.isActive && c.isFeatured && c.price > 0);
  const featuredItems = [
    ...featuredPacks.map(p => ({ ...p, itemType: "pack" })),
    ...featureSleeves.map(s => ({ ...s, itemType: "sleeve" })),
    ...featuredCards.map(c => ({ ...c, itemType: "card" })),
  ];

  const standardPacks = data.packs.filter(p => p.isActive && !p.isFeatured);
  const standardSleeves = data.sleeves.filter(s => s.isActive && !s.isFeatured);
  const standardCards = data.cards.filter(c => c.isActive && !c.isFeatured && c.price > 0);

  return (
    <>
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-12">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white mb-2 pb-2 border-b-2 border-white/20">Featured Offers</h1>
          {featuredItems.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
              {featuredItems.map(item => (
                <ArmoryPanel
                  key={item._id}
                  id={item._id}
                  itemType={item.itemType as any}
                  name={item.name}
                  typeLabel={item.itemType === 'pack' ? 'Card Pack' : item.itemType === 'sleeve' ? 'Card Sleeve' : 'Single Card'}
                  price={item.price}
                  imageUrl={item.imageUrl || item.renderUrl}
                  rarity={item.rarity ?? 'special'}
                  owned={item.itemType === 'card' ? ownedCardIds.has(item._id) : undefined}
                  onClick={(id) => {
                    if (item.itemType === 'card') {
                      setBuyError(null);
                      setPreviewCard(item);
                    }
                  }}
                  onBuy={item.itemType === 'card' ? handleBuy : undefined}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic mt-6">Check back soon for featured items!</p>
          )}
        </div>

        {standardPacks.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-6 relative">
               <div className="h-px bg-white/10 flex-grow" />
               <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">Card Packs</h2>
               <div className="h-px bg-white/10 flex-grow" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {standardPacks.map(p => (
                <ArmoryPanel
                  key={p._id}
                  id={p._id}
                  itemType="pack"
                  name={p.name}
                  typeLabel="Standard Pack"
                  price={p.price}
                  imageUrl={p.imageUrl}
                  rarity="normal"
                  onClick={() => console.log('Buy', p._id)}
                />
              ))}
            </div>
          </section>
        )}

        {standardSleeves.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-6 relative">
               <div className="h-px bg-white/10 flex-grow" />
               <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">Card Sleeves</h2>
               <div className="h-px bg-white/10 flex-grow" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {standardSleeves.map(s => (
                <ArmoryPanel
                  key={s._id}
                  id={s._id}
                  itemType="sleeve"
                  name={s.name}
                  typeLabel="Kosmetic Sleeve"
                  price={s.price}
                  imageUrl={s.imageUrl}
                  rarity="nice"
                  onClick={() => console.log('Buy', s._id)}
                />
              ))}
            </div>
          </section>
        )}

        {standardCards.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-6 relative">
               <div className="h-px bg-white/10 flex-grow" />
               <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">Single Cards</h2>
               <div className="h-px bg-white/10 flex-grow" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {standardCards.map(c => (
                <ArmoryPanel
                  key={c._id}
                  id={c._id}
                  itemType="card"
                  name={c.name}
                  typeLabel="Single Card"
                  price={c.price}
                  imageUrl={c.imageUrl || c.renderUrl}
                  rarity={c.rarity ?? 'normal'}
                  owned={ownedCardIds.has(c._id)}
                  onClick={() => { setBuyError(null); setPreviewCard(c); }}
                  onBuy={handleBuy}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Card Preview Modal */}
      {previewCard && typeof window !== "undefined" && createPortal(
        <div
          className="fixed inset-0 bg-black/85 z-[200] flex items-center justify-center p-4"
          onClick={() => { setPreviewCard(null); setBuyError(null); }}
        >
          <div
            className="relative flex flex-col items-center gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => { setPreviewCard(null); setBuyError(null); }}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-gray-800 border border-white/20 text-white text-sm flex items-center justify-center hover:bg-gray-700 transition-colors"
            >
              ✕
            </button>

            {/* FlippableCard — use cardId slug for unambiguous render lookup */}
            <div style={{ width: "min(80vw, 280px)" }}>
              <FlippableCard
                frontSrc={`/api/cards/render/${encodeURIComponent(previewCard.cardId)}?v=${RENDER_V}`}
                name={previewCard.name}
                rarity={previewCard.rarity}
                rarityColor={RARITY_COLORS[previewCard.rarity] ?? "rgba(200,150,42,0.6)"}
                cardType={previewCard.type}
              />
            </div>

            {/* Card Info */}
            <div className="text-center">
              <p className="text-xl font-black text-white">{previewCard.name}</p>
              <p className="text-xs uppercase tracking-widest text-gray-400 mt-0.5">{previewCard.type} · {previewCard.rarity}</p>
              <div className="flex items-center justify-center gap-1 mt-2 text-[var(--gold-bright)]">
                <span>🪙</span>
                <span className="font-bold text-lg">{previewCard.price}</span>
              </div>
            </div>

            {/* Buy / Owned */}
            {ownedCardIds.has(previewCard._id) ? (
              <div className="bg-green-900/40 border border-green-600/50 text-green-400 font-bold text-sm px-6 py-2 rounded-lg">
                ✓ Already in your collection
              </div>
            ) : (
              <button
                onClick={() => handleBuy(previewCard._id)}
                disabled={buying === previewCard._id}
                className="bg-[var(--gold)] hover:bg-[var(--gold-bright)] disabled:opacity-60 text-black font-black uppercase tracking-wider text-sm px-8 py-2.5 rounded-lg transition-colors"
              >
                {buying === previewCard._id ? "Buying…" : `Buy for 🪙 ${previewCard.price}`}
              </button>
            )}

            {buyError && (
              <p className="text-red-400 text-sm font-semibold">{buyError}</p>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
