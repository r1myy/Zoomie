-- Zoomie — schéma des salles et de la salle d'attente.
-- À exécuter une fois dans le SQL Editor du projet Supabase
-- (https://supabase.com/dashboard/project/_/sql/new).
--
-- RLS activé sans aucune policy pour anon/authenticated : accès refusé par
-- défaut à tout le monde sauf la clé service_role (qui contourne RLS),
-- utilisée uniquement depuis les routes API serveur de confiance
-- (src/lib/rooms/store.ts). Le contrôle d'accès applicatif (qui est hôte,
-- salle verrouillée, etc.) est déjà géré dans ces routes.

create table if not exists public.rooms (
  code text primary key,
  host_identity text not null default '',
  locked boolean not null default false,
  waiting_room_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.join_requests (
  id text primary key,
  room_code text not null references public.rooms (code) on delete cascade,
  identity text not null,
  display_name text not null,
  status text not null default 'pending' check (status in ('pending', 'admitted', 'denied')),
  token text,
  created_at timestamptz not null default now()
);

create index if not exists join_requests_room_code_status_idx
  on public.join_requests (room_code, status);

alter table public.rooms enable row level security;
alter table public.join_requests enable row level security;
