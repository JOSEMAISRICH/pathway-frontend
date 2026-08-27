/** Tema claro y calmado para el cliente (Magic Link), sin menús de agencia */
export default function MagicPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="portal-magic-surface min-h-screen">{children}</div>;
}
