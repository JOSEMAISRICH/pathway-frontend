import { NextRequest, NextResponse } from "next/server";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "te",
  "trailer",
  "upgrade",
  "proxy-authorization",
  "proxy-authenticate",
]);

export function resolveApiProxyTarget(): string | null {
  const raw = process.env.API_PROXY_TARGET?.trim().replace(/\/$/, "");
  return raw || null;
}

/**
 * Reenvía /api/* al Express en runtime (Docker/DonWeb).
 * next.config rewrites solo aplican si API_PROXY_TARGET existía en `next build`;
 * este handler evita rebuild al cambiar la URL del backend.
 */
export async function proxyToBackend(req: NextRequest, pathSegments: string[]): Promise<NextResponse> {
  const target = resolveApiProxyTarget();
  if (!target) {
    return NextResponse.json(
      {
        error:
          "API no configurada en el front. Define API_PROXY_TARGET (ej. http://IP:3000 o http://pathway-api:3000).",
      },
      { status: 503 },
    );
  }

  const path = pathSegments.filter(Boolean).join("/");
  const url = `${target}/api/${path}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower) || lower === "host") return;
    headers.set(key, value);
  });

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const body = await req.arrayBuffer();
    if (body.byteLength > 0) init.body = body;
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, init);
  } catch {
    return NextResponse.json(
      { error: "No se pudo conectar con el backend. Comprueba que la API esté en marcha y API_PROXY_TARGET." },
      { status: 502 },
    );
  }

  const resHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    resHeaders.set(key, value);
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: resHeaders,
  });
}
