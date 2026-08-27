"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MagicPortalUnavailable } from "@/components/mongo/MagicPortalUnavailable";
import { MongoMagicPortal } from "@/components/mongo/MongoMagicPortal";
import { PortalMagicSkeleton } from "@/components/ui/Skeleton";
import { apiUrl } from "@/lib/api/apiUrl";

const RESERVED_SLUGS = new Set(["login", "registro", "nuevo", "expedientes", "cuenta"]);

/**
 * Si la API responde OK para el token → portal Mongo (`MongoMagicPortal`).
 * Si falla → pantalla de error (sin modo demo en localStorage).
 */
export default function MagicPortalPage() {
  const params = useParams();
  const router = useRouter();
  const magicId = params.magicId as string;
  const [mode, setMode] = useState<"loading" | "mongo" | "unavailable">("loading");
  const [probeStatus, setProbeStatus] = useState<number | undefined>();
  const [probeError, setProbeError] = useState<string | undefined>();

  useEffect(() => {
    if (RESERVED_SLUGS.has(magicId.toLowerCase())) {
      router.replace("/acceso");
    }
  }, [magicId, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(apiUrl(`/api/magic/${encodeURIComponent(magicId)}`));
        if (cancelled) return;
        if (r.ok) {
          setMode("mongo");
          return;
        }
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        setProbeStatus(r.status);
        setProbeError(j.error);
        setMode("unavailable");
      } catch {
        if (!cancelled) setMode("unavailable");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [magicId]);

  if (mode === "loading") {
    return <PortalMagicSkeleton />;
  }

  if (mode === "mongo") {
    return <MongoMagicPortal token={magicId} />;
  }

  return <MagicPortalUnavailable status={probeStatus} errorMessage={probeError} />;
}
