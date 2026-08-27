/**
 * En desarrollo, un 404 en `/api/auth/*` suele ser ruta inexistente en Express o API caído;
 * el rewrite por defecto ya manda `/api` a `http://localhost:3000`.
 */
export function withAuthApiSetupHint(message: string, httpStatus: number): string {
  if (process.env.NODE_ENV === "production") return message;
  if (httpStatus !== 404) return message;
  return (
    message +
    " Comprueba en Red (F12) que la URL sea la del front (`:5500/api/…`) y el código 404: si Express no está en 3000, define `API_PROXY_TARGET` en `.env.local` y reinicia `npm run dev`."
  );
}
