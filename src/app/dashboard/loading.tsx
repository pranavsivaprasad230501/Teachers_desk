function Block({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className ?? ""}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Block className="h-8 w-48" />
        <Block className="h-4 w-80" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Block className="h-32" />
        <Block className="h-32" />
        <Block className="h-32" />
        <Block className="h-32" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Block className="h-72" />
        <Block className="h-72" />
      </div>
    </div>
  );
}
