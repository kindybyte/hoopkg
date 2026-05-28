import Link from "next/link";
import clsx from "clsx";
import type { Court, Game } from "@/types/database";
import { formatDayLabel, formatLabel, formatPrice, formatTimeRu, gameStatusLabel } from "@/lib/format";

interface Props {
  game: Game;
  court: Pick<Court, "id" | "name" | "type">;
  participants: number;
}

export function GameCard({ game, court, participants }: Props) {
  const isFull = participants >= game.max_players || game.status === "full";
  const closed = game.status === "finished" || game.status === "cancelled";

  return (
    <Link
      href={`/games/${game.id}`}
      className="card block px-4 py-4 transition hover:shadow-md active:scale-[0.997]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium text-ink/60">
            <span className="truncate">{court.name}</span>
            <span>·</span>
            <span>{formatLabel(game.format)}</span>
          </div>
          <h3 className="mt-0.5 truncate text-base font-semibold text-ink">{game.title}</h3>
          <p className="mt-1 text-sm text-ink/70">
            {formatDayLabel(game.date)}, {formatTimeRu(game.starts_at)}–{formatTimeRu(game.ends_at)}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-ink">{formatPrice(game.price_per_player)}</div>
          <div className="mt-1 text-xs text-ink/60">
            {participants}/{game.max_players}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span
          className={clsx(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            closed
              ? "bg-soft text-ink/60"
              : isFull
                ? "bg-soft text-ink/70"
                : "bg-hoop/10 text-hoop"
          )}
        >
          {closed ? gameStatusLabel(game.status) : isFull ? "Заполнена" : "Открыта"}
        </span>
        <span className="text-sm font-medium text-ink/80">Подробнее →</span>
      </div>
    </Link>
  );
}
