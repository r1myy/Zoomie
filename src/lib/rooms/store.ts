// Couche salles : registre en mémoire pour le développement local.
// À remplacer par Supabase (persistance + temps réel pour la salle d'attente)
// une fois le projet Supabase configuré — voir le plan du projet.

export interface RoomRecord {
  code: string;
  hostIdentity: string;
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

const rooms = new Map<string, RoomRecord>();
const joinRequests = new Map<string, JoinRequest>();

export function getOrCreateRoom(code: string, claimHostIdentity?: string): RoomRecord {
  const existing = rooms.get(code);
  if (existing) return existing;

  const room: RoomRecord = {
    code,
    hostIdentity: claimHostIdentity ?? "",
    locked: false,
    waitingRoomEnabled: false,
    createdAt: Date.now(),
  };
  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): RoomRecord | undefined {
  return rooms.get(code);
}

export function setRoomLocked(code: string, locked: boolean) {
  const room = rooms.get(code);
  if (room) room.locked = locked;
}

export function setWaitingRoomEnabled(code: string, enabled: boolean) {
  const room = rooms.get(code);
  if (room) room.waitingRoomEnabled = enabled;
}

export function isHost(code: string, identity: string): boolean {
  return rooms.get(code)?.hostIdentity === identity;
}

export function createJoinRequest(roomCode: string, identity: string, displayName: string): JoinRequest {
  const request: JoinRequest = {
    id: Math.random().toString(36).slice(2, 10),
    roomCode,
    identity,
    displayName,
    status: "pending",
    createdAt: Date.now(),
  };
  joinRequests.set(request.id, request);
  return request;
}

export function getJoinRequest(id: string): JoinRequest | undefined {
  return joinRequests.get(id);
}

export function listPendingJoinRequests(roomCode: string): JoinRequest[] {
  return Array.from(joinRequests.values())
    .filter((r) => r.roomCode === roomCode && r.status === "pending")
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function setJoinRequestDecision(id: string, status: "admitted" | "denied", token?: string) {
  const request = joinRequests.get(id);
  if (!request) return undefined;
  request.status = status;
  if (token) request.token = token;
  return request;
}
