import Link from "next/link";
import type { Court } from "@/types/database";
import { formatPrice } from "@/lib/format";
import { FreeCourtPresence } from "@/components/FreeCourtPresence";

export function CourtCard({
  court,
  presentNow,
  userPresent
}: {
  court: Court;
  presentNow?: number;
  userPresent?: boolean;
}) {
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
        <p className="mt-2 text-sm font-medium">{formatPrice(court.price_per_hour)}</p>

        {court.type === "free" && (
          <div className="mt-3">
            <FreeCourtPresence
              courtId={court.id}
              initialCount={presentNow ?? 0}
              initialUserPresent={userPresent ?? false}
            />
          </div>
        )}

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
