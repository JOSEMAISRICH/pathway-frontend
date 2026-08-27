import { redirect } from "next/navigation";

/** Compatibilidad: antes era /portal/login (chocaba con /portal/[magicId]). */
export default function PortalLoginRedirectPage() {
  redirect("/acceso");
}
