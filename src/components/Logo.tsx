export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="grid h-8 w-8 place-items-center rounded-full bg-hoop text-white font-bold">H</span>
      <span className="text-lg font-semibold tracking-tight">HoopKG</span>
    </div>
  );
}
