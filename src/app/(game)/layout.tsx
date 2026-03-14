"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/ui/Navbar";
import { PrefetchProvider } from "@/hooks/usePrefetch";

/** Routes where the sidebar is replaced by an in-battle menu */
const BATTLE_ROUTES = ["/hub/battle-v2"];

export default function GameLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBattle = BATTLE_ROUTES.some(r => pathname.startsWith(r));

  return (
    <PrefetchProvider>
      <div className="h-screen flex overflow-hidden" style={{ background: 'var(--bg-void)' }}>
        <main className={`flex-1 min-w-0 ${isBattle ? "overflow-hidden" : "overflow-y-auto px-4 sm:px-8 lg:px-12 py-3"} ${isBattle ? "" : "lg:mr-[280px]"}`}>
          {children}
        </main>
        {!isBattle && <Sidebar />}
      </div>
    </PrefetchProvider>
  );
}
