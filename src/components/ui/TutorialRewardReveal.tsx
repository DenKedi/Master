"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import CardRevealOverlay, { type RevealCard } from "./CardRevealOverlay";
import { STARTER_DECK_CARDS } from "@/lib/battle/tutorial";
import { usePrefetch } from "@/hooks/usePrefetch";

export default function TutorialRewardReveal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const prefetch = usePrefetch();
  const [dismissed, setDismissed] = useState(false);

  const tutorialWon = searchParams.get("tutorialWon") === "1";

  // Guarantee the user actually gets the cards and deck on the server
  // in case the battle page unmounted too fast or didn't send the request.
  useEffect(() => {
    if (tutorialWon && !dismissed) {
      fetch("/api/tutorial", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorialCompleted: true }),
      }).then(() => {
        // Refetch the globally cached cards and decks so the Collection page sees them immediately!
        prefetch.cards.refetch();
        prefetch.decks.refetch();
      }).catch(console.error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorialWon, dismissed]);

  if (!tutorialWon || dismissed) return null;

  const cards: RevealCard[] = STARTER_DECK_CARDS.map((entry) => ({
    name: entry.cardId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    cardId: entry.cardId,
    rarity: "normal",
    quantity: entry.quantity,
  }));

  return (
    <CardRevealOverlay
      cards={cards}
      title="Starter Deck Acquired!"
      subtitle="First Steps — Your journey begins"
      onComplete={() => {
        setDismissed(true);
        router.replace("/hub");
      }}
    />
  );
}
