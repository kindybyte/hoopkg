"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { courtUpsertSchema } from "@/lib/validations";
import type { ActionState } from "@/lib/actions/auth";

export async function upsertCourt(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = courtUpsertSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    type: formData.get("type"),
    address: formData.get("address"),
    lat: formData.get("lat") || null,
    lng: formData.get("lng") || null,
    photo_url: formData.get("photo_url") || "",
    price_per_hour: formData.get("price_per_hour"),
    description: formData.get("description") || "",
    status: formData.get("status") || "active"
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };

  const supabase = createAdminClient();
  const payload = {
    name: parsed.data.name,
    type: parsed.data.type,
    address: parsed.data.address,
    lat: parsed.data.lat ?? null,
    lng: parsed.data.lng ?? null,
    photo_url: parsed.data.photo_url || null,
    price_per_hour: parsed.data.price_per_hour,
    description: parsed.data.description || null,
    status: parsed.data.status
  };

  if (parsed.data.id) {
    const { error } = await supabase.from("courts").update(payload).eq("id", parsed.data.id);
    if (error) return { error: "Не удалось сохранить площадку." };
  } else {
    const { error } = await supabase.from("courts").insert(payload);
    if (error) return { error: "Не удалось создать площадку." };
  }
  revalidatePath("/admin");
  revalidatePath("/courts");
  return { ok: true };
}

export async function setReceiptStatus(id: string, status: "approved" | "rejected"): Promise<ActionState> {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("rental_receipts").update({ status }).eq("id", id);
  if (error) return { error: "Не удалось обновить чек." };
  revalidatePath("/admin");
  return { ok: true };
}

export async function hideGame(id: string): Promise<ActionState> {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("games").update({ status: "cancelled" }).eq("id", id);
  if (error) return { error: "Не удалось скрыть игру." };
  revalidatePath("/admin");
  revalidatePath("/games");
  return { ok: true };
}

export async function blockUser(id: string, blocked: boolean): Promise<ActionState> {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("profiles").update({ is_blocked: blocked }).eq("id", id);
  if (error) return { error: "Не удалось обновить пользователя." };
  revalidatePath("/admin");
  return { ok: true };
}
