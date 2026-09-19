# Déploiement de Zoomie en production

Tout tourne sur le VPS Hostinger partagé (72.60.165.79, déjà utilisé pour
CFA Impact, n8n, video.pixora.ca) derrière Traefik (déjà en place,
résolveur ACME `mytlschallenge`, réseau Docker `root_default`). L'app
Next.js et le serveur média LiveKit sont deux conteneurs Docker sur ce même
réseau — `docker-compose.yml` à la racine du dépôt. Déploiement continu via
GitHub Actions (`.github/workflows/deploy.yml`) : chaque push sur `main`
reconstruit et redémarre les conteneurs sur le VPS.

## État actuel

- ✅ Secrets GitHub Actions configurés (`gh secret list --repo r1myy/Zoomie`) :
  clés Supabase, clés LiveKit de production générées, clé API Resend,
  `CRON_SECRET`, `VPS_HOST`, `VPS_SSH_KEY` (réutilise la clé de déploiement
  déjà autorisée sur le VPS pour CFA Impact).
- ✅ `/var/www/zoomie/livekit.yaml` créé sur le VPS avec une vraie paire
  clé/secret LiveKit (pas `devkey`/`secret`).
- ✅ Cron des rappels installé (`/etc/cron.d/zoomie-reminders`, toutes les
  15 min, appelle `/api/reminders/run` en local sur le conteneur).
- ⬜ **DNS à configurer** (bloquant — voir ci-dessous).
- ⬜ **Domaine d'envoi Resend à vérifier** (sinon les invités réels ne
  reçoivent pas les courriels — voir plus bas).
- ⬜ Premier déploiement (se déclenche automatiquement au prochain
  `git push` sur `main`, ou manuellement via `gh workflow run deploy.yml`).

## 1. DNS — à faire avant tout

Ajoutez deux enregistrements A dans le DNS de `pixora.ca`, tous deux
pointant vers `72.60.165.79` :

| Nom                        | Type | Valeur          |
| --------------------------- | ---- | --------------- |
| `meet.pixora.ca`            | A    | `72.60.165.79`  |
| `livekit-meet.pixora.ca`    | A    | `72.60.165.79`  |

Traefik obtient automatiquement un certificat Let's Encrypt pour chaque
domaine à la première requête HTTPS reçue — mais seulement une fois que le
DNS résout correctement. Comptez quelques minutes à quelques heures selon
votre registraire.

## 2. Domaine d'envoi Resend (avant que de vrais invités reçoivent des courriels)

Actuellement configuré avec l'adresse de test `onboarding@resend.dev`, qui
**ne peut livrer qu'à l'adresse courriel de votre propre compte Resend** —
pas aux vrais invités d'une réunion planifiée.

1. Dashboard Resend → **Domains** → **Add Domain** (ex. `mail.pixora.ca`).
2. Ajoutez les enregistrements DNS (SPF/DKIM) qu'affiche Resend.
3. Une fois vérifié :
   ```bash
   gh secret set RESEND_FROM_ADDRESS --repo r1myy/Zoomie --body "Zoomie <reunions@mail.pixora.ca>"
   ```
   Puis redéployez (`gh workflow run deploy.yml --repo r1myy/Zoomie`).

## 3. Premier déploiement

Une fois le DNS propagé, déclenchez le déploiement :

```bash
gh workflow run deploy.yml --repo r1myy/Zoomie
```

(Ou attendez simplement le prochain `git push` sur `main` — le workflow se
déclenche automatiquement.) Suivez sa progression :

```bash
gh run watch --repo r1myy/Zoomie
```

## 4. Vérification

- `https://meet.pixora.ca` charge la page d'accueil Zoomie avec un
  certificat valide.
- `https://livekit-meet.pixora.ca` répond (même une erreur HTTP de LiveKit
  suffit à confirmer que Traefik relaie correctement).
- Créer un compte, se connecter, planifier une réunion avec un invité réel
  → courriel d'invitation bien reçu (une fois le domaine Resend vérifié).
- Rejoindre une réunion à deux depuis deux réseaux différents (ex. wifi +
  partage de connexion 4G) → audio/vidéo fonctionnels (confirme que le TURN
  LiveKit fonctionne réellement, pas seulement la connexion directe).
- `docker compose logs -f zoomie-livekit` sur le VPS ne montre pas
  d'erreurs de connexion au démarrage.

## Notes

- **Pare-feu Hostinger** : `ufw` est inactif sur ce VPS (rien à ouvrir côté
  Linux), mais si le panneau Hostinger a son propre pare-feu cloud, assurez-
  vous que les ports suivants sont ouverts : `80`, `443` (déjà utilisés par
  Traefik pour les autres sites), `7881/tcp`, `3478/udp`,
  `50000-60000/udp` (LiveKit, nouveaux).
- **Réutilisation du VPS** : `docker-compose.yml` ne touche que les
  conteneurs `zoomie` et `zoomie-livekit`, sur le réseau `root_default`
  existant — rien de la configuration CFA Impact/n8n/Traefik n'est modifié.
- **Ressources** : VPS à 3.8 Go de RAM, ~2.5 Go disponibles avant ce
  déploiement — LiveKit et le conteneur Next.js standalone sont légers,
  marge confortable pour l'usage actuel.
- **Mise à jour manuelle si besoin** (dépannage) :
  ```bash
  ssh root@72.60.165.79
  cd /var/www/zoomie && docker compose up -d --build
  ```
