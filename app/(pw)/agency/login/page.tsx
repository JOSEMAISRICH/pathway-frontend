import { redirect } from "next/navigation";

export default function AgencyLoginRedirectPage() {
  redirect("/sign-in");
}
