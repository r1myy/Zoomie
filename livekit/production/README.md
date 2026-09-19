# LiveKit en production (auto-hébergé)

Stack minimale à un seul nœud, cohérente avec le choix "self-hosted" du
cahier des charges : LiveKit derrière Caddy (HTTPS/WSS automatique via
Let's Encrypt), avec le serveur TURN intégré de LiveKit pour les
participants derrière un NAT/pare-feu strict. Pas de Redis ni de multi-nœud
— inutile tant que Zoomie n'a pas besoin de scaler horizontalement.

## Prérequis

- Un VPS avec Docker + Docker Compose installés (Ubuntu 22.04/24.04
  convient). Hetzner CX22 ou DigitalOcean Basic Droplet (~5-8 $/mois)
  suffisent largement pour démarrer.
- Un sous-domaine pointant vers l'IP du VPS, ex. `livekit.votredomaine.tld`
  (enregistrement DNS de type A). Caddy a besoin de ce domaine pour obtenir
  automatiquement un certificat TLS.
- Ports ouverts sur le pare-feu du VPS :
  - `80/tcp` et `443/tcp` (Caddy — HTTP→HTTPS redirect + WSS)
  - `7881/tcp` (LiveKit — fallback TCP pour les flux média)
  - `3478/udp` (LiveKit — serveur TURN intégré)
  - `50000-60000/udp` (LiveKit — flux média WebRTC directs)

## Étapes

1. Copiez ce dossier (`livekit/production/`) sur le VPS.

2. Éditez `Caddyfile` : remplacez `livekit.VOTREDOMAINE.tld` par votre vrai
   sous-domaine.

3. Générez une vraie paire de clés (ne réutilisez jamais `devkey`/`secret`) :

   ```bash
   docker run --rm livekit/livekit-server generate-keys
   ```

4. Copiez `livekit.yaml.example` en `livekit.yaml` (jamais commité), collez-y
   la clé/secret générés à l'étape précédente et le nom de domaine choisi.

5. Lancez la stack :

   ```bash
   docker compose up -d
   ```

   Premier démarrage : Caddy obtient son certificat auprès de Let's Encrypt
   (peut prendre jusqu'à une minute). Vérifiez avec `docker compose logs -f caddy`.

6. Vérifiez que le serveur répond :

   ```bash
   curl https://livekit.votredomaine.tld
   ```

   Une réponse (même une erreur HTTP de LiveKit, ex. "Not Found") confirme
   que Caddy relaie correctement vers LiveKit.

7. Dans les variables d'environnement de Zoomie (Vercel ou autre hébergeur —
   voir `DEPLOY.md` à la racine), mettez à jour :

   ```
   LIVEKIT_URL=https://livekit.votredomaine.tld
   NEXT_PUBLIC_LIVEKIT_WS_URL=wss://livekit.votredomaine.tld
   LIVEKIT_API_KEY=<la clé générée à l'étape 3>
   LIVEKIT_API_SECRET=<le secret généré à l'étape 3>
   ```

8. Redéployez Zoomie, puis testez une vraie réunion à deux participants
   (idéalement sur deux réseaux différents, ex. wifi + 4G) pour confirmer
   que le TURN fonctionne bout-en-bout.

## TURN-TLS (optionnel — réseaux d'entreprise très restrictifs)

Le TURN en UDP (étape 4, port 3478) couvre la grande majorité des réseaux.
Certains réseaux d'entreprise ne laissent passer que le port 443 en TCP :
pour ces cas, LiveKit peut aussi servir du TURN-TLS sur le port 5349, en
réutilisant le certificat déjà obtenu par Caddy. Si vous rencontrez ce
problème en usage réel :

1. Montez le volume de certificats de Caddy dans le conteneur LiveKit
   (ajoutez `- caddy_data:/caddy-certs:ro` sous `volumes:` du service
   `livekit` dans `docker-compose.yml`).
2. Repérez le chemin exact du certificat une fois émis :
   `docker compose exec caddy find /data -name "*.crt"`.
3. Ajoutez à `livekit.yaml`, sous `turn:` :
   ```yaml
   tls_port: 5349
   domain: livekit.votredomaine.tld
   cert_file: /caddy-certs/<chemin trouvé à l'étape 2>
   key_file: /caddy-certs/<chemin .key correspondant>
   ```
4. Ouvrez le port `5349/tcp` sur le pare-feu, redémarrez `docker compose up -d`.

## Maintenance

- Mises à jour : `docker compose pull && docker compose up -d`.
- Logs : `docker compose logs -f livekit`.
- Sauvegarde : aucune donnée persistante côté LiveKit (les salles/participants
  vivent en mémoire process, l'état durable de Zoomie est dans Supabase) —
  rien à sauvegarder ici en dehors de `livekit.yaml` lui-même.
