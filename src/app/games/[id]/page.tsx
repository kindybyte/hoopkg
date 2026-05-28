import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth";
import { JoinLeaveButton } from "@/components/JoinLeaveButton";
import { CopyInviteButton } from "@/components/CopyInviteButton";
import { RealtimeParticipantsCount } from "@/components/RealtimeParticipantsCount";
import { ReceiptViewer } from "@/components/ReceiptViewer";
import {
  formatDayLabel,
  formatLabel,
  formatPrice,
  formatTimeRu,
  gameStatusLabel
} from "@/lib/format";
import type { Court, Game, GameParticipant, Profile, RentalReceipt } from "@/types/database";

export const dynamic = "force-dynamic";

type GameRow = Game & {
  courts: Court;
  creator: Pick<Profile, "id" | "name" | "telegram_username" | "avatar_url">;
  game_participants: Array<GameParticipant & { profiles: Pick<Profile, "id" | "name" | "telegram_username" | "avatar_url"> }>;
  rental_receipts: RentalReceipt[];
};

const SELECT = `*,
        courts(*),
        creator:profiles!games_creator_id_fkey(id,name,telegram_username,avatar_url),
        game_participants(id,user_id,status,joined_at,profiles(id,name,telegram_username,avatar_url)),
        rental_receipts(id,file_path,status,uploaded_by,uploaded_at)`;

async function loadGame(id: string, token?: string): Promise<GameRow | null> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from("games").select(SELECT).eq("id", id).maybeSingle();
  if (data) return data as unknown as GameRow;

  // RLS blocked the read (likely a private game) — fall back to admin lookup when invite token matches.
  if (token) {
    const admin = createAdminClient();
    const { data: priv } = await admin
      .from("games")
      .select(SELECT)
      .eq("id", id)
      .eq("invite_token", token)
      .maybeSingle();
    return (priv as unknown as GameRow | null) ?? null;
  }
  return null;
}

export default async function GameDetailPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { token?: string; created?: string };
}) {
  const user = await getCurrentUser();
  const game = await loadGame(params.id, searchParams.token);
  if (!game) return notFound();

  const joined = game.game_participants.filter((p) => p.status === "joined");
  const isParticipant = !!user && joined.some((p) => p.user_id === user.id);
  const isCreator = user?.id === game.creator_id;
  const isClosed = game.status === "finished" || game.status === "cancelled";
  const isFull = joined.length >= game.max_players;

  const inviteUrl = `${env.SITE_URL}/games/${game.id}?token=${game.invite_token}`;

  return (
    <div className="space-y-5">
      <Link href="/games" className="text-sm text-ink/70">
        ← К списку игр
      </Link>

      <header className="card px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-ink/50">{game.courts.name}</p>
            <h1 className="mt-1 text-2xl font-semibold">{game.title}</h1>
            <p className="mt-1 text-sm text-ink/70">
              {formatDayLabel(game.date)}, {formatTimeRu(game.starts_at)}–{formatTimeRu(game.ends_at)} · {formatLabel(game.format)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">{formatPrice(game.price_per_player)}</div>
            <div className="text-sm text-ink/60">
              <RealtimeParticipantsCount
                gameId={game.id}
                initial={joined.length}
                max={game.max_players}
              />
            </div>
          </div>
        </div>
        {game.description && <p className="mt-3 text-sm text-ink/80">{game.description}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="chip">Статус: {gameStatusLabel(game.status)}</span>
          {game.is_private && <span className="chip">Приватная</span>}
          {game.courts.type === "paid" && <span className="chip">Платный зал</span>}
        </div>
      </header>

      <section className="card px-5 py-5">
        <h2 className="text-sm font-semibold text-ink/70">Площадка</h2>
        <p className="mt-1 font-medium">{game.courts.name}</p>
        <p className="text-sm text-ink/70">{game.courts.address}</p>
        {game.courts.lat && game.courts.lng && (
          <a
            className="mt-2 inline-flex text-sm text-navy underline"
            href={`https://2gis.kg/bishkek/geo/${game.courts.lng},${game.courts.lat}`}
            target="_blank"
            rel="noreferrer"
          >
            Открыть на карте
          </a>
        )}
      </section>

      {!isClosed && user && (
        <section>
          <JoinLeaveButton
            gameId={game.id}
            isParticipant={isParticipant}
            disabled={!isParticipant && isFull}
          />
        </section>
      )}
      {!user && (
        <Link href="/login" className="btn-primary w-full">
          Войти, чтобы присоединиться
        </Link>
      )}

      <section className="card px-5 py-5">
        <h2 className="text-sm font-semibold text-ink/70">Организатор</h2>
        <p className="mt-1">{game.creator.name || "Без имени"}</p>
        {game.creator.telegram_username && (
          <a
            className="text-sm text-navy underline"
            href={`https://t.me/${game.creator.telegram_username}`}
            target="_blank"
            rel="noreferrer"
          >
            @{game.creator.telegram_username}
          </a>
        )}
      </section>

      <section className="card px-5 py-5">
        <h2 className="text-sm font-semibold text-ink/70">
          Участники ({joined.length}/{game.max_players})
        </h2>
        {joined.length === 0 ? (
          <p className="mt-2 text-sm text-ink/60">Пока никто не присоединился. Будь первым.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line/70">
            {joined.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <span>{p.profiles.name || "Игрок"}</span>
                {p.profiles.telegram_username && (
                  <a
                    href={`https://t.me/${p.profiles.telegram_username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-navy underline"
                  >
                    @{p.profiles.telegram_username}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {(isCreator || isParticipant) && (
        <section className="card px-5 py-5">
          <h2 className="text-sm font-semibold text-ink/70">Поделиться</h2>
          <p className="mt-1 text-sm text-ink/60">
            {searchParams.created
              ? "Игра создана! Отправь ссылку друзьям."
              : "Скопируй ссылку и отправь её друзьям."}
          </p>
          <div className="mt-3">
            <CopyInviteButton url={inviteUrl} />
          </div>
        </section>
      )}

      {game.courts.type === "paid" && (
        <section className="card px-5 py-5">
          <h2 className="text-sm font-semibold text-ink/70">Чек аренды</h2>
          {game.rental_receipts.length === 0 ? (
            <p className="mt-2 text-sm text-ink/60">Чек не загружен.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {game.rental_receipts.map((r) => (
                <li key={r.id} className="flex items-center justify-between text-sm">
                  <span>
                    Статус:{" "}
                    {r.status === "pending"
                      ? "На проверке"
                      : r.status === "approved"
                        ? "Подтверждён"
                        : "Отклонён"}
                  </span>
                  <ReceiptViewer filePath={r.file_path} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
