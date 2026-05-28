# HoopKG

Минималистичный сервис для поиска людей на баскетбол в Бишкеке.
Создавай игры, присоединяйся к открытым площадкам, собирай команду в платный зал.

**Стек:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (Auth, Postgres, Storage, Realtime, RLS) · Vercel.

---

## 1. Создание Supabase-проекта

1. Зарегистрируйся на [supabase.com](https://supabase.com) и создай новый проект (регион поближе к KG — `eu-central-1` или `ap-southeast-1`).
2. В **Project Settings → API** скопируй:
   - `Project URL` → пойдёт в `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (только серверный!)
3. В **Authentication → Providers** включи нужные методы:
   - **Email** — по умолчанию работает Magic Link.
   - **Phone** — нужен SMS-провайдер (Twilio, MessageBird или Vonage), укажи их credentials.
4. В **Authentication → URL Configuration** добавь:
   - `Site URL`: `http://localhost:3000` для dev и `https://<your-domain>` для прода.
   - `Redirect URLs`: `http://localhost:3000/auth/callback`, `https://<your-domain>/auth/callback`.

---

## 2. Применение SQL-миграций

В Supabase Dashboard открой **SQL Editor → New query**, скопируй содержимое файла
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) и выполни.

Скрипт создаёт:
- таблицы `profiles`, `courts`, `games`, `game_participants`, `rental_receipts`, `court_presence`;
- enum-типы, индексы, foreign keys и unique constraints;
- триггеры (auto-обновление `status`, авто-создание `profiles` при signup);
- политики Row Level Security для всех таблиц;
- bucket `rental-receipts` (приватный, jpg/png/pdf, до 5 МБ) и storage-политики;
- две демо-площадки: `Bilimkana Arena` и `Yntymak`.

Альтернативно через [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref <ref>
supabase db push
```

### Назначение администратора

Чтобы получить доступ к `/admin`, выполни в SQL editor:

```sql
update public.profiles set role = 'admin' where id = '<твой user id>';
```

`user id` найдёшь в **Authentication → Users**.

---

## 3. Переменные окружения

Скопируй `.env.example` в `.env.local` и заполни:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...       # только сервер
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> Никогда не клади `SUPABASE_SERVICE_ROLE_KEY` в клиентский код. Этот ключ читается только из
> server actions/route handlers (`src/lib/supabase/admin.ts` импортирует `server-only`).

---

## 4. Запуск локально

```bash
npm install
npm run dev
```

Открой http://localhost:3000.

Полезные скрипты:

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run build       # production build
```

---

## 5. Деплой на Vercel

1. Запушь репозиторий в GitHub.
2. На [vercel.com](https://vercel.com) импортируй проект.
3. В настройках проекта **Environment Variables** добавь те же четыре переменные.
   `NEXT_PUBLIC_SITE_URL` укажи как `https://<your-domain>`.
4. В Supabase **Authentication → URL Configuration** добавь production URL в
   `Site URL` и `Redirect URLs`.
5. Нажми **Deploy** — Vercel сам соберёт и опубликует.

---

## Структура проекта

```
src/
  app/
    layout.tsx, page.tsx, globals.css, error.tsx, not-found.tsx
    auth/callback/route.ts        # OAuth / magic-link обмен
    login/page.tsx                # вход через телефон или email
    games/                        # список / детальная / создание игры
    courts/                       # список / детальная площадка
    profile/                      # профиль пользователя
    admin/                        # админка (защищена по role = 'admin')
  components/                     # карточки, формы, realtime-хуки
  lib/
    actions/                      # server actions (auth, games, presence, admin)
    supabase/                     # client / server / middleware / admin
    validations.ts                # Zod-схемы
    auth.ts, format.ts, env.ts
  middleware.ts                   # обновление supabase-сессии
  types/database.ts               # TS-типы под схему БД
supabase/migrations/0001_init.sql # вся схема + RLS + storage
```

---

## Возможности MVP

- Регистрация / вход (телефон по SMS-OTP или email magic-link).
- Профиль с именем, телефоном, Telegram, уровнем игры.
- Список площадок c фильтрами «платные / бесплатные».
- Список игр с фильтрами «сегодня / завтра», формату, цене.
- Создание игры за минуту, авто-генерация `invite_token` и share-кнопки (Telegram / WhatsApp).
- Присоединение / выход; реалтайм-счётчик участников (Supabase Realtime).
- Кнопка «Я здесь / Я ушёл» для бесплатных площадок; реалтайм-счётчик присутствия.
- Загрузка чека аренды для платного зала (jpg/png/pdf, ≤5 МБ), приватный bucket, signed URLs.
- Админка: добавление/редактирование площадок, модерация чеков, скрытие игр, блокировка пользователей.
- Защита от спама: ≤5 игр в день на пользователя, ≤1 нажатие «Я здесь» раз в 2 минуты.

## Безопасность

- RLS включён для всех таблиц, политики покрывают чтение/запись индивидуально.
- `rental-receipts` — приватный bucket; доступ только через короткоживущие signed URLs (10 мин),
  выдаваемые server action’ом после проверки прав через RLS.
- Пользователь не может изменить себе `role` или `is_blocked` — RLS-политика на `profiles` это запрещает.
- Server actions используют `requireUser()` / `requireAdmin()` и валидируют входные данные Zod.

## Что можно добавить дальше

- PWA-режим (manifest уже подключён, осталось добавить service worker и иконки).
- Telegram-бот для уведомлений организатору.
- История завершённых игр и рейтинг игроков.
- Жалобы на пользователя.
