"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { ActionState } from "@/lib/actions/auth";

const PRESENCE_COOLDOWN_MS = 2 * 60 * 1000;

export async function markPresence(courtId: string): Promise<ActionState> {
  const user = await requireUser();
  const supabase = createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("court_presence")
    .select("id, updated_at")
    .eq("court_id", courtId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const last = new Date(existing.updated_at).getTime();
    if (Date.now() - last < PRESENCE_COOLDOWN_MS) {
      return { error: "Можно отмечаться не чаще одного раза в 2 минуты." };
    }
    const { error } = await supabase
      .from("court_presence")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) return { error: "Не удалось обновить статус." };
  } else {
    const { error } = await supabase
      .from("court_presence")
      .insert({ court_id: courtId, user_id: user.id });
    if (error) return { error: "Не удалось отметиться." };
  }

  revalidatePath(`/courts/${courtId}`);
  revalidatePath("/courts");
  return { ok: true };
}

export async function leavePresence(courtId: string): Promise<ActionState> {
  const user = await requireUser();
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("court_presence")
    .delete()
    .eq("court_id", courtId)
    .eq("user_id", user.id);
  if (error) return { error: "Не удалось убрать статус." };
  revalidatePath(`/courts/${courtId}`);
  revalidatePath("/courts");
  return { ok: true };
}
