# Zoomie

Visioconférence avec mixeur de volume individuel — chaque participant règle, de son côté et en
direct, le volume qu'il perçoit de chacun des autres, sans jamais changer ce que les autres
entendent. Inspiré de SonoBus.

## Démarrer en local

Il faut deux serveurs en parallèle : le serveur média LiveKit (SFU) et l'app Next.js.

**1. Serveur LiveKit** (une fois : `brew install livekit`) :

```bash
livekit-server --dev
```

Écoute sur `ws://localhost:7880` avec les clés de dev par défaut (`devkey` / `secret`). Détails
dans [`livekit/README.md`](livekit/README.md).

**2. Variables d'environnement** — copiez `.env.local.example` en `.env.local` (déjà pré-rempli
pour le dev local ; les clés Supabase restent à ajouter quand ce sera branché).

**3. App Next.js :**

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

## Fonctionnalités livrées

- Réunion vidéo multi-participants (grille), avec mise en évidence de l'orateur actif
- **Mixeur audio individuel** : curseur de volume (0–150 %) et vu-mètre par participant,
  appliqué localement via Web Audio API (`src/lib/audio/mixerEngine.ts`) — jamais renvoyé au
  serveur. Réglages sauvegardés par nom de participant dans `localStorage`.
- Volume général de sortie, en plus des réglages individuels
- Chat texte en direct (data-channel LiveKit)
- Partage d'écran (un seul à la fois)
- Salle d'attente optionnelle, activable par l'hôte
- Contrôles hôte : couper le micro d'un participant pour tout le monde, l'exclure, verrouiller
  la salle
- Invitation : lien copiable, code copiable, partage natif, courriel, WhatsApp
- Accès invité sans compte (comptes persistants prévus via Supabase, pas encore branché)

## Architecture

- **SFU** : LiveKit self-hosted — chaque flux audio distant reste séparé jusqu'au client, ce qui
  rend le mixeur individuel possible (un SFU qui mixerait déjà l'audio empêcherait ça).
- **Salles/hôte/salle d'attente** : registre en mémoire côté serveur pour l'instant
  (`src/lib/rooms/store.ts`) — ne survit pas à un redémarrage du serveur. À migrer vers Supabase.
- **Next.js App Router**, TypeScript, Tailwind CSS v4.

Le plan d'implémentation détaillé vit dans la mémoire de l'assistant si vous y avez accès, sinon
ce README et l'historique de commits font foi.

## À venir

- Intégration Supabase : comptes persistants, salles qui survivent à un redémarrage, historique
  des réunions
- Application desktop (Electron), après stabilisation du web
