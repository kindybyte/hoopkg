import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { ProfileForm } from "./form";
import { signOut } from "@/lib/actions/auth";
import { GameCard } from "@/components/GameCard";
import { EmptyState } from "@/components/EmptyState";
import type { Court, Game } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = createSupabaseServerClient();
  const [mineRes, joinedRes] = await Promise.all([
    supabase
      .from("games")
      .select("*, courts!inner(id,name,type), game_participants(id,status)")
      .eq("creator_id", user.id)
      .order("starts_at", { ascending: false })
      .limit(10),
    supabase
      .from("game_participants")
      .select(
        "status, games!inner(*, courts!inner(id,name,type), game_participants(id,status))"
      )
      .eq("user_id", user.id)
      .eq("status", "joined")
      .order("joined_at", { ascending: false })
      .limit(20)
  ]);

  type MineRow = Game & {
    courts: Pick<Court, "id" | "name" | "type">;
    game_participants: Array<{ status: string }>;
  };
  const mine = ((mineRes.data ?? []) as unknown as MineRow[]);

  type JoinedRow = {
    games: Game & {
      courts: Pick<Court, "id" | "name" | "type">;
      game_participants: Array<{ status: string }>;
    };
  };
  const joinedRaw = (joinedRes.data ?? []) as unknown as JoinedRow[];
  const joined = joinedRaw.filter((row) => row.games?.creator_id !== user.id).slice(0, 10);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Профиль</h1>
      <ProfileForm profile={profile} />

      <section>
        <h2 className="mb-3 text-lg font-semibold">Мои игры</h2>
        {mine.length === 0 ? (
          <EmptyState
            title="Ты ещё не создавал игры"
            action={
              <Link href="/games/new" className="btn-accent">
                Создать игру
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {mine.map((g) => (
              <GameCard
                key={g.id}
                game={g}
                court={g.courts}
                participants={g.game_participants.filter((p) => p.status === "joined").length}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Я участник</h2>
        {joined.length === 0 ? (
          <EmptyState title="Ты пока ни к чему не присоединился" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {joined.map(({ games: g }) => (
              <GameCard
                key={g.id}
                game={g}
                court={g.courts}
                participants={g.game_participants.filter((p) => p.status === "joined").length}
              />
            ))}
          </div>
        )}
      </section>

      <form action={signOut}>
        <button className="btn-ghost w-full">Выйти</button>
      </form>
    </div>
  );
}
