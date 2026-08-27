/**
 * Ejemplo alineado con PathWay-Backend/pathway-nextjs-rewrite.example.mjs.
 * Fusiona en `next.config.js` / `next.config.mjs` dentro de `nextConfig`:
 *
 *   async rewrites() {
 *     return [
 *       { source: '/api/:path*', destination: 'http://localhost:3000/api/:path*' },
 *     ];
 *   },
 *
 * En este repo la configuración activa es `next.config.ts` (mismo patrón + override con `API_PROXY_TARGET`).
 */
export const pathwayApiRewritesExample = [
  { source: "/api/:path*", destination: "http://localhost:3000/api/:path*" },
];
