import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image de production légère (déploiement Docker derrière Traefik).
  output: "standalone",
};

export default nextConfig;
