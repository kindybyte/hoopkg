export default function Loading() {
  return (
    <div className="space-y-3">
      <div className="h-8 w-40 animate-pulse rounded-xl2 bg-soft" />
      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card h-32 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
