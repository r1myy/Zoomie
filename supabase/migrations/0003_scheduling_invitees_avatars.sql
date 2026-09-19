-- Réunions planifiées, invités par courriel (rappels) et avatars de profil.
-- À exécuter dans le SQL Editor du projet Supabase, après 0002_host_user_id.sql.

alter table public.rooms
  add column if not exists title text,
  add column if not exists scheduled_at timestamptz;

create index if not exists rooms_scheduled_at_idx on public.rooms (scheduled_at);

-- Invités par courriel d'une réunion planifiée : reçoivent un courriel
-- d'invitation à la création, puis un rappel avant l'heure (voir
-- src/app/api/reminders/run/route.ts, déclenché par une tâche planifiée
-- externe). RLS activée sans policy publique — même modèle que
-- rooms/join_requests, géré uniquement via la clé service_role depuis les
-- routes API serveur de confiance.
create table if not exists public.meeting_invitees (
  id uuid primary key default gen_random_uuid(),
  room_code text not null references public.rooms (code) on delete cascade,
  email text not null,
  invited_at timestamptz,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists meeting_invitees_room_code_idx on public.meeting_invitees (room_code);
create index if not exists meeting_invitees_reminder_pending_idx
  on public.meeting_invitees (room_code)
  where reminder_sent_at is null;

alter table public.meeting_invitees enable row level security;

-- Avatars de profil : bucket public (les URLs sont déjà publiques en soi
-- pour des avatars), écriture restreinte au propriétaire du dossier
-- {user_id}/... via la convention de chemin de storage.foldername.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
