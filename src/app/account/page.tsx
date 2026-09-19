"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AccountPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);
      setName((user.user_metadata?.full_name as string | undefined) ?? "");
      setEmail(user.email ?? "");
      setAvatarUrl((user.user_metadata?.avatar_url as string | undefined) ?? null);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Choisissez une image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Image trop lourde (2 Mo max).");
      return;
    }

    setUploadingAvatar(true);
    setAvatarError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(path);
      // L'horodatage évite que le navigateur (ou les participants d'une
      // réunion déjà rejointe) continue d'afficher l'ancien avatar en cache
      // à la même URL après un remplacement.
      const bustedUrl = `${publicUrl.publicUrl}?v=${Date.now()}`;

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: bustedUrl },
      });
      if (updateError) throw updateError;

      setAvatarUrl(bustedUrl);
      router.refresh();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Téléversement impossible.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="font-mono text-sm text-dust-dim">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-md border border-line bg-panel p-6">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-paper">Mon compte</h1>
          <Link href="/" className="text-xs text-dust hover:text-paper">
            Retour
          </Link>
        </div>

        <div className="mb-5 flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-line bg-console">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- avatar hébergé sur Supabase Storage
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-xl text-dust-dim">
                {(name || email).slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <label className="cursor-pointer text-xs font-medium text-teal hover:underline">
              {uploadingAvatar ? "Téléversement…" : "Changer la photo"}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar}
                className="hidden"
              />
            </label>
            {avatarError && <p className="mt-1 text-xs text-danger">{avatarError}</p>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-dust">Votre nom</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-sm border border-line bg-console px-3 py-2 text-sm text-paper focus-visible:outline-teal"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-dust">Courriel</span>
            <input
              value={email}
              disabled
              className="w-full rounded-sm border border-line bg-console px-3 py-2 text-sm text-dust-dim"
            />
          </label>

          {error && <p className="text-xs text-danger">{error}</p>}
          {saved && <p className="text-xs text-teal">Nom mis à jour.</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-sm bg-amber px-4 py-2.5 text-sm font-semibold text-console transition-colors hover:bg-amber-dim disabled:opacity-60"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-dust-dim">
          Le microphone et la caméra par défaut se règlent depuis une réunion, dans le menu ⚙️.
        </p>
      </div>
    </div>
  );
}
