// Types minimaux, écrits à la main, pour les tables utilisées par
// src/lib/rooms/store.ts (voir supabase/schema.sql). Pas de génération
// automatique pour l'instant — le schéma est petit et stable.
//
// `type` plutôt qu'`interface` : c'est la convention des types générés par
// Supabase, et les interfaces (sans signature d'index) ne satisfont pas
// correctement les contraintes génériques `Record<string, unknown>` du
// client typé.

export type RoomRow = {
  code: string;
  host_identity: string;
  host_user_id: string | null;
  locked: boolean;
  waiting_room_enabled: boolean;
  created_at: string;
};

export type JoinRequestRow = {
  id: string;
  room_code: string;
  identity: string;
  display_name: string;
  status: "pending" | "admitted" | "denied";
  token: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      rooms: {
        Row: RoomRow;
        Insert: Partial<RoomRow> & Pick<RoomRow, "code">;
        Update: Partial<RoomRow>;
        Relationships: [];
      };
      join_requests: {
        Row: JoinRequestRow;
        Insert: Partial<JoinRequestRow> &
          Pick<JoinRequestRow, "id" | "room_code" | "identity" | "display_name">;
        Update: Partial<JoinRequestRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
