import { apiUrl } from "@/lib/api/apiUrl";

/**
 * Correo de comprobación tras el registro.
 * Apagado por defecto (hace falta servicio externo: Resend, SendGrid, etc.).
 *
 * Para activarlo: en `.env.local` del front pon `NEXT_PUBLIC_SEND_VERIFICATION_EMAIL=true`
 * e implementa en Express `POST /api/auth/send-verification` (o cambia la URL aquí).
 */
export async function maybeSendRegistrationVerificationEmail(email: string, agencyName: string): Promise<void> {
  if (process.env.NEXT_PUBLIC_SEND_VERIFICATION_EMAIL !== "true") return;

  try {
    await fetch(apiUrl("/api/auth/send-verification"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, name: agencyName }),
    });
  } catch {
    /* Ruta aún no implementada o red caída: no bloquea el registro */
  }
}
