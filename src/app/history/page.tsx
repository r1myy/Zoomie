import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface HostedRoomRow {
  code: string;
  locked: boolean;
  waiting_room_enabled: boolean;
  created_at: string;
}

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // La RLS ("Hosts can view their own rooms") ne renvoie de toute façon que
  // les salles de cet utilisateur ; le filtre explicite documente l'intention.
  const { data, error } = await supabase
    .from("rooms")
    .select("code, locked, waiting_room_enabled, created_at")
    .eq("host_user_id", user.id)
    .order("created_at", { ascending: false });

  const rooms = (data ?? []) as HostedRoomRow[];

  return (
    <div className="flex flex-1 flex-col px-6 py-12 sm:px-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-3xl font-bold text-paper">Mes réunions</h1>
          <Link
            href="/"
            className="rounded-sm border border-line px-3 py-1.5 text-sm text-dust hover:text-paper"
          >
            Retour à l&apos;accueil
          </Link>
        </div>

        {error && (
          <p className="text-sm text-danger">
            Impossible de charger vos réunions : {error.message}
          </p>
        )}

        {!error && rooms.length === 0 && (
          <p className="rounded-md border border-line bg-panel p-6 text-sm text-dust">
            Vous n&apos;avez encore créé aucune réunion. Les salles que vous créez en étant
            connecté apparaîtront ici, avec la possibilité de les rejoindre à nouveau en
            reprenant votre rôle d&apos;hôte.
          </p>
        )}

        <ul className="space-y-2">
          {rooms.map((room) => (
            <li
              key={room.code}
              className="flex items-center justify-between rounded-md border border-line bg-panel px-4 py-3"
            >
              <div>
                <p className="font-mono text-sm font-semibold text-paper">{room.code}</p>
                <p className="mt-0.5 font-mono text-[11px] text-dust-dim">
                  Créée le{" "}
                  {new Date(room.created_at).toLocaleDateString("fr-CA", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {room.locked && " · verrouillée"}
                  {room.waiting_room_enabled && " · salle d'attente activée"}
                </p>
              </div>
              <Link
                href={`/r/${room.code}?name=${encodeURIComponent(
                  (user.user_metadata?.full_name as string | undefined)?.trim() ||
                    user.email ||
                    "Hôte"
                )}`}
                className="shrink-0 rounded-sm bg-amber px-3 py-1.5 text-sm font-semibold text-console hover:bg-amber-dim"
              >
                Rejoindre
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
