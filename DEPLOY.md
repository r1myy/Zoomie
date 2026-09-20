# Déploiement de Zoomie en production

Tout tourne sur le VPS Hostinger partagé (72.60.165.79, déjà utilisé pour
CFA Impact, n8n, video.pixora.ca) derrière Traefik (déjà en place,
résolveur ACME `mytlschallenge`, réseau Docker `root_default`). L'app
Next.js et le serveur média LiveKit sont deux conteneurs Docker sur ce même
réseau — `docker-compose.yml` à la racine du dépôt.

**Déploiement déclenché manuellement** (pas automatique sur push) — voir
"Pourquoi manuel" ci-dessous.

## ⚠️ Incident du 2026-09-19 — à lire avant de déployer

Le premier essai de déploiement a fait planter tout le VPS (CFA Impact
inclus) : `docker-compose.yml` publiait une plage de 10 001 ports UDP
(`50000-60000`) pour les flux média LiveKit. Sans `network_mode: host`,
Docker crée un processus `docker-proxy` **par port publié** — 10 001
processus ont saturé la mémoire du VPS (0 swap configuré), rendant même le
SSH injoignable, et ont fait planter accidentellement le conteneur Traefik
partagé (utilisé par CFA Impact et n8n).

**Corrigé** : la plage est réduite à 100 ports (`50000-50099`, largement
suffisant pour un usage à petite échelle) dans `docker-compose.yml` et
`livekit.yaml.example`. Ne l'agrandissez **jamais** sans d'abord activer
`{"userland-proxy": false}` dans `/etc/docker/daemon.json` (nécessite un
restart du daemon Docker — impact bref sur tous les conteneurs du VPS, à
faire consciemment, jamais en même temps qu'un premier déploiement).

**Pourquoi manuel** : suite à cet incident, le déploiement automatique sur
push a été retiré de `.github/workflows/deploy.yml` — un `git push` met
seulement à jour GitHub, il ne touche plus le VPS. Le déploiement se
déclenche explicitement, quand vous êtes prêt à surveiller ce qui se passe.

## État actuel

- ✅ Secrets GitHub Actions configurés (`gh secret list --repo r1myy/Zoomie`).
- ✅ `/var/www/zoomie/livekit.yaml` existe sur le VPS avec une vraie paire
  clé/secret LiveKit — **mais avec l'ancienne plage de ports (60000) : à
  corriger manuellement avant tout déploiement** (remplacer
  `port_range_end: 60000` par `port_range_end: 50099`, voir
  `livekit.yaml.example` pour le contenu à jour).
- ✅ Cron des rappels installé (`/etc/cron.d/zoomie-reminders`).
- ✅ Traefik et tous les autres services du VPS (CFA Impact, n8n, cobalt)
  vérifiés sains après l'incident.
- ⬜ **DNS à configurer** (bloquant — voir ci-dessous).
- ⬜ **Domaine d'envoi Resend à vérifier** (sinon les invités réels ne
  reçoivent pas les courriels).
- ⬜ Premier déploiement (à déclencher manuellement, voir plus bas).

## 1. DNS

Ajoutez deux enregistrements A dans le DNS de `pixora.ca`, tous deux
pointant vers `72.60.165.79` :

| Nom                        | Type | Valeur          |
| --------------------------- | ---- | --------------- |
| `zoomie.pixora.ca`          | A    | `72.60.165.79`  |
| `livekit.zoomie.pixora.ca`  | A    | `72.60.165.79`  |

Traefik obtient automatiquement un certificat Let's Encrypt pour chaque
domaine à la première requête HTTPS reçue — mais seulement une fois que le
DNS résout correctement. Comptez quelques minutes à quelques heures selon
votre registraire.

## 2. Domaine d'envoi Resend

Actuellement configuré avec l'adresse de test `onboarding@resend.dev`, qui
**ne peut livrer qu'à l'adresse courriel de votre propre compte Resend** —
pas aux vrais invités d'une réunion planifiée.

1. Dashboard Resend → **Domains** → **Add Domain** (ex. `mail.pixora.ca`).
2. Ajoutez les enregistrements DNS (SPF/DKIM) qu'affiche Resend.
3. Une fois vérifié :
   ```bash
   gh secret set RESEND_FROM_ADDRESS --repo r1myy/Zoomie --body "Zoomie <reunions@mail.pixora.ca>"
   ```

## 3. Avant de déclencher le déploiement

Corrigez `/var/www/zoomie/livekit.yaml` sur le VPS (ancienne plage de ports
encore en place depuis avant l'incident) :

```bash
ssh root@72.60.165.79
nano /var/www/zoomie/livekit.yaml   # port_range_end: 60000 → 50099
```

## 4. Déclencher le déploiement

Une fois le DNS propagé et `livekit.yaml` corrigé :

```bash
gh workflow run deploy.yml --repo r1myy/Zoomie
gh run watch --repo r1myy/Zoomie
```

Surveillez activement ce premier run (ne pas lancer puis partir) — si
`docker compose up -d --build` semble bloqué plus de 1-2 minutes sur
"Starting", interrompez et vérifiez `free -h` sur le VPS avant de
laisser continuer.

## 5. Vérification

- `https://zoomie.pixora.ca` charge la page d'accueil Zoomie avec un
  certificat valide.
- `https://livekit.zoomie.pixora.ca` répond (même une erreur HTTP de
  LiveKit suffit à confirmer que Traefik relaie correctement).
- `ssh root@72.60.165.79 "free -h"` — mémoire toujours saine après le
  déploiement (pas de répétition de l'incident).
- Créer un compte, planifier une réunion avec un invité réel → courriel
  bien reçu (une fois le domaine Resend vérifié).
- Rejoindre une réunion à deux depuis deux réseaux différents (ex. wifi +
  partage de connexion 4G) → audio/vidéo fonctionnels (confirme que le TURN
  LiveKit fonctionne réellement).

## Notes

- **Isolation de CFA Impact** : `docker-compose.yml` ne touche que les
  conteneurs `zoomie` et `zoomie-livekit`. L'incident du 2026-09-19 n'a pas
  été causé par un conflit direct avec CFA Impact, mais par un épuisement
  mémoire général du VPS qui a fait planter Traefik (partagé par tous les
  sites) — d'où l'importance de la plage de ports réduite.
- **Pare-feu Hostinger** : `ufw` est inactif sur ce VPS. Si le panneau
  Hostinger a son propre pare-feu cloud, vérifiez que ces ports sont
  ouverts : `80`, `443` (déjà utilisés), `7881/tcp`, `3478/udp`,
  `50000-50099/udp` (LiveKit, nouveaux, plage réduite).
- **Mise à jour manuelle si besoin** (dépannage) :
  ```bash
  ssh root@72.60.165.79
  cd /var/www/zoomie && docker compose up -d --build
  ```
