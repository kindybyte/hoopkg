"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  emailPasswordSchema,
  loginPhoneSchema,
  verifyOtpSchema
} from "@/lib/validations";
import { env } from "@/lib/env";

export type ActionState = { error?: string; ok?: boolean; data?: unknown };

export async function signInWithPassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = emailPasswordSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    console.error("[signInWithPassword]", error.status, error.code, error.message);
    const msg = (error.message ?? "").toLowerCase();
    if (msg.includes("email not confirmed")) {
      return { error: "Email не подтверждён. Открой ссылку из письма." };
    }
    if (msg.includes("invalid") || msg.includes("credentials")) {
      return { error: "Неверный email или пароль." };
    }
    return { error: `Не удалось войти: ${error.message}` };
  }
  redirect("/games");
}

export async function signUpWithPassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = emailPasswordSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${env.SITE_URL}/auth/callback` }
  });
  if (error) {
    console.error("[signUpWithPassword]", error.status, error.code, error.message);
    const msg = (error.message ?? "").toLowerCase();
    if (msg.includes("already") || msg.includes("registered")) {
      return { error: "Этот email уже зарегистрирован. Войди через форму входа." };
    }
    if (msg.includes("rate") || msg.includes("too many")) {
      return { error: "Слишком много попыток. Подожди минуту и попробуй ещё раз." };
    }
    if (msg.includes("disabled") || msg.includes("not enabled") || msg.includes("signups not allowed")) {
      return {
        error:
          "Регистрация по email выключена в Supabase. В Dashboard → Authentication → Providers → Email включи 'Enable Email Signup'."
      };
    }
    if (msg.includes("smtp") || msg.includes("send email")) {
      return {
        error:
          "Supabase не смог отправить письмо подтверждения. Сними 'Confirm email' в Authentication → Providers → Email или настрой SMTP."
      };
    }
    return { error: `Не удалось создать аккаунт: ${error.message}` };
  }
  if (data.session) {
    redirect("/profile");
  }
  return { ok: true, data: { confirm: true } };
}

export async function signInWithPhone(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginPhoneSchema.safeParse({ phone: formData.get("phone") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Неверный телефон" };
  }
  const supabase = createSupabaseServerClient();
  const phone = parsed.data.phone.startsWith("+")
    ? parsed.data.phone
    : `+${parsed.data.phone}`;
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) return { error: "Не удалось отправить SMS. Попробуйте ещё раз." };
  return { ok: true, data: { phone } };
}

export async function verifyPhoneOtp(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = verifyOtpSchema.safeParse({
    phone: formData.get("phone"),
    token: formData.get("token")
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Неверный код" };

  const supabase = createSupabaseServerClient();
  const phone = parsed.data.phone.startsWith("+")
    ? parsed.data.phone
    : `+${parsed.data.phone}`;
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
