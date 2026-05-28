-- =====================================================================
-- HoopKG initial schema
-- Run this against your Supabase project (SQL editor or `supabase db push`).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('user', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type skill_level as enum ('beginner', 'intermediate', 'advanced');
exception when duplicate_object then null; end $$;

do $$ begin
  create type court_type as enum ('paid', 'free');
exception when duplicate_object then null; end $$;

do $$ begin
  create type court_status as enum ('active', 'hidden');
exception when duplicate_object then null; end $$;

do $$ begin
  create type game_format as enum ('3x3', '4x4', '5x5', 'free');
exception when duplicate_object then null; end $$;

do $$ begin
  create type game_status as enum ('open', 'full', 'finished', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type participant_status as enum ('joined', 'left', 'banned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type receipt_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  phone text,
  telegram_username text,
  show_phone boolean not null default false,
  avatar_url text,
  level skill_level not null default 'beginner',
  city text not null default 'Бишкек',
  role user_role not null default 'user',
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);

-- Auto-create profile row on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- COURTS
-- ---------------------------------------------------------------------
create table if not exists public.courts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type court_type not null,
  address text not null,
  lat double precision,
  lng double precision,
  photo_url text,
  price_per_hour integer not null default 0 check (price_per_hour >= 0),
  description text,
  status court_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists courts_status_idx on public.courts(status);
create index if not exists courts_type_idx on public.courts(type);

-- ---------------------------------------------------------------------
-- GAMES
-- ---------------------------------------------------------------------
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  court_id uuid not null references public.courts(id) on delete restrict,
  title text not null,
  date date not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  format game_format not null default '5x5',
  max_players integer not null check (max_players between 2 and 30),
  price_per_player integer not null default 0 check (price_per_player >= 0),
  description text,
  is_private boolean not null default false,
  invite_token text not null unique default encode(gen_random_bytes(12), 'hex'),
  status game_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint games_time_check check (ends_at > starts_at)
);

create index if not exists games_date_idx on public.games(date);
create index if not exists games_status_idx on public.games(status);
create index if not exists games_court_idx on public.games(court_id);
create index if not exists games_creator_idx on public.games(creator_id);
create index if not exists games_invite_idx on public.games(invite_token);

-- ---------------------------------------------------------------------
-- GAME PARTICIPANTS
-- ---------------------------------------------------------------------
create table if not exists public.game_participants (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status participant_status not null default 'joined',
  joined_at timestamptz not null default now(),
  unique (game_id, user_id)
);

create index if not exists participants_game_idx on public.game_participants(game_id);
create index if not exists participants_user_idx on public.game_participants(user_id);

-- ---------------------------------------------------------------------
-- RENTAL RECEIPTS
-- ---------------------------------------------------------------------
create table if not exists public.rental_receipts (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  file_path text not null,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  status receipt_status not null default 'pending',
  uploaded_at timestamptz not null default now()
);

create index if not exists receipts_game_idx on public.rental_receipts(game_id);
create index if not exists receipts_status_idx on public.rental_receipts(status);

-- ---------------------------------------------------------------------
-- COURT PRESENCE (free courts: "I'm here")
-- ---------------------------------------------------------------------
create table if not exists public.court_presence (
  id uuid primary key default gen_random_uuid(),
  court_id uuid not null references public.courts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  updated_at timestamptz not null default now(),
  unique (court_id, user_id)
);

create index if not exists presence_court_idx on public.court_presence(court_id);
create index if not exists presence_updated_idx on public.court_presence(updated_at);

-- ---------------------------------------------------------------------
-- HELPER FUNCTIONS
-- ---------------------------------------------------------------------
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = uid and role = 'admin');
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_courts_touch on public.courts;
create trigger trg_courts_touch before update on public.courts
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_games_touch on public.games;
create trigger trg_games_touch before update on public.games
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_presence_touch on public.court_presence;
create trigger trg_presence_touch before update on public.court_presence
  for each row execute function public.touch_updated_at();

