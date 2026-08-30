# PathWay Front (pathwaysaas) — Next.js 16 / React 19
# Alineado con el entorno local y el backend: Node v22.18.0 / npm 11.x
#
# Build:
#   docker build -t pathway-web .
# Run (API en el host o en otra red Docker):
#   docker run --rm -p 5500:5500 \
#     -e JWT_SECRET=mismo-que-express \
#     -e API_PROXY_TARGET=http://TU_IP:3000 \
#     pathway-web
# En DonWeb/VPS: API_PROXY_TARGET debe ser la URL interna del backend (IP:3000 o nombre del servicio Docker).

# ---- deps ----
FROM node:22.18.0-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
# Incluye devDependencies (typescript, tailwind, eslint-config-next) necesarias para `next build`
RUN npm ci && npm cache clean --force

# ---- build ----
FROM node:22.18.0-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Vars de build opcionales (NEXT_PUBLIC_* se inlinan en el bundle si las pasas con --build-arg)
ARG NEXT_PUBLIC_API_BASE_URL=
ARG NEXT_PUBLIC_FORCE_DIRECT_API=
ARG NEXT_PUBLIC_SEND_VERIFICATION_EMAIL=
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_FORCE_DIRECT_API=$NEXT_PUBLIC_FORCE_DIRECT_API
ENV NEXT_PUBLIC_SEND_VERIFICATION_EMAIL=$NEXT_PUBLIC_SEND_VERIFICATION_EMAIL
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

RUN npm run build

# ---- runner ----
FROM node:22.18.0-alpine AS runner
WORKDIR /app

RUN apk add --no-cache curl \
  && addgroup -S pathway && adduser -S pathway -G pathway

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=5500
ENV HOSTNAME=0.0.0.0

# Runtime (mismo JWT que Express; proxy /api → backend)
# JWT_SECRET=
# API_PROXY_TARGET=http://api:3000

COPY --from=builder /app/public ./public
COPY --from=builder --chown=pathway:pathway /app/.next/standalone ./
COPY --from=builder --chown=pathway:pathway /app/.next/static ./.next/static

USER pathway

EXPOSE 5500

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1:5500/pathway || exit 1

CMD ["node", "server.js"]
