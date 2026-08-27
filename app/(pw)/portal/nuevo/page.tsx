import { redirect } from "next/navigation";

/** Demo legacy: el cliente real entra solo por enlace mágico (`/portal/login`). */
export default function PortalNuevoRedirectPage() {
  redirect("/acceso");
}
