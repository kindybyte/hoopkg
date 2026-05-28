"use client";

import { useFormState } from "react-dom";
import { updateProfile } from "@/lib/actions/profile";
import { FieldError, SubmitButton } from "@/components/Forms";
import type { Profile } from "@/types/database";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action] = useFormState(updateProfile, {});
  return (
    <form action={action} className="card space-y-4 px-5 py-5">
      <div>
        <label className="label">Имя</label>
        <input name="name" required defaultValue={profile.name} className="input" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Телефон</label>
          <input
            name="phone"
            type="tel"
            defaultValue={profile.phone ?? ""}
            placeholder="+996700123456"
            className="input"
          />
        </div>
        <div>
          <label className="label">Telegram</label>
          <input
            name="telegram_username"
            defaultValue={profile.telegram_username ?? ""}
            placeholder="@username"
            className="input"
          />
        </div>
      </div>
      <div>
        <label className="label">Уровень</label>
        <select name="level" defaultValue={profile.level} className="input">
          <option value="beginner">Новичок</option>
          <option value="intermediate">Средний</option>
          <option value="advanced">Сильный</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="show_phone" defaultChecked={profile.show_phone} />
        Показывать телефон публично (по умолчанию выключено)
      </label>
      <FieldError message={state.error} />
      {state.ok && <p className="text-sm text-green-700">Сохранено.</p>}
      <SubmitButton>Сохранить</SubmitButton>
    </form>
  );
}
