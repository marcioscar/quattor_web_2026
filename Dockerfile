# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json* ./
# Schema antes do npm ci: o postinstall roda `prisma generate`
COPY prisma ./prisma

# Instalar dependências (incluindo devDependencies para o build)
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar arquivos de dependências
COPY package.json package-lock.json* ./
# Schema antes do npm ci: o postinstall roda `prisma generate`
COPY prisma ./prisma

# Instalar apenas dependências de produção
RUN npm ci --omit=dev && npm cache clean --force

# Copiar build do estágio anterior
COPY --from=builder /app/build ./build

# Alterar ownership dos arquivos
RUN chown -R nodejs:nodejs /app

USER nodejs

# Porta padrão do react-router-serve
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

CMD ["npx", "react-router-serve", "./build/server/index.js"]
