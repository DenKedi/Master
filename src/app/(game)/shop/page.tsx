"use client";
import { useEffect, useState } from "react";
import { IPack } from "@/types";
import LoadingDots from "@/components/ui/LoadingDots";

const TYPE_LABELS: Record<string, string> = {
  standard: "Standard Pack",
  premium: "Premium Pack",
  sale: "🔥 On Sale",
  bundle: "📦 Bundle",
};

export default function ShopPage() {
  const [packs, setPacks] = useState<IPack[]>([]);
  const [currency, setCurrency] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [result, setResult] = useState<{ cards: any[]; packName: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/shop").then((r) => r.json()),
      fetch("/api/currency").then((r) => r.json()),
    ]).then(([shopData, currencyData]) => {
      setPacks(shopData.data ?? []);
      setCurrency(currencyData.data?.balance ?? 0);
      setLoading(false);
    });
  }, []);

  async function buyPack(packId: string) {
    setPurchasing(packId);
    setError("");
    setResult(null);

    const res = await fetch("/api/shop/packs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packId }),
    });
    const data = await res.json();
    setPurchasing(null);

    if (!data.success) {
      setError(data.error ?? "Purchase failed");
    } else {
      setCurrency(data.data.remainingCurrency);
      setResult({ cards: data.data.drawnCards, packName: data.data.packName });
    }
  }

  const effectivePrice = (pack: IPack) =>
    pack.discount ? Math.floor(pack.price * (1 - pack.discount / 100)) : pack.price;

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: 'var(--gold)' }}>✦ Black Market ✦</div>
          <h1 className="font-display font-black text-3xl tracking-widest uppercase text-gold-gradient">Cursed Wares</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Deal with the devil. Bind new monsters.</p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2.5 font-black text-sm font-display shrink-0"
          style={{
            background: 'rgba(200,150,42,0.1)',
            border: '1px solid var(--border-gold)',
            color: 'var(--gold-bright)',
            clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)'
          }}
        >
          🪙 {currency.toLocaleString()}
        </div>
      </div>

      {/* Pack Opening Result Modal */}
      {result && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="relative w-full max-w-lg panel p-8 animate-slide-up">
            <div className="corner-tl" />
            <div className="corner-br" />
        <div className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: 'var(--gold)' }}>✦ Creatures Unbound ✦</div>
            <h2 className="font-display font-black text-2xl tracking-widest uppercase text-gold-gradient mb-1">Pack Torn Open!</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>{result.packName}</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {result.cards.map((card: any, i: number) => (
                <div
                  key={i}
                  className={`rarity-${card.rarity} border-2 flex flex-col items-center p-3 text-center`}
                  style={{
                    background: 'rgba(5,0,15,0.9)',
                    clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))'
                  }}
                >
                  <div className="text-3xl mb-2">📜</div>
                  <div className="text-xs font-bold truncate w-full" style={{ color: 'var(--text-primary)' }}>{card.name}</div>
                  <div className="text-xs capitalize mt-0.5" style={{ color: 'var(--text-muted)' }}>{card.rarity}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setResult(null)} className="btn-game w-full py-3">
              ✔ Bind to Grimoire
            </button>
          </div>
        </div>
      )}

      {error && (
        <div
          className="mb-6 flex items-center gap-2 px-4 py-3 text-sm"
          style={{ background: 'rgba(155,26,42,0.2)', border: '1px solid rgba(155,26,42,0.4)', color: '#ff8888' }}
        >
          ⚠ {error}
        </div>
      )}

      {loading ? (
        <LoadingDots label="The merchant stirs in the dark…" />
      ) : packs.length === 0 ? (
        <div className="flex items-center justify-center h-40" style={{ color: 'var(--text-muted)' }}>No packs available in the realm.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {packs.map((pack) => {
            const price = effectivePrice(pack);
            const canAfford = currency >= price;
            return (
              <div
                key={pack._id}
                className="relative flex flex-col panel card-lift p-6 gap-4"
                style={{ clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))' }}
              >
                <div className="corner-tl" />
                {/* Pack type + discount */}
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className="text-xs font-bold tracking-widest uppercase"
                      style={{ color: pack.type === 'premium' ? '#c084fc' : pack.type === 'sale' ? '#f87171' : 'var(--gold)' }}
                    >
                      {TYPE_LABELS[pack.type] ?? pack.type}
                    </span>
                    <h3 className="font-display font-bold text-base tracking-wider uppercase mt-0.5" style={{ color: 'var(--text-primary)' }}>
                      {pack.name}
                    </h3>
                  </div>
                  {pack.discount && (
                    <span
                    className="btn-game text-xs font-black px-2 py-0.5"
                    style={{ background: 'var(--crimson-bright)', color: '#fff', clipPath: 'polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)' }}
                  >
                    CURSED -{pack.discount}%
                    </span>
                  )}
                </div>

                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{pack.description}</p>

                <div className="flex gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>📦 {pack.cardCount} relics</span>
                  {pack.guaranteedRarity && (
                    <span className="capitalize" style={{ color: 'var(--gold)' }}>☠ 1x {pack.guaranteedRarity} guaranteed</span>
                  )}
                </div>

                {/* Price + Buy */}
                <div
                  className="mt-auto flex items-center justify-between pt-4"
                  style={{ borderTop: '1px solid var(--border-gold)' }}
                >
                  <div>
                    {pack.discount ? (
                      <div className="flex flex-col">
                        <span className="line-through text-xs" style={{ color: 'var(--text-muted)' }}>🪙 {pack.price}</span>
                        <span className="font-black font-display" style={{ color: 'var(--gold-bright)' }}>🪙 {price}</span>
                      </div>
                    ) : (
                      <span className="font-black font-display" style={{ color: 'var(--gold-bright)' }}>🪙 {pack.price}</span>
                    )}
                  </div>
                  <button
                    disabled={!canAfford || purchasing === pack._id}
                    onClick={() => buyPack(pack._id)}
                    className={`btn-game text-sm px-5 py-2 ${!canAfford ? 'btn-game-crimson' : ''}`}
                  >
                    {purchasing === pack._id ? 'Binding...' : canAfford ? '🗡️ Acquire' : 'Insufficient Coins'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
