-- Add a booking contact phone to courts (e.g. the rental admin's number).
alter table public.courts
  add column if not exists booking_phone text;
