import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface HostedRoomRow {
  code: string;
  title: string | null;
  scheduled_at: string | null;
  locked: boolean;
  waiting_room_enabled: boolean;
  created_at: string;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RoomRow({ room, hostName }: { room: HostedRoomRow; hostName: string }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-md border border-line bg-panel px-4 py-3">
      <div className="min-w-0">
        {room.title && (
          <p className="truncate text-sm font-semibold text-paper">{room.title}</p>
        )}
        <p className="font-mono text-sm text-dust">{room.code}</p>
        <p className="mt-0.5 font-mono text-[11px] text-dust-dim">
          {room.scheduled_at
            ? `Prévue le ${formatDateTime(room.scheduled_at)}`
            : `Créée le ${formatDateTime(room.created_at)}`}
          {room.locked && " · verrouillée"}
          {room.waiting_room_enabled && " · salle d'attente activée"}
        </p>
      </div>
      <Link
        href={`/r/${room.code}?name=${encodeURIComponent(hostName)}`}
        className="shrink-0 rounded-sm bg-amber px-3 py-1.5 text-sm font-semibold text-console hover:bg-amber-dim"
      >
        Rejoindre
      </Link>
    </li>
  );
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
    .select("code, title, scheduled_at, locked, waiting_room_enabled, created_at")
    .eq("host_user_id", user.id)
    .order("created_at", { ascending: false });

  const rooms = (data ?? []) as HostedRoomRow[];
  // eslint-disable-next-line react-hooks/purity -- composant serveur (RSC), pas un rendu React classique
  const now = Date.now();
  const upcoming = rooms
    .filter((r) => r.scheduled_at && new Date(r.scheduled_at).getTime() > now)
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime());
  const past = rooms.filter((r) => !r.scheduled_at || new Date(r.scheduled_at).getTime() <= now);

  const hostName =
    (user.user_metadata?.full_name as string | undefined)?.trim() || user.email || "Hôte";

  return (
    <div className="flex flex-1 flex-col px-6 py-12 sm:px-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-3xl font-bold text-paper">Mes réunions</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/schedule"
              className="rounded-sm bg-amber px-3 py-1.5 text-sm font-semibold text-console hover:bg-amber-dim"
            >
              Planifier
            </Link>
            <Link
              href="/"
              className="rounded-sm border border-line px-3 py-1.5 text-sm text-dust hover:text-paper"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>

        {error && (
          <p className="text-sm text-danger">
            Impossible de charger vos réunions : {error.message}
          </p>
        )}

        {!error && rooms.length === 0 && (
          <p className="rounded-md border border-line bg-panel p-6 text-sm text-dust">
            Vous n&apos;avez encore créé aucune réunion. Les salles que vous créez ou planifiez en
            étant connecté apparaîtront ici.
          </p>
        )}

        {upcoming.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.15em] text-teal">
              À venir
            </h2>
            <ul className="space-y-2">
              {upcoming.map((room) => (
                <RoomRow key={room.code} room={room} hostName={hostName} />
              ))}
            </ul>
          </div>
        )}

        {past.length > 0 && (
          <div>
            <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.15em] text-dust-dim">
              Passées
            </h2>
            <ul className="space-y-2">
              {past.map((room) => (
                <RoomRow key={room.code} room={room} hostName={hostName} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
