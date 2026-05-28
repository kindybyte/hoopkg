import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GameCard } from "@/components/GameCard";
import { GameFilters } from "@/components/GameFilters";
import { EmptyState } from "@/components/EmptyState";
import type { Court, Game } from "@/types/database";

export const dynamic = "force-dynamic";

type Search = {
  when?: string;
  pay?: string;
  format?: string;
  level?: string;
  court?: string;
};

export default async function GamesPage({
  searchParams
}: {
  searchParams: Search;
}) {
  const supabase = createSupabaseServerClient();

  let query = supabase
    .from("games")
    .select("*, courts!inner(id,name,type), game_participants(id,status)")
    .eq("is_private", false)
    .in("status", ["open", "full"])
    .order("starts_at", { ascending: true });

  if (searchParams.when === "today") {
    query = query.eq("date", new Date().toISOString().slice(0, 10));
  } else if (searchParams.when === "tomorrow") {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    query = query.eq("date", d.toISOString().slice(0, 10));
  }
  if (searchParams.pay === "paid") query = query.gt("price_per_player", 0);
  if (searchParams.pay === "free") query = query.eq("price_per_player", 0);
  if (searchParams.format && ["3x3", "4x4", "5x5", "free"].includes(searchParams.format)) {
    query = query.eq("format", searchParams.format);
  }
  if (searchParams.court) query = query.eq("court_id", searchParams.court);

  const { data } = await query;
  const games = (data as Array<Game & {
    courts: Pick<Court, "id" | "name" | "type">;
    game_participants: Array<{ status: string }>;
  }> | null) ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Игры</h1>
        <Link href="/games/new" className="btn-accent !py-2 !px-4 text-sm">
          + Создать
        </Link>
      </div>
      <GameFilters />
      {games.length === 0 ? (
        <EmptyState
          title="Игр пока нет"
          description="Попробуй сбросить фильтры или создай свою игру."
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
            return <GameCard key={g.id} game={g} court={g.courts} participants={joined} />;
          })}
        </div>
      )}
    </div>
  );
}
