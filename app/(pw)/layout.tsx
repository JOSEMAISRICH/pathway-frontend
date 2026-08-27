import type { Metadata } from "next";
import { Outfit, DM_Sans } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import "./pathway.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-pathway",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-pathway-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PathWay — Infraestructura digital para la movilidad global",
  description:
    "Centraliza expedientes, automatiza la recogida de documentos y escala tu agencia. Portal y panel profesional.",
};

export default function PathwayAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`pathway-root ${outfit.variable} ${dmSans.className}`}
      style={{ fontFamily: "var(--font-pathway-body), system-ui, sans-serif" }}
    >
      <ToastProvider>{children}</ToastProvider>
    </div>
  );
}
