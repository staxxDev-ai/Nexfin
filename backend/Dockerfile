# Estágio 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências (incluindo devDependencies para o build)
RUN npm install

# Copiar o restante do código
COPY . .

# Gerar o Prisma Client (necessário para o build do NestJS)
RUN npx prisma generate

# Build da aplicação
RUN npm run build

# Estágio 2: Runner
FROM node:20-alpine AS runner

WORKDIR /app

# Variáveis de ambiente padrão
ENV NODE_ENV=production

# Copiar apenas o necessário do estágio de build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Expor a porta (Railway injeta PORT automaticamente, mas Nest usa 3001 por padrão)
EXPOSE 3001

# Comando para rodar a aplicação
CMD ["npm", "run", "start:prod"]
