# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:18-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Build the app ────────────────────────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# BACKEND_URL used by next.config.js rewrites (server-to-server in Docker)
ARG BACKEND_URL=http://backend:8000
ENV BACKEND_URL=$BACKEND_URL

RUN npm run build

# ── Stage 3: Production runner ────────────────────────────────────────────────
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy only what's needed to run
COPY --from=builder --chown=nextjs:nodejs /app/.next      ./.next
COPY --from=builder                       /app/node_modules ./node_modules
COPY --from=builder                       /app/package.json ./package.json

# Copy public assets if they exist
COPY --from=builder /app/public ./public 2>/dev/null || true

USER nextjs
EXPOSE 3000

CMD ["npm", "run", "start"]
