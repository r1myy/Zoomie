-- Zoomie — ajoute le lien salle ↔ compte propriétaire.
-- À exécuter une fois dans le SQL Editor du projet Supabase, en plus de
-- supabase/schema.sql (déjà exécuté).
--
-- Permet de reconnaître un hôte qui revient dans une nouvelle session
-- (nouvelle identité LiveKit éphémère à chaque connexion) et alimente
-- "Mes réunions" (historique, section 4.6 du cahier des charges).

alter table public.rooms
  add column if not exists host_user_id uuid references auth.users (id) on delete set null;

create index if not exists rooms_host_user_id_idx on public.rooms (host_user_id);

-- Un utilisateur connecté peut voir les salles qu'il a créées (et seulement
-- celles-là) — les autres opérations restent réservées à la clé
-- service_role, exactement comme avant.
drop policy if exists "Hosts can view their own rooms" on public.rooms;
create policy "Hosts can view their own rooms"
  on public.rooms for select
  to authenticated
  using (host_user_id = auth.uid());