-- Counters and auto-status for games.
create or replace function public.refresh_game_status(g_id uuid)
returns void language plpgsql as $$
declare
  cur integer;
  max_p integer;
  cur_status game_status;
begin
  select max_players, status into max_p, cur_status from public.games where id = g_id for update;
  if cur_status in ('finished', 'cancelled') then return; end if;

  select count(*) into cur
  from public.game_participants
  where game_id = g_id and status = 'joined';

  if cur >= max_p then
    update public.games set status = 'full' where id = g_id;
  else
    update public.games set status = 'open' where id = g_id and status = 'full';
  end if;
end;
$$;

create or replace function public.on_participant_change()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'DELETE') then
    perform public.refresh_game_status(old.game_id);
    return old;
  end if;
  perform public.refresh_game_status(new.game_id);
  return new;
end;
$$;

drop trigger if exists trg_participants_refresh on public.game_participants;
create trigger trg_participants_refresh
  after insert or update or delete on public.game_participants
  for each row execute function public.on_participant_change();

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.courts enable row level security;
alter table public.games enable row level security;
alter table public.game_participants enable row level security;
alter table public.rental_receipts enable row level security;
alter table public.court_presence enable row level security;

-- ---------- profiles ----------
drop policy if exists "profiles_read_public" on public.profiles;
create policy "profiles_read_public" on public.profiles
  for select using (true);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- role and is_blocked cannot be changed by the user themselves
    and role = (select role from public.profiles where id = auth.uid())
    and is_blocked = (select is_blocked from public.profiles where id = auth.uid())
  );

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ---------- courts ----------
drop policy if exists "courts_read_active" on public.courts;
create policy "courts_read_active" on public.courts
  for select using (status = 'active' or public.is_admin(auth.uid()));

drop policy if exists "courts_admin_write" on public.courts;
create policy "courts_admin_write" on public.courts
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ---------- games ----------
drop policy if exists "games_read" on public.games;
create policy "games_read" on public.games
  for select using (
    not is_private
    or creator_id = auth.uid()
    or exists (
      select 1 from public.game_participants gp
      where gp.game_id = games.id and gp.user_id = auth.uid() and gp.status = 'joined'
    )
    or public.is_admin(auth.uid())
  );

drop policy if exists "games_insert_authenticated" on public.games;
create policy "games_insert_authenticated" on public.games
  for insert with check (
    auth.uid() is not null
    and auth.uid() = creator_id
    and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_blocked)
  );

drop policy if exists "games_update_creator" on public.games;
create policy "games_update_creator" on public.games
  for update using (creator_id = auth.uid() or public.is_admin(auth.uid()))
  with check (
    (creator_id = (select creator_id from public.games g2 where g2.id = games.id))
    or public.is_admin(auth.uid())
  );

drop policy if exists "games_delete_creator" on public.games;
create policy "games_delete_creator" on public.games
  for delete using (creator_id = auth.uid() or public.is_admin(auth.uid()));

-- ---------- game_participants ----------
drop policy if exists "participants_read" on public.game_participants;
create policy "participants_read" on public.game_participants
  for select using (
    exists (
      select 1 from public.games g
      where g.id = game_participants.game_id
        and (not g.is_private or g.creator_id = auth.uid()
             or exists (select 1 from public.game_participants gp2
                        where gp2.game_id = g.id and gp2.user_id = auth.uid()))
    )
    or public.is_admin(auth.uid())
  );

drop policy if exists "participants_insert_self" on public.game_participants;
create policy "participants_insert_self" on public.game_participants
  for insert with check (
    auth.uid() = user_id
    and status = 'joined'
    and exists (
      select 1 from public.games g
      where g.id = game_id
        and g.status = 'open'
        and (select count(*) from public.game_participants gp
             where gp.game_id = g.id and gp.status = 'joined') <= g.max_players
    )
    and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_blocked)
  );

drop policy if exists "participants_update_self_or_creator" on public.game_participants;
create policy "participants_update_self_or_creator" on public.game_participants
  for update using (
    user_id = auth.uid()
    or exists (select 1 from public.games g where g.id = game_id and g.creator_id = auth.uid())
    or public.is_admin(auth.uid())
  );

