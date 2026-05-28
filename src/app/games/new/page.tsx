import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { NewGameForm } from "./form";
import type { Court } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function NewGamePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("courts")
    .select("*")
    .eq("status", "active")
    .order("name");
  const courts = (data as Court[] | null) ?? [];

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-2xl font-semibold">Создать игру</h1>
      <p className="text-sm text-ink/60">
        Заполни базовое — это займёт около минуты. Для платных залов нужен чек аренды.
      </p>
      <NewGameForm courts={courts} />
    </div>
  );
}
