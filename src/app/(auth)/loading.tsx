import LoadingDots from "@/components/ui/LoadingDots";

export default function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-void)' }}>
      <LoadingDots size="lg" label="Opening the gates…" />
    </div>
  );
}
