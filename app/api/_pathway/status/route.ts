import { NextResponse } from "next/server";
import { resolveApiProxyTarget } from "@/lib/api/proxyToBackend";

/** GET /api/_pathway/status — diagnóstico DonWeb/Docker (¿llega al Express?). */
export async function GET() {
  const target = resolveApiProxyTarget();
  if (!target) {
    return NextResponse.json({
      ok: false,
      front: true,
      apiProxyTarget: null,
      backend: null,
      hint: "Falta API_PROXY_TARGET en el contenedor del front (ej. http://api:3000).",
    });
  }

  try {
    const r = await fetch(`${target}/health`, { cache: "no-store" });
    const body = await r.json().catch(() => null);
    return NextResponse.json({
      ok: r.ok,
      front: true,
      apiProxyTarget: target,
      backend: { status: r.status, body },
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      front: true,
      apiProxyTarget: target,
      backend: null,
      hint: "No se pudo conectar al backend. ¿Está pathway-api en marcha?",
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
