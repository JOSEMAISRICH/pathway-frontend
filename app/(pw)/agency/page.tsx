import { redirect } from "next/navigation";

/** Raíz /agency → acceso real del despacho (JWT). */
export default function AgencyIndexPage() {
  redirect("/sign-in");
}
