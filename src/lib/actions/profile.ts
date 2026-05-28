"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { profileUpdateSchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth";
import type { ActionState } from "@/lib/actions/auth";

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = profileUpdateSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") ?? "",
    telegram_username: formData.get("telegram_username") ?? "",
    show_phone: formData.get("show_phone") === "on",
    level: formData.get("level")
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }

  const supabase = createSupabaseServerClient();
  const tg = parsed.data.telegram_username?.replace(/^@/, "") || null;
  const { error } = await supabase
    .from("profiles")
    .update({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      telegram_username: tg,
      show_phone: parsed.data.show_phone,
      level: parsed.data.level
    })
    .eq("id", user.id);

  if (error) return { error: "Не удалось сохранить профиль." };
  revalidatePath("/profile");
  return { ok: true };
}
