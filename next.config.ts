import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Imagen Docker más ligera (`node server.js` en `.next/standalone`). */
  output: "standalone",
  /** Raíz explícita del proyecto (evita advertencia si hay otro lockfile en carpetas superiores) */
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  devIndicators: false,
  /**
   * Reenvío `/api/*` → Express (misma forma que PathWay-Backend/pathway-nextjs-rewrite.example.mjs).
   * En `next dev`, si no defines `API_PROXY_TARGET`, el destino por defecto es `http://localhost:3000`.
   * En producción (`next build` / `next start`) solo se añade rewrite si `API_PROXY_TARGET` está definido
   * (evita apuntar a localhost por accidente).
   */
  async rewrites() {
    const fromEnv = process.env.API_PROXY_TARGET?.trim().replace(/\/$/, "");
    const defaultDev = "http://localhost:3000";
    const target =
      fromEnv || (process.env.NODE_ENV === "development" ? defaultDev : "");
    if (!target) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${target}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      { source: "/portal/login", destination: "/acceso", permanent: false },
      /** Rutas demo portal solicitante → pegar enlace del expediente */
      { source: "/portal/expedientes", destination: "/acceso", permanent: false },
      { source: "/portal/cuenta", destination: "/acceso", permanent: false },
      { source: "/portal/nuevo", destination: "/acceso", permanent: false },
      { source: "/portal/expediente/:path*", destination: "/acceso", permanent: false },
      /** Panel agencia demo → dashboard JWT real */
      { source: "/agency/login", destination: "/sign-in", permanent: false },
      { source: "/agency/registro", destination: "/sign-up", permanent: false },
      { source: "/agency/dashboard", destination: "/dashboard", permanent: false },
      { source: "/agency/dossier/:id", destination: "/dashboard/cases/:id", permanent: false },
      { source: "/agency/planes", destination: "/dashboard/planes", permanent: false },
      { source: "/agency/templates", destination: "/dashboard", permanent: false },
      { source: "/agency/settings", destination: "/dashboard", permanent: false },
      /** Alias panel legacy */
      { source: "/panel", destination: "/dashboard", permanent: false },
      { source: "/panel/login", destination: "/sign-in", permanent: false },
      { source: "/panel/registro", destination: "/sign-up", permanent: false },
      { source: "/panel/planes", destination: "/dashboard/planes", permanent: false },
      { source: "/panel/expediente/:id", destination: "/dashboard/cases/:id", permanent: false },
      /** PathWay URLs históricas → flujo actual */
      {
        source: "/pathway/login",
        has: [{ type: "query", key: "solicitante", value: "1" }],
        destination: "/acceso",
        permanent: false,
      },
      {
        source: "/pathway/login",
        has: [{ type: "query", key: "agencia", value: "1" }],
        destination: "/sign-in",
        permanent: false,
      },
      { source: "/pathway/login", destination: "/pathway", permanent: false },
      {
        source: "/pathway/registro",
        has: [{ type: "query", key: "solicitante", value: "1" }],
        destination: "/acceso",
        permanent: false,
      },
      { source: "/pathway/registro", destination: "/sign-up", permanent: false },
      { source: "/pathway/solicitante", destination: "/acceso", permanent: false },
      {
        source: "/pathway/solicitante/mis-expedientes",
        destination: "/acceso",
        permanent: false,
      },
      {
        source: "/pathway/solicitante/expediente/:path*",
        destination: "/acceso",
        permanent: false,
      },
      { source: "/pathway/solicitante/cuenta", destination: "/acceso", permanent: false },
      { source: "/pathway/agencia", destination: "/dashboard", permanent: false },
      { source: "/pathway/agencia/planes", destination: "/dashboard/planes", permanent: false },
      { source: "/pathway/agencia/:id", destination: "/dashboard/cases/:id", permanent: false },
    ];
  },
};

export default nextConfig;
