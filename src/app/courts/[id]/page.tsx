import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { GameCard } from "@/components/GameCard";
import { PresenceButtons } from "@/components/PresenceButtons";
import { CourtMap } from "@/components/CourtMap";
import { EmptyState } from "@/components/EmptyState";
import { formatPrice } from "@/lib/format";
import type { Court, Game } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function CourtDetailPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const user = await getCurrentUser();

  const { data: court } = await supabase
    .from("courts")
    .select("*")
    .eq("id", params.id)
    .eq("status", "active")
    .maybeSingle();

  if (!court) return notFound();
  const c = court as Court;

  const today = new Date().toISOString().slice(0, 10);
  const { data: gamesData } = await supabase
    .from("games")
    .select("*, courts!inner(id,name,type), game_participants(id,status)")
    .eq("court_id", c.id)
    .gte("date", today)
    .in("status", ["open", "full"])
    .order("starts_at", { ascending: true })
    .limit(20);

  type GameRow = Game & {
    courts: Pick<Court, "id" | "name" | "type">;
    game_participants: Array<{ status: string }>;
  };
  const games = ((gamesData ?? []) as unknown as GameRow[]);

  let presentCount = 0;
  let userPresent = false;
  if (c.type === "free") {
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: presence } = await supabase
      .from("court_presence")
      .select("user_id")
      .eq("court_id", c.id)
      .gt("updated_at", cutoff);
    presentCount = presence?.length ?? 0;
    userPresent = !!user && (presence ?? []).some((r: { user_id: string }) => r.user_id === user.id);
  }

  return (
    <div className="space-y-5">
      <Link href="/courts" className="text-sm text-ink/70">
        ← Все площадки
      </Link>

      <header className="card overflow-hidden">
        {c.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.photo_url} alt={c.name} className="h-56 w-full object-cover" />
        ) : (
          <div className="h-40 w-full bg-gradient-to-br from-soft to-line" />
        )}
        <div className="px-5 py-5">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">{c.name}</h1>
            <span className="chip">{c.type === "paid" ? "Платный зал" : "Бесплатно"}</span>
          </div>
          <p className="mt-1 text-sm text-ink/70">{c.address}</p>
          <p className="mt-2 font-medium">{formatPrice(c.price_per_hour)}{c.type === "paid" ? " / час" : ""}</p>
          {c.description && <p className="mt-3 text-sm text-ink/80">{c.description}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/games/new?court=${c.id}`} className="btn-accent flex-1">
              Создать игру здесь
            </Link>
            {c.lat && c.lng && (
              <a
                className="btn-ghost flex-1"
                href={`https://2gis.kg/bishkek/directions/points/%7C${c.lng},${c.lat}`}
                target="_blank"
                rel="noreferrer"
              >
                Как добраться
              </a>
            )}
          </div>
        </div>
      </header>

      {c.lat && c.lng && (
        <section>
          <CourtMap lat={c.lat} lng={c.lng} name={c.name} />
        </section>
      )}

      {c.type === "free" && user && (
        <PresenceButtons
          courtId={c.id}
          initialCount={presentCount}
          initialUserPresent={userPresent}
        />
      )}
      {c.type === "free" && !user && (
        <Link href="/login" className="btn-primary w-full">
          Войти, чтобы отметиться на площадке
        </Link>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Ближайшие игры</h2>
        {games.length === 0 ? (
          <EmptyState
            title="Игр на этой площадке пока нет"
            action={
              <Link href={`/games/new?court=${c.id}`} className="btn-accent">
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
      </section>
    </div>
  );
}
