# Estágio 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências (usando o caminho relativo à raiz do repo)
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Instalar dependências
RUN npm install

# Copiar o restante do código do backend
COPY backend/ .

# Gerar o Prisma Client
RUN npx prisma generate

# Build da aplicação
RUN npm run build

# Estágio 2: Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copiar o necessário do estágio de build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Expor a porta 3001
EXPOSE 3001

# Comando para rodar a aplicação
CMD ["npm", "run", "start:prod"]
