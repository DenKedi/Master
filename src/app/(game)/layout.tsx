import Sidebar from "@/components/ui/Navbar";

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-void)' }}>
      {/* On mobile: full width. On desktop (lg+): leave room for the 280px sidebar */}
      <main className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-8 lg:mr-[280px]">
        {children}
      </main>
      <Sidebar />
    </div>
  );
}