drop policy if exists "participants_delete_self_or_creator" on public.game_participants;
create policy "participants_delete_self_or_creator" on public.game_participants
  for delete using (
    user_id = auth.uid()
    or exists (select 1 from public.games g where g.id = game_id and g.creator_id = auth.uid())
    or public.is_admin(auth.uid())
  );

-- ---------- rental_receipts ----------
drop policy if exists "receipts_read" on public.rental_receipts;
create policy "receipts_read" on public.rental_receipts
  for select using (
    uploaded_by = auth.uid()
    or exists (select 1 from public.games g where g.id = game_id and g.creator_id = auth.uid())
    or exists (select 1 from public.game_participants gp
               where gp.game_id = rental_receipts.game_id and gp.user_id = auth.uid())
    or public.is_admin(auth.uid())
  );

drop policy if exists "receipts_insert_creator" on public.rental_receipts;
create policy "receipts_insert_creator" on public.rental_receipts
  for insert with check (
    auth.uid() = uploaded_by
    and exists (select 1 from public.games g where g.id = game_id and g.creator_id = auth.uid())
  );

drop policy if exists "receipts_admin_update" on public.rental_receipts;
create policy "receipts_admin_update" on public.rental_receipts
  for update using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "receipts_admin_delete" on public.rental_receipts;
create policy "receipts_admin_delete" on public.rental_receipts
  for delete using (public.is_admin(auth.uid()) or uploaded_by = auth.uid());

-- ---------- court_presence ----------
drop policy if exists "presence_read_fresh" on public.court_presence;
create policy "presence_read_fresh" on public.court_presence
  for select using (updated_at > now() - interval '2 hours' or user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "presence_insert_self" on public.court_presence;
create policy "presence_insert_self" on public.court_presence
  for insert with check (auth.uid() = user_id);

drop policy if exists "presence_update_self" on public.court_presence;
create policy "presence_update_self" on public.court_presence
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "presence_delete_self" on public.court_presence;
create policy "presence_delete_self" on public.court_presence
  for delete using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------
-- STORAGE bucket for rental receipts (private, signed URLs only).
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'rental-receipts',
  'rental-receipts',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'application/pdf']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies: file path must be 'game_<game_id>/...' and uploader must be the game creator.
drop policy if exists "receipts_storage_insert" on storage.objects;
create policy "receipts_storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'rental-receipts'
    and auth.uid() is not null
    and exists (
      select 1 from public.games g
      where g.creator_id = auth.uid()
        and split_part(storage.objects.name, '/', 1) = 'game_' || g.id::text
    )
  );

drop policy if exists "receipts_storage_select" on storage.objects;
create policy "receipts_storage_select" on storage.objects
  for select using (
    bucket_id = 'rental-receipts'
    and (
      public.is_admin(auth.uid())
      or exists (
        select 1 from public.games g
        where 'game_' || g.id::text = split_part(storage.objects.name, '/', 1)
          and (
            g.creator_id = auth.uid()
            or exists (select 1 from public.game_participants gp
                       where gp.game_id = g.id and gp.user_id = auth.uid())
          )
      )
    )
  );

drop policy if exists "receipts_storage_delete" on storage.objects;
create policy "receipts_storage_delete" on storage.objects
  for delete using (
    bucket_id = 'rental-receipts'
    and (public.is_admin(auth.uid())
         or owner = auth.uid())
  );

-- ---------------------------------------------------------------------
-- SEED: two demo courts for Bishkek.
-- ---------------------------------------------------------------------
insert into public.courts (name, type, address, price_per_hour, description, photo_url)
values
  ('Bilimkana Arena', 'paid', 'Бишкек, ул. Ахунбаева 119а', 1000,
   'Крытый зал. Аренда по часам. Подходит для 5x5.', null),
  ('Yntymak', 'free', 'Бишкек, парк Ынтымак', 0,
   'Открытая бесплатная площадка. Свободная игра.', null)
on conflict do nothing;
