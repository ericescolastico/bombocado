# ===== Builder =====
FROM node:20-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV npm_config_legacy_peer_deps=true

COPY package*.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

COPY . .

# Build do Next (scripts/sync-env.mjs roda no prebuild)
RUN npm run build


# ===== Runner =====
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV npm_config_legacy_peer_deps=true

COPY package*.json ./
# Reutiliza node_modules do builder para evitar reinstalação
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.* ./

EXPOSE 3001
CMD ["npm", "run", "start"]


