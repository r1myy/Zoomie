import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

// Client "admin" — clé service_role, contourne RLS. Serveur uniquement,
// jamais importé depuis un composant client ni exposé au navigateur.
// Utilisé pour la gestion des salles (voir src/lib/rooms/store.ts), qui est
// déjà protégée applicativement (vérifications d'hôte dans les routes API).
let client: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createAdminClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Configuration Supabase manquante — NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  client = createSupabaseClient<Database, "public">(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}
