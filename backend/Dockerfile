# ===== Builder =====
FROM node:20-alpine AS builder
WORKDIR /app

# Dependências
COPY package*.json ./
RUN npm ci

# Cópias necessárias para build
COPY nest-cli.json ./
COPY tsconfig*.json ./
COPY prisma ./prisma
COPY src ./src

# Gerar Prisma Client e build do Nest
RUN npx prisma generate
RUN npm run build


# ===== Runner =====
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Instalar netcat para wait-for-postgres.sh
RUN apk add --no-cache netcat-openbsd

COPY package*.json ./
# Copiar node_modules do builder para evitar reinstalação
COPY --from=builder /app/node_modules ./node_modules
# Copiar schema do Prisma e artefatos buildados
COPY prisma ./prisma
COPY --from=builder /app/dist ./dist
# Copiar script de espera
COPY wait-for-postgres.sh /wait-for-postgres.sh
RUN chmod +x /wait-for-postgres.sh

# Remover devDependencies do node_modules para reduzir imagem
RUN npm prune --omit=dev || true

EXPOSE 3000

# Rodar migrations e iniciar a API (aguardar postgres estar pronto)
CMD sh -c "/wait-for-postgres.sh postgres 5432 && npx prisma migrate deploy && node dist/src/main.js"


