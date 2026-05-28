"use client";

import { useFormState } from "react-dom";
import { useMemo, useState } from "react";
import { createGame } from "@/lib/actions/games";
import { FieldError, SubmitButton } from "@/components/Forms";
import type { Court } from "@/types/database";

function defaultDate() {
  return new Date().toISOString().slice(0, 10);
}

function defaultDateTime(offsetHours: number) {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + offsetHours);
  return d.toISOString().slice(0, 16);
}

export function NewGameForm({ courts }: { courts: Court[] }) {
  const [state, action] = useFormState(createGame, {});
  const [courtId, setCourtId] = useState(courts[0]?.id ?? "");
  const [isPrivate, setIsPrivate] = useState(false);

  const selectedCourt = useMemo(
    () => courts.find((c) => c.id === courtId) ?? null,
    [courtId, courts]
  );
  const requiresReceipt = selectedCourt?.type === "paid" && !isPrivate;

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label">Площадка</label>
        <select
          name="court_id"
          required
          className="input"
          value={courtId}
          onChange={(e) => setCourtId(e.target.value)}
        >
          {courts.length === 0 ? (
            <option value="">Нет доступных площадок</option>
          ) : (
            courts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.type === "paid" ? "· платная" : "· бесплатно"}
              </option>
            ))
          )}
        </select>
      </div>

      <div>
        <label className="label">Название</label>
        <input
          name="title"
          required
          className="input"
          placeholder="Например: 5x5 после работы"
          maxLength={80}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Дата</label>
          <input name="date" type="date" required defaultValue={defaultDate()} className="input" />
        </div>
        <div>
          <label className="label">Формат</label>
          <select name="format" defaultValue="5x5" className="input">
            <option value="3x3">3x3</option>
            <option value="4x4">4x4</option>
            <option value="5x5">5x5</option>
            <option value="free">Свободная игра</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Начало</label>
          <input
            name="starts_at"
            type="datetime-local"
            required
            defaultValue={defaultDateTime(1)}
            className="input"
          />
        </div>
        <div>
          <label className="label">Окончание</label>
          <input
            name="ends_at"
            type="datetime-local"
            required
            defaultValue={defaultDateTime(2)}
            className="input"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Макс. игроков</label>
          <input
            name="max_players"
            type="number"
            required
            min={2}
            max={30}
            defaultValue={10}
            className="input"
          />
        </div>
        <div>
          <label className="label">Цена с человека (сом)</label>
          <input
            name="price_per_player"
            type="number"
            min={0}
            defaultValue={0}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label">Описание (опционально)</label>
        <textarea name="description" rows={3} className="input" maxLength={500} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_private"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
        />
        Приватная игра — доступ только по ссылке
      </label>

      {requiresReceipt && (
        <div>
          <label className="label">Чек аренды (jpg, png, pdf, до 5 МБ)</label>
          <input
            name="receipt"
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            required
            className="input p-2"
          />
          <p className="mt-1 text-xs text-ink/60">
            Для платного зала чек обязателен для публичной игры.
          </p>
        </div>
      )}

      <FieldError message={state.error} />
      <SubmitButton className="btn-accent w-full">Создать игру</SubmitButton>
    </form>
  );
}
