# Use Node.js 20 alpine image as base
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js based on the preferred package manager
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Set port for Cloud Run
ENV PORT 8080

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Note: For production with Prisma, you should use a managed database (like Cloud SQL or Supabase).
# SQLite will not persist data across container restarts in Cloud Run.
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dev.db ./dev.db 

USER nextjs

EXPOSE 8080

ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
