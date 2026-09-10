import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compacte build voor Docker (zie Dockerfile) — draait zonder node_modules erbij te kopieren.
  output: "standalone",
};

export default nextConfig;
