import { redirect } from "next/navigation";

export default function PanelLoginRedirectPage() {
  redirect("/sign-in");
}
