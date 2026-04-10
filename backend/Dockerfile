# Estágio 1: Build
FROM node:20-alpine AS builder

# Instalar dependências necessárias para o Prisma em Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Copiar arquivos de dependências
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Instalar dependências
RUN npm install

# Copiar o restante do código do backend
COPY backend/ .

# Gerar o Prisma Client (específico para Alpine)
RUN npx prisma generate

# Build da aplicação
RUN npm run build

# Estágio 2: Runner
FROM node:20-alpine AS runner

# Instalar certificados CA e OpenSSL (ESSENCIAL para Neon/PostgreSQL SSL)
RUN apk add --no-cache ca-certificates openssl libgcc libstdc++

WORKDIR /app

ENV NODE_ENV=production

# Copiar o necessário do estágio de build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Railway injeta a porta automaticamente
EXPOSE 3001

# Comando para rodar a aplicação
CMD ["npm", "run", "start:prod"]
