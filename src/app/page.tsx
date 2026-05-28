import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CourtCard } from "@/components/CourtCard";
import { GameCard } from "@/components/GameCard";
import { EmptyState } from "@/components/EmptyState";
import type { Court, Game } from "@/types/database";

export const revalidate = 30;

export default async function HomePage() {
  const supabase = createSupabaseServerClient();

  const today = new Date().toISOString().slice(0, 10);
  const [courtsRes, gamesRes] = await Promise.all([
    supabase
      .from("courts")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(4),
    supabase
      .from("games")
      .select("*, courts!inner(id,name,type), game_participants(id,status)")
      .eq("is_private", false)
      .eq("date", today)
      .in("status", ["open", "full"])
      .order("starts_at", { ascending: true })
      .limit(6)
  ]);

  const courts = (courtsRes.data as Court[] | null) ?? [];
  const games = (gamesRes.data as Array<
    Game & { courts: Pick<Court, "id" | "name" | "type">; game_participants: Array<{ status: string }> }
  > | null) ?? [];

  return (
    <div className="space-y-10">
      <section className="card px-6 py-10 sm:py-14 text-center">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          Найди с кем сыграть в баскетбол в Бишкеке
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-ink/70">
          Создавай игры, присоединяйся к площадкам и собирай команду за пару минут.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/games" className="btn-primary w-full sm:w-auto">
            Найти игру
          </Link>
          <Link href="/games/new" className="btn-accent w-full sm:w-auto">
            Создать игру
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-xl font-semibold">Популярные площадки</h2>
          <Link href="/courts" className="text-sm text-ink/70 hover:text-ink">
            Все →
          </Link>
        </div>
        {courts.length === 0 ? (
          <EmptyState title="Пока нет площадок" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {courts.map((c) => (
              <CourtCard key={c.id} court={c} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-xl font-semibold">Игры сегодня</h2>
          <Link href="/games" className="text-sm text-ink/70 hover:text-ink">
            Все →
          </Link>
        </div>
        {games.length === 0 ? (
          <EmptyState
            title="Сегодня ещё никто не собрал игру"
            description="Будь первым — создай игру и пригласи друзей."
            action={
              <Link href="/games/new" className="btn-accent">
                Создать игру
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {games.map((g) => {
              const joined = g.game_participants.filter((p) => p.status === "joined").length;
              return (
                <GameCard
                  key={g.id}
                  game={g}
                  court={g.courts}
                  participants={joined}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
