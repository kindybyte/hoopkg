import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CourtUpsertForm } from "@/app/admin/court-form";
import { DeleteCourtButton } from "./delete-button";
import type { Court } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminEditCourtPage({
  params
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data } = await supabase.from("courts").select("*").eq("id", params.id).maybeSingle();
  const court = data as unknown as Court | null;
  if (!court) return notFound();

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Редактировать площадку</h1>
        <Link href="/admin" className="text-sm text-ink/70">
          ← В админку
        </Link>
      </div>
      <CourtUpsertForm court={court} />
      <div className="card px-5 py-5">
        <h2 className="text-sm font-semibold text-red-700">Опасная зона</h2>
        <p className="mt-1 text-sm text-ink/60">
          Удаление площадки уберёт её из списков. Игры, которые уже привязаны к ней, останутся,
          но без площадки. Лучше использовать статус «Скрыта» вместо удаления.
        </p>
        <div className="mt-3">
          <DeleteCourtButton id={court.id} />
        </div>
      </div>
    </div>
  );
}
