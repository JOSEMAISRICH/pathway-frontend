import { redirect } from "next/navigation";

/** El portal del cliente no usa registro con contraseña: acceso solo por Magic Link. */
export default function PortalRegistroRedirectPage() {
  redirect("/acceso");
}
