# Tahap 1: Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Install pnpm dan dependencies
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Tahap 2: Build Next.js
FROM node:18-alpine AS builder
WORKDIR /app

# Install pnpm di builder
RUN npm install -g pnpm

# Salin dependency dari tahap deps
COPY --from=deps /app/node_modules ./node_modules
COPY . ./

# Build Next.js app
RUN pnpm build

# Tahap 3: Jalankan hasil build
FROM node:18-alpine AS runner
WORKDIR /app

# Set environment
ENV NODE_ENV=production

# ✅ Install pnpm di runner agar bisa menjalankan aplikasi
RUN npm install -g pnpm

# Salin hasil build dari builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Buka port 3000 (atau sesuaikan jika perlu)
EXPOSE 3010
# Jalankan aplikasi
CMD ["pnpm", "start"]

