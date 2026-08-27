# PathWay (`pathwaysaas`)

Front **Next.js** (UI, portal Magic Link, panel `/dashboard` contra tu API). La raíz `/` redirige a `/pathway`.

- **API REST y MongoDB** van en el **servidor Express** (otro repo o carpeta). Este front **no** conecta a Mongo: habla con el API por **`/api/*`**.
- **Proxy `/api` → Express:** en `next dev`, Next **reenvía por defecto** `/api/*` a `http://localhost:3000/api/*` (igual que `pathway-nextjs-rewrite.example.mjs` en este repo). El navegador sigue viendo `http://localhost:5500/api/...`; la cookie `pw_session` queda en el origen del front. Opcional: `API_PROXY_TARGET` en `.env.local` si tu API no está en el puerto 3000 (reinicia `npm run dev` tras cambiarlo). En **producción** hay que definir `API_PROXY_TARGET` si el API no va en el mismo host que Next.
- **`JWT_SECRET`:** el **mismo valor** (copiar y pegar) en Express y en `.env.local` de Next. Si no coinciden, el login puede responder 200 pero **no entrarás** en `/dashboard` (el middleware rechaza la cookie). No dejes textos tipo «PON_AQUI…» en `.env.local`.
- Si tras login o registro vuelves a `/sign-in`, suele ser la cookie `pw_session` que no llega por el proxy: en Express puedes devolver en el JSON **`{ "token": "<jwt>" }`** (el mismo JWT que iría en la cookie); el front lo copia a `pw_session` en el navegador.
- Crea `.env.local` copiando **`.env.example`** (los `.env*` no están en Git).

## Desarrollo

```bash
npm install
npm run dev
```

Por defecto el front usa el puerto **5500** (`package.json`). Arranca también el **Express** con Mongo y la misma `JWT_SECRET` si usas login Mongo + `/dashboard`.

**Parches backend** (caducidad magic link + documentos por defecto): carpeta [`pathway-express-patches/`](../pathway-express-patches/README.md) en la raíz del workspace.

## Build

```bash
npm run build
npm start
```

## Checklist flujo completo (local)

Con Express en `:3000` y front en `:5500`:

```bash
bash scripts/smoke-flow.sh
```

Pasos manuales:

1. Registro/login agencia → `/dashboard`
2. Crear expediente → 3 documentos + `magicExpiresAt`
3. Copiar enlace → portal en ventana privada
4. Subir pasaporte, domicilio y foto → `progress` sube
5. Despacho → pestaña **Documentos**: aprobar/rechazar cada slot (mensaje al cliente)
6. Despacho → pestaña **Revisión**: aprobar o rechazar expediente completo
7. Cliente ve mensajes en portal; si aprobado → PDF en revisión y portal (`finalPdfUrl`)

**API revisión por documento:** `PATCH /api/cases/:caseId/documents/:docId/review` — el front ya lo llama.

**Nivel 1 (ingesta/extracción):** contrato `ExtractedData` en `lib/api/extractedData.ts`; validación pre-upload en portal; parches backend en `pathway-express-patches/lib/documentIngestionService.js`.

**Nivel 2 (Case Engine + EX-10):** `caseType` en expediente (`MVP-3` | `EX-10`); EX-10 crea 6 slots (pasaporte, domicilio, foto, tasa 790, empadronamiento, antecedentes); checklist automático en ficha; selector de trámite al crear; bloqueo de aprobación si faltan docs.

## Despliegue (staging / producción)

| Componente | Variables clave |
|------------|-----------------|
| **Express** | `MONGODB_URI`, `JWT_SECRET`, `PUBLIC_APP_ORIGIN`, `MAGIC_LINK_TTL_DAYS`, Resend (`RESEND_API_KEY`, dominio verificado) |
| **Next.js** | `API_PROXY_TARGET` (URL interna del API), **mismo** `JWT_SECRET` |
| **Email reset** | Backend debe enlazar a `{PUBLIC_APP_ORIGIN}/reset-password?token=...` |

Orden recomendado: Mongo → Express → build Next → proxy `/api/*` → dominio + HTTPS → verificar Resend.

Rutas auth front: `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password?token=`.
