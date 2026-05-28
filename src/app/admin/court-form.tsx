"use client";

import { useFormState } from "react-dom";
import { upsertCourt } from "@/lib/actions/admin";
import { FieldError, SubmitButton } from "@/components/Forms";
import type { Court } from "@/types/database";

export function CourtUpsertForm({ court }: { court?: Court }) {
  const [state, action] = useFormState(upsertCourt, {});
  return (
    <form action={action} className="card space-y-3 px-5 py-5">
      {court && <input type="hidden" name="id" value={court.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Название</label>
          <input name="name" required defaultValue={court?.name} className="input" />
        </div>
        <div>
          <label className="label">Тип</label>
          <select name="type" defaultValue={court?.type ?? "paid"} className="input">
            <option value="paid">Платный зал</option>
            <option value="free">Бесплатная площадка</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Адрес</label>
        <input name="address" required defaultValue={court?.address} className="input" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">Цена / час</label>
          <input
            name="price_per_hour"
            type="number"
            min={0}
            defaultValue={court?.price_per_hour ?? 0}
            className="input"
          />
        </div>
        <div>
          <label className="label">Lat</label>
          <input name="lat" defaultValue={court?.lat ?? ""} className="input" />
        </div>
        <div>
          <label className="label">Lng</label>
          <input name="lng" defaultValue={court?.lng ?? ""} className="input" />
        </div>
      </div>
      <div>
        <label className="label">Ссылка на фото</label>
        <input name="photo_url" defaultValue={court?.photo_url ?? ""} className="input" />
      </div>
      <div>
        <label className="label">Описание</label>
        <textarea name="description" rows={3} defaultValue={court?.description ?? ""} className="input" />
      </div>
      <div>
        <label className="label">Номер для брони</label>
        <input
          name="booking_phone"
          type="tel"
          defaultValue={court?.booking_phone ?? ""}
          placeholder="+996700123456"
          className="input"
        />
        <p className="mt-1 text-xs text-ink/60">
          Телефон, по которому игроки бронируют зал. Покажется на странице площадки.
        </p>
      </div>
      <div>
        <label className="label">Статус</label>
        <select name="status" defaultValue={court?.status ?? "active"} className="input">
          <option value="active">Активна</option>
          <option value="hidden">Скрыта</option>
        </select>
      </div>
      <FieldError message={state.error} />
      {state.ok && <p className="text-sm text-green-700">Сохранено.</p>}
      <SubmitButton>{court ? "Обновить" : "Добавить"}</SubmitButton>
    </form>
  );
}
