#!/usr/bin/env bash
# Configuration initiale légère du VPS — Docker et Traefik existent déjà sur
# ce serveur (partagé avec d'autres projets : CFA Impact, n8n,
# video.pixora.ca). On ne fait ici que préparer le dossier et le cron des
# rappels ; le déploiement lui-même (docker compose up -d --build) est fait
# par deploy.yml.
set -euo pipefail

mkdir -p /var/www/zoomie

echo "== Rappel 1h avant une réunion planifiée (cron toutes les 15 min) =="
cat > /etc/cron.d/zoomie-reminders <<EOF
*/15 * * * * root curl -fsS -X POST -H "Authorization: Bearer ${CRON_SECRET}" http://127.0.0.1:3000/api/reminders/run >> /var/log/zoomie-reminders.log 2>&1
EOF
chmod 644 /etc/cron.d/zoomie-reminders

echo "== Terminé =="
echo "Prochaine étape : lancer le workflow 'deploy.yml' (ou pousser sur main)."
