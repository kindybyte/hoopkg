"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginEmailSchema, loginPhoneSchema, verifyOtpSchema } from "@/lib/validations";
import { env } from "@/lib/env";

export type ActionState = { error?: string; ok?: boolean; data?: unknown };

export async function signInWithEmail(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginEmailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Неверный email" };
  }
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${env.SITE_URL}/auth/callback` }
  });
  if (error) return { error: "Не удалось отправить ссылку. Попробуйте ещё раз." };
  return { ok: true };
}

export async function signInWithPhone(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginPhoneSchema.safeParse({ phone: formData.get("phone") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Неверный телефон" };
  }
  const supabase = createSupabaseServerClient();
  const phone = parsed.data.phone.startsWith("+") ? parsed.data.phone : `+${parsed.data.phone}`;
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) return { error: "Не удалось отправить SMS. Попробуйте ещё раз." };
  return { ok: true, data: { phone } };
}

export async function verifyPhoneOtp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = verifyOtpSchema.safeParse({
    phone: formData.get("phone"),
    token: formData.get("token")
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Неверный код" };

  const supabase = createSupabaseServerClient();
  const phone = parsed.data.phone.startsWith("+") ? parsed.data.phone : `+${parsed.data.phone}`;
  const { error } = await supabase.auth.verifyOtp({
    phone,
    token: parsed.data.token,
    type: "sms"
  });
  if (error) return { error: "Неверный код. Попробуйте ещё раз." };
  redirect("/games");
}

export async function signOut() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
