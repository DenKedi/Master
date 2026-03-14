import { auth } from "@/lib/nextauth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin") {
    redirect("/hub");
  }

  const navItems = [
    { href: "/admin/cards",      label: "Cards",      icon: "🃏" },
    { href: "/admin",            label: "Overlord",   icon: "👁" },
    { href: "/admin/users",      label: "Goblins",   icon: "💀" },
    { href: "/admin/statistics", label: "Dark Tome",  icon: "📜" },
    { href: "/admin/store",      label: "Black Market",icon: "🗡️" },
  ];

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: 'var(--bg-void)' }}>
      {/* Sidebar */}
      <aside
        className="w-56 shrink-0 flex flex-col p-5 gap-1 h-screen sticky top-0"
        style={{
          background: 'linear-gradient(180deg, rgba(20,0,40,0.98) 0%, rgba(10,0,20,0.98) 100%)',
          borderRight: '1px solid rgba(180,80,240,0.25)',
          boxShadow: '4px 0 20px rgba(0,0,0,0.5)'
        }}
      >
        <div className="text-xs tracking-[0.3em] uppercase mb-5 font-display font-bold" style={{ color: '#e040fb' }}>
          👁 Overlord Sanctum
        </div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold tracking-widest uppercase transition-all duration-200"
            style={{
              color: 'rgba(200,150,240,0.7)',
              borderLeft: '2px solid transparent',
            }}
          >
            <span className="text-xs">{item.icon}</span>
            {item.label}
          </Link>
        ))}
        <div className="mt-auto pt-4" style={{ borderTop: '1px solid rgba(180,80,240,0.15)' }}>
          <Link
            href="/hub"
            className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold tracking-widest uppercase transition-all duration-200"
            style={{ color: 'var(--text-muted)' }}
          >
            ← Back to the Keep
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8 overflow-y-auto" style={{ color: 'var(--text-primary)' }}>
        {children}
      </main>
    </div>
  );
}
