"use client";

import { useFormState } from "react-dom";
import { useState } from "react";
import { signInWithEmail, signInWithPhone, verifyPhoneOtp } from "@/lib/actions/auth";
import { FieldError, SubmitButton } from "@/components/Forms";

export default function LoginPage() {
  const [tab, setTab] = useState<"email" | "phone">("phone");
  const [emailState, emailAction] = useFormState(signInWithEmail, {});
  const [phoneState, phoneAction] = useFormState(signInWithPhone, {});
  const [otpState, otpAction] = useFormState(verifyPhoneOtp, {});

  const otpSent = Boolean((phoneState.data as { phone?: string } | undefined)?.phone);
  const otpPhone = (phoneState.data as { phone?: string } | undefined)?.phone;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="card px-6 py-8">
        <h1 className="text-2xl font-semibold">Вход в HoopKG</h1>
        <p className="mt-1 text-sm text-ink/60">Войди, чтобы создавать и присоединяться к играм.</p>

        <div className="mt-5 flex rounded-xl2 border border-line p-1">
          <button
            className={`flex-1 rounded-xl2 py-2 text-sm font-medium ${
              tab === "phone" ? "bg-ink text-white" : "text-ink/70"
            }`}
            onClick={() => setTab("phone")}
          >
            Телефон
          </button>
          <button
            className={`flex-1 rounded-xl2 py-2 text-sm font-medium ${
              tab === "email" ? "bg-ink text-white" : "text-ink/70"
            }`}
            onClick={() => setTab("email")}
          >
            Email
          </button>
        </div>

        {tab === "email" && (
          <form action={emailAction} className="mt-5 space-y-3">
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" required className="input" placeholder="you@example.com" />
              <FieldError message={emailState.error} />
            </div>
            <SubmitButton>Получить ссылку на вход</SubmitButton>
            {emailState.ok && (
              <p className="text-sm text-green-700">
                Мы отправили ссылку на email. Проверь почту.
              </p>
            )}
          </form>
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
