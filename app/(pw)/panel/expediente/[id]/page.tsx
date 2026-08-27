import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function PanelExpedienteRedirectPage({ params }: Props) {
  const { id } = await params;
  redirect(`/dashboard/cases/${encodeURIComponent(id)}`);
}
