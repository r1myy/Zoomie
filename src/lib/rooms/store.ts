// Couche salles — persistée dans Supabase (table `rooms` / `join_requests`,
// voir supabase/schema.sql) via la clé service_role, qui contourne la RLS.
// Ces fonctions ne doivent être appelées que depuis des routes serveur de
// confiance (app/api/**) : le contrôle d'accès (qui est hôte, salle
// verrouillée…) est géré applicativement ici, pas par des policies RLS.

import { createAdminClient } from "@/lib/supabase/admin";
import type { JoinRequestRow, RoomRow } from "@/lib/supabase/database.types";

export interface RoomRecord {
  code: string;
  hostIdentity: string;
  hostUserId: string | null;
  locked: boolean;
  waitingRoomEnabled: boolean;
  createdAt: number;
}

export type JoinRequestStatus = "pending" | "admitted" | "denied";

export interface JoinRequest {
  id: string;
  roomCode: string;
  identity: string;
  displayName: string;
  status: JoinRequestStatus;
  createdAt: number;
  token?: string;
}

function fromRoomRow(row: RoomRow): RoomRecord {
  return {
    code: row.code,
    hostIdentity: row.host_identity,
    hostUserId: row.host_user_id,
    locked: row.locked,
    waitingRoomEnabled: row.waiting_room_enabled,
    createdAt: new Date(row.created_at).getTime(),
  };
}

function fromJoinRequestRow(row: JoinRequestRow): JoinRequest {
  return {
    id: row.id,
    roomCode: row.room_code,
    identity: row.identity,
    displayName: row.display_name,
    status: row.status,
    token: row.token ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export async function getOrCreateRoom(
  code: string,
  claimHostIdentity?: string,
  hostUserId?: string | null
): Promise<RoomRecord> {
  const db = createAdminClient();

  const existing = await getRoom(code);
  if (existing) return existing;

  const { data, error } = await db
    .from("rooms")
    .insert({ code, host_identity: claimHostIdentity ?? "", host_user_id: hostUserId ?? null })
    // Une autre requête a pu créer la salle entre-temps (double appel en
    // dev, course entre deux onglets) : on retombe alors sur celle-ci.
    .select()
    .single();

  if (error) {
    const existingAfterRace = await getRoom(code);
    if (existingAfterRace) return existingAfterRace;
    throw new Error(`Impossible de créer la salle : ${error.message}`);
  }

  return fromRoomRow(data as RoomRow);
}

// Un hôte connecté qui revient plus tard (nouvelle session, donc nouvelle
// identité LiveKit éphémère) reprend la main sur sa salle : on met à jour
// host_identity pour qu'elle corresponde à sa session actuelle. Ne fait
// rien si la salle n'a pas de propriétaire ou appartient à quelqu'un d'autre.
export async function reclaimRoomIfOwner(
  code: string,
  identity: string,
  userId: string | null | undefined
): Promise<RoomRecord | undefined> {
  if (!userId) return undefined;
  const room = await getRoom(code);
  if (!room || room.hostUserId !== userId) return undefined;

  const db = createAdminClient();
  const { data, error } = await db
    .from("rooms")
    .update({ host_identity: identity })
    .eq("code", code)
    .select()
    .single();
  if (error) throw new Error(`Impossible de reprendre la salle : ${error.message}`);
  return fromRoomRow(data as RoomRow);
}

export async function getRoom(code: string): Promise<RoomRecord | undefined> {
  const db = createAdminClient();
  const { data, error } = await db.from("rooms").select().eq("code", code).maybeSingle();
  if (error) throw new Error(`Lecture de la salle impossible : ${error.message}`);
  return data ? fromRoomRow(data as RoomRow) : undefined;
}

export async function setRoomLocked(code: string, locked: boolean) {
  const db = createAdminClient();
  await db.from("rooms").update({ locked }).eq("code", code);
}

export async function setWaitingRoomEnabled(code: string, enabled: boolean) {
  const db = createAdminClient();
  await db.from("rooms").update({ waiting_room_enabled: enabled }).eq("code", code);
}

export async function isHost(code: string, identity: string): Promise<boolean> {
  const room = await getRoom(code);
  return room?.hostIdentity === identity;
}

export async function createJoinRequest(
  roomCode: string,
  identity: string,
  displayName: string
): Promise<JoinRequest> {
  const db = createAdminClient();
  const id = Math.random().toString(36).slice(2, 10);
  const { data, error } = await db
    .from("join_requests")
    .insert({ id, room_code: roomCode, identity, display_name: displayName })
    .select()
    .single();
  if (error) throw new Error(`Impossible de créer la demande : ${error.message}`);
  return fromJoinRequestRow(data as JoinRequestRow);
}

export async function getJoinRequest(id: string): Promise<JoinRequest | undefined> {
  const db = createAdminClient();
  const { data, error } = await db.from("join_requests").select().eq("id", id).maybeSingle();
  if (error) throw new Error(`Lecture de la demande impossible : ${error.message}`);
  return data ? fromJoinRequestRow(data as JoinRequestRow) : undefined;
}

export async function listPendingJoinRequests(roomCode: string): Promise<JoinRequest[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("join_requests")
    .select()
    .eq("room_code", roomCode)
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Lecture de la salle d'attente impossible : ${error.message}`);
  return (data as JoinRequestRow[]).map(fromJoinRequestRow);
}

export async function setJoinRequestDecision(
  id: string,
  status: "admitted" | "denied",
  token?: string
): Promise<JoinRequest | undefined> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("join_requests")
    .update({ status, ...(token ? { token } : {}) })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(`Mise à jour de la demande impossible : ${error.message}`);
  return data ? fromJoinRequestRow(data as JoinRequestRow) : undefined;
}
