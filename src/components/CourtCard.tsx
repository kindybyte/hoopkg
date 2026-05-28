import Link from "next/link";
import type { Court } from "@/types/database";
import { formatPrice } from "@/lib/format";

export function CourtCard({ court, presentNow }: { court: Court; presentNow?: number }) {
  return (
    <div className="card overflow-hidden">
      {court.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={court.photo_url}
          alt={court.name}
          className="h-36 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="h-28 w-full bg-gradient-to-br from-soft to-line" />
      )}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">{court.name}</h3>
          <span className="chip">{court.type === "paid" ? "Платный зал" : "Бесплатно"}</span>
        </div>
        <p className="mt-1 text-sm text-ink/70">{court.address}</p>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="font-medium">{formatPrice(court.price_per_hour)}</span>
          {court.type === "free" && typeof presentNow === "number" && (
            <span className="text-ink/70">Сейчас на площадке: {presentNow}</span>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <Link href={`/courts/${court.id}`} className="btn-ghost flex-1 !py-2 text-sm">
            Подробнее
          </Link>
          <Link href={`/games?court=${court.id}`} className="btn-ghost flex-1 !py-2 text-sm">
            Игры
          </Link>
        </div>
      </div>
    </div>
  );
}
