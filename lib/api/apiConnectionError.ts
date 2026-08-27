/** Mensaje cuando Next no puede hablar con Express (proxy ECONNREFUSED, etc.). */
export function apiConnectionErrorMessage(): string {
  return "El servidor API no responde (Express en el puerto 3000). Ábrelo en otra terminal, espera a que diga que escucha en :3000 y vuelve a intentar.";
}

export function isLikelyApiDownStatus(status: number): boolean {
  return status === 502 || status === 503 || status === 504 || status === 500;
}

/** Respuesta HTML/texto de Next cuando el proxy no llega a Express. */
export function isNextProxyFailureMessage(message: string): boolean {
  const m = message.toLowerCase().trim();
  return (
    m.includes("internal server error") ||
    m.includes("econnrefused") ||
    m.includes("econnreset") ||
    m === "error 500 (cuerpo vacío)"
  );
}
