# Serveur média LiveKit (dev local)

Zoomie utilise LiveKit en self-hosted comme SFU : le serveur relaie chaque flux audio séparément
à chaque participant, sans les mixer — c'est ce qui permet le mixeur de volume individuel côté
client (voir `src/lib/audio/mixerEngine.ts`).

## Lancer le serveur en local

Installation (une fois) :

```bash
brew install livekit
```

Lancement (mode dev — clé/secret par défaut `devkey`/`secret`, tout en mémoire, rien à configurer) :

```bash
livekit-server --dev
```

Le serveur écoute sur `ws://localhost:7880`. Gardez ce terminal ouvert pendant que vous
développez — l'app Next.js (`npm run dev`) s'y connecte via les variables d'environnement
`LIVEKIT_URL` / `NEXT_PUBLIC_LIVEKIT_WS_URL` (voir `.env.local.example`).

## Production

Pour un déploiement réel, il faudra :
- une configuration `livekit.yaml` avec des clés générées (pas `devkey`/`secret`),
- un serveur TURN (participants derrière NAT/pare-feu strict),
- éventuellement plusieurs nœuds média avec Redis pour la répartition de charge.

Hors scope pour l'instant — à traiter à l'approche de la bêta/lancement.
