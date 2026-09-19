# Déploiement de Zoomie en production

Trois pièces séparées à mettre en ligne : le serveur média LiveKit (SFU),
l'app Next.js, et les services déjà hébergés (Supabase, Resend) à finaliser
pour la production. Faites-les dans cet ordre — l'app a besoin de l'URL
LiveKit finale pour ses variables d'environnement.

## 1. LiveKit (SFU auto-hébergé)

Voir [`livekit/production/README.md`](livekit/production/README.md) —
stack Docker Compose (LiveKit + Caddy pour le HTTPS/WSS automatique + TURN
intégré) à lancer sur un petit VPS (Hetzner, DigitalOcean, ~5-8 $/mois).

À la fin de cette étape, vous avez : une URL `wss://livekit.votredomaine.tld`
et une paire clé/secret API LiveKit de production.

## 2. Supabase

- Migrations SQL à exécuter dans le SQL Editor du projet, dans l'ordre, si
  ce n'est pas déjà fait : `supabase/schema.sql`, puis chaque fichier de
  `supabase/migrations/` par ordre numérique.
- **Authentication → URL Configuration** : mettez à jour le "Site URL" et
  ajoutez votre domaine de production aux "Redirect URLs" (sinon les liens
  de confirmation par courriel de l'inscription renverront vers localhost).
- Les clés (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`) restent les mêmes qu'en dev — c'est le même
  projet Supabase, pas besoin d'en créer un nouveau.

## 3. Resend — vérifier un domaine d'envoi

Actuellement configuré avec l'adresse `onboarding@resend.dev`, un domaine de
test Resend qui **ne peut livrer qu'à l'adresse courriel de votre propre
compte Resend** — pas aux vrais invités d'une réunion planifiée. Pour la
production :

1. Dashboard Resend → **Domains** → **Add Domain**, entrez un domaine ou
   sous-domaine que vous contrôlez (ex. `mail.votredomaine.tld`).
2. Ajoutez les enregistrements DNS (SPF/DKIM) qu'affiche Resend chez votre
   registraire, attendez la vérification (quelques minutes à quelques heures).
3. Une fois vérifié, définissez la variable d'environnement
   `RESEND_FROM_ADDRESS=Zoomie <reunions@mail.votredomaine.tld>`.

Tant que ce n'est pas fait, la planification de réunions continue de
fonctionner, mais les courriels aux invités échoueront silencieusement (voir
`src/app/api/schedule/route.ts` — un échec d'envoi individuel n'annule pas
la création de la réunion).

## 4. Déployer l'app Next.js (Vercel recommandé)

Vercel est le chemin le plus direct pour une app Next.js (zéro config,
HTTPS automatique, aperçus de déploiement par PR) :

1. https://vercel.com → **Add New Project** → importez le dépôt GitHub
   `r1myy/Zoomie`.
2. Dans **Environment Variables**, ajoutez toutes les valeurs de
   `.env.local` (voir `.env.local.example` pour la liste complète) :
   `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL` (l'URL HTTPS de
   l'étape 1), `NEXT_PUBLIC_LIVEKIT_WS_URL` (l'URL `wss://` de l'étape 1),
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_ADDRESS`
   (une fois le domaine vérifié), `CRON_SECRET` (une valeur aléatoire, ex.
   `openssl rand -hex 24`).
3. **Deploy**. Build par défaut (`next build`) — aucune configuration
   supplémentaire nécessaire.
4. Domaine personnalisé (optionnel) : **Settings → Domains** dans Vercel,
   suivez les instructions DNS affichées.

## 5. Rappels planifiés (cron externe)

`/api/reminders/run` doit être appelée périodiquement — rien ne la
déclenche automatiquement (voir le commentaire dans
`src/app/api/reminders/run/route.ts`). Un service de cron externe gratuit
convient, ex. [cron-job.org](https://cron-job.org) :

1. Créez une tâche : URL `https://votredomaine.tld/api/reminders/run`,
   méthode **POST**, fréquence toutes les 15-30 minutes.
2. Ajoutez l'en-tête `Authorization: Bearer <CRON_SECRET>` (même valeur que
   la variable d'environnement Vercel).
3. Vérifiez la réponse `{"checked": N, "sent": N}` (HTTP 200) après le
   premier déclenchement.

## 6. Vérification finale

- Créer un compte, se connecter, planifier une réunion avec un invité réel
  → courriel d'invitation bien reçu (domaine Resend vérifié).
- Rejoindre une réunion à deux depuis deux réseaux différents (ex. wifi +
  partage de connexion 4G) → connexion établie, audio/vidéo fonctionnels
  (confirme que le TURN LiveKit fonctionne, pas seulement la connexion
  directe qui marcherait même sans TURN correctement configuré).
- Lien de confirmation d'inscription par courriel pointe vers le bon
  domaine de production, pas localhost.
