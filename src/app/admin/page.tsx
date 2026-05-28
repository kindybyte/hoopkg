import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CourtUpsertForm } from "./court-form";
import { AdminCourtsTable } from "./courts-table";
import { AdminGamesTable } from "./games-table";
import { AdminReceiptsTable } from "./receipts-table";
import { AdminUsersTable } from "./users-table";
import type { Court, Game, Profile, RentalReceipt } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const supabase = createAdminClient();

  const [courtsRes, gamesRes, receiptsRes, usersRes] = await Promise.all([
    supabase.from("courts").select("*").order("created_at", { ascending: false }),
    supabase
      .from("games")
      .select("*, courts(name)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("rental_receipts")
      .select("*, games(title, court_id, courts(name))")
      .order("uploaded_at", { ascending: false })
      .limit(50),
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(50)
  ]);

  const courts = (courtsRes.data as Court[] | null) ?? [];
  const games = (gamesRes.data as Array<Game & { courts: { name: string } }> | null) ?? [];
  const receipts =
    (receiptsRes.data as Array<RentalReceipt & {
      games: { title: string; courts: { name: string } };
    }> | null) ?? [];
  const users = (usersRes.data as Profile[] | null) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Админка</h1>
        <Link href="/" className="text-sm text-ink/70">
          ← На главную
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Добавить площадку</h2>
        <CourtUpsertForm />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Площадки</h2>
        <AdminCourtsTable courts={courts} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Чеки аренды</h2>
        <AdminReceiptsTable receipts={receipts} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Игры</h2>
        <AdminGamesTable games={games} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Пользователи</h2>
        <AdminUsersTable users={users} />
      </section>
    </div>
  );
}
