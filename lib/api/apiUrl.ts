/**
 * Construye la URL del API REST.
 *
 * - Por defecto: rutas relativas `/api/...` → mismo origen que el front.
 *   Con `API_PROXY_TARGET` en Next, el proxy reenvía a Express y la cookie `pw_session`
 *   queda en el origen del front (recomendado en local).
 *
 * - `NEXT_PUBLIC_API_BASE_URL`: en **producción** (o con `NEXT_PUBLIC_FORCE_DIRECT_API=true` en dev)
 *   las peticiones van directas a ese host. En **desarrollo**, si la variable existe pero no fuerzas
 *   directo, se **ignora** y se usan rutas relativas para evitar que la cookie se quede en otro puerto.
 */
export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;
  const base = typeof raw === "string" ? raw.trim().replace(/\/$/, "") : "";
  if (!base) return p;

  const forceDirect = process.env.NEXT_PUBLIC_FORCE_DIRECT_API === "true";
  if (process.env.NODE_ENV === "development" && !forceDirect) {
    return p;
  }

  return `${base}${p}`;
}
