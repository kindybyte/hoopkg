"use client";

import { useFormState } from "react-dom";
import { useState } from "react";
import {
  signInWithPassword,
  signUpWithPassword,
  signInWithPhone,
  verifyPhoneOtp
} from "@/lib/actions/auth";
import { FieldError, SubmitButton } from "@/components/Forms";

export default function LoginPage() {
  const [tab, setTab] = useState<"email" | "phone">("email");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInState, signInAction] = useFormState(signInWithPassword, {});
  const [signUpState, signUpAction] = useFormState(signUpWithPassword, {});
  const [phoneState, phoneAction] = useFormState(signInWithPhone, {});
  const [otpState, otpAction] = useFormState(verifyPhoneOtp, {});

  const otpSent = Boolean((phoneState.data as { phone?: string } | undefined)?.phone);
  const otpPhone = (phoneState.data as { phone?: string } | undefined)?.phone;
  const confirmEmailSent =
    mode === "signup" &&
    Boolean((signUpState.data as { confirm?: boolean } | undefined)?.confirm);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="card px-6 py-8">
        <h1 className="text-2xl font-semibold">Вход в HoopKG</h1>
        <p className="mt-1 text-sm text-ink/60">
          Войди или создай аккаунт, чтобы создавать и присоединяться к играм.
        </p>

        <div className="mt-5 flex rounded-xl2 border border-line p-1">
          <button
            className={`flex-1 rounded-xl2 py-2 text-sm font-medium ${
              tab === "email" ? "bg-ink text-white" : "text-ink/70"
            }`}
            onClick={() => setTab("email")}
          >
            Email
          </button>
          <button
            className={`flex-1 rounded-xl2 py-2 text-sm font-medium ${
              tab === "phone" ? "bg-ink text-white" : "text-ink/70"
            }`}
            onClick={() => setTab("phone")}
          >
            Телефон
          </button>
        </div>

        {tab === "email" && (
          <>
            <div className="mt-5 flex gap-4 text-sm">
              <button
                onClick={() => setMode("signin")}
                className={mode === "signin" ? "font-semibold text-ink" : "text-ink/60"}
              >
                Войти
              </button>
              <button
                onClick={() => setMode("signup")}
                className={mode === "signup" ? "font-semibold text-ink" : "text-ink/60"}
              >
                Создать аккаунт
              </button>
            </div>

            {mode === "signin" ? (
              <form action={signInAction} className="mt-4 space-y-3">
                <div>
                  <label className="label">Email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="input"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="label">Пароль</label>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="current-password"
                    className="input"
                    placeholder="••••••••"
                  />
                  <FieldError message={signInState.error} />
                </div>
                <SubmitButton>Войти</SubmitButton>
              </form>
            ) : confirmEmailSent ? (
              <p className="mt-4 rounded-xl2 bg-soft px-4 py-3 text-sm">
                Мы отправили письмо для подтверждения. Открой ссылку из письма,
                чтобы завершить регистрацию.
              </p>
            ) : (
              <form action={signUpAction} className="mt-4 space-y-3">
                <div>
                  <label className="label">Email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="input"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="label">Пароль</label>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="input"
                    placeholder="Минимум 6 символов"
                  />
                  <FieldError message={signUpState.error} />
                </div>
                <SubmitButton>Создать аккаунт</SubmitButton>
              </form>
            )}
          </>
        )}

        {tab === "phone" && !otpSent && (
          <form action={phoneAction} className="mt-5 space-y-3">
            <div>
              <label className="label">Номер телефона</label>
              <input
                name="phone"
                type="tel"
                required
                className="input"
                placeholder="+996700123456"
              />
              <FieldError message={phoneState.error} />
            </div>
            <SubmitButton>Отправить SMS-код</SubmitButton>
            <p className="text-xs text-ink/50">
              Для входа по SMS у Supabase должен быть подключён платный
              провайдер (Twilio и т.п.). На бесплатном тарифе используй email.
            </p>
          </form>
        )}

        {tab === "phone" && otpSent && (
          <form action={otpAction} className="mt-5 space-y-3">
            <input type="hidden" name="phone" value={otpPhone} />
            <div>
              <label className="label">Код из SMS</label>
              <input
                name="token"
                required
                inputMode="numeric"
                className="input tracking-widest"
                placeholder="000000"
              />
              <FieldError message={otpState.error} />
            </div>
            <SubmitButton>Войти</SubmitButton>
          </form>
        )}
      </div>
    </div>
  );
}
