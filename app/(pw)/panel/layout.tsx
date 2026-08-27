/** Contenedor visual distinto para el panel de agencia (acento ámbar) */
export default function PanelSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="panel-surface">{children}</div>;
}
