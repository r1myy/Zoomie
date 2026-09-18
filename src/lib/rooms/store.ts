// Couche salles : registre en mémoire pour le développement local.
// À remplacer par Supabase (persistance + temps réel pour la salle d'attente)
// une fois le projet Supabase configuré — voir le plan du projet.

export interface RoomRecord {
  code: string;
  hostIdentity: string;
  locked: boolean;
  createdAt: number;
}

const rooms = new Map<string, RoomRecord>();

export function getOrCreateRoom(code: string, claimHostIdentity?: string): RoomRecord {
  const existing = rooms.get(code);
  if (existing) return existing;

  const room: RoomRecord = {
    code,
    hostIdentity: claimHostIdentity ?? "",
    locked: false,
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

export function isHost(code: string, identity: string): boolean {
  return rooms.get(code)?.hostIdentity === identity;
}
