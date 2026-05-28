import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CourtCard } from "@/components/CourtCard";
import { EmptyState } from "@/components/EmptyState";
import type { Court } from "@/types/database";
import clsx from "clsx";

export const dynamic = "force-dynamic";

export default async function CourtsPage({
  searchParams
}: {
  searchParams: { type?: string };
}) {
  const supabase = createSupabaseServerClient();
  let q = supabase.from("courts").select("*").eq("status", "active").order("name");
  if (searchParams.type === "paid") q = q.eq("type", "paid");
  if (searchParams.type === "free") q = q.eq("type", "free");
  const { data } = await q;
  const courts = (data as Court[] | null) ?? [];

  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const presenceCounts: Record<string, number> = {};
  if (courts.length > 0) {
    const { data: rows } = await supabase
      .from("court_presence")
      .select("court_id")
      .gt("updated_at", cutoff);
    for (const r of (rows ?? []) as Array<{ court_id: string }>) {
      presenceCounts[r.court_id] = (presenceCounts[r.court_id] ?? 0) + 1;
    }
  }

  const filterLink = (val?: string) => {
    const qs = val ? `?type=${val}` : "";
    return `/courts${qs}`;
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Площадки Бишкека</h1>
      <div className="flex gap-2">
        <Link href={filterLink()} className={clsx(!searchParams.type ? "chip-active" : "chip")}>
          Все
        </Link>
        <Link
          href={filterLink("free")}
          className={clsx(searchParams.type === "free" ? "chip-active" : "chip")}
        >
          Бесплатные
        </Link>
        <Link
          href={filterLink("paid")}
          className={clsx(searchParams.type === "paid" ? "chip-active" : "chip")}
        >
          Платные
        </Link>
      </div>
      {courts.length === 0 ? (
        <EmptyState title="Площадок не найдено" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {courts.map((c) => (
            <CourtCard key={c.id} court={c} presentNow={presenceCounts[c.id] ?? 0} />
          ))}
        </div>
      )}
    </div>
  );
}
