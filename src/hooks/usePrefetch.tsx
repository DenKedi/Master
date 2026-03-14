"use client";
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";

/* ─── Shape of every prefetched bucket ──────────────────────────────── */
interface Bucket<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Re-fetch this bucket (e.g. after a mutation) */
  refetch: () => void;
}

interface PrefetchContextValue {
  /** /api/cards?mine=true  → collection entries */
  cards: Bucket<any[]>;
  /** /api/decks            → user decks */
  decks: Bucket<any[]>;
  /** /api/shop             → packs */
  shop: Bucket<any[]>;
  /** /api/currency         → { balance, history } */
  currency: Bucket<{ balance: number; history: any[] }>;
  /** /api/friends          → { friends, pending, sent } */
  friends: Bucket<{ friends: any[]; pending: any[]; sent: any[] }>;
  /** Overall progress 0-1 */
  progress: number;
  /** True while any bucket is still loading */
  loading: boolean;
}

const PrefetchContext = createContext<PrefetchContextValue | null>(null);

/* ─── Generic fetcher ───────────────────────────────────────────────── */
function useBucket<T>(url: string, extract: (json: any) => T): Bucket<T> & { _done: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const doFetch = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(url, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (mounted.current) setData(extract(json));
      })
      .catch((err) => {
        if (mounted.current) setError(err.message);
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  useEffect(() => {
    mounted.current = true;
    doFetch();
    return () => { mounted.current = false; };
  }, [doFetch]);

  return { data, loading, error, refetch: doFetch, _done: !loading };
}

/* ─── Provider ──────────────────────────────────────────────────────── */
export function PrefetchProvider({ children }: { children: React.ReactNode }) {
  const cards = useBucket<any[]>("/api/cards?mine=true", (j) => j.data ?? []);
  const decks = useBucket<any[]>("/api/decks", (j) => j.data ?? []);
  const shop = useBucket<any[]>("/api/shop", (j) => j.data ?? []);
  const currency = useBucket<{ balance: number; history: any[] }>(
    "/api/currency",
    (j) => j.data ?? { balance: 0, history: [] },
  );
  const friends = useBucket<{ friends: any[]; pending: any[]; sent: any[] }>(
    "/api/friends",
    (j) => ({
      friends: j.data?.friends ?? [],
      pending: j.data?.pending ?? [],
      sent: j.data?.sent ?? [],
    }),
  );

  const buckets = [cards, decks, shop, currency, friends];
  const doneCount = buckets.filter((b) => b._done).length;
  const progress = doneCount / buckets.length;
  const loading = doneCount < buckets.length;

  return (
    <PrefetchContext.Provider value={{ cards, decks, shop, currency, friends, progress, loading }}>
      {children}
    </PrefetchContext.Provider>
  );
}

/* ─── Hook ──────────────────────────────────────────────────────────── */
export function usePrefetch() {
  const ctx = useContext(PrefetchContext);
  if (!ctx) throw new Error("usePrefetch must be used within PrefetchProvider");
  return ctx;
}
