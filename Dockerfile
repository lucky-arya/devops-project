# =============================================================================
# Stage 1: Base — shared package install layer
# =============================================================================
FROM node:22-alpine AS deps

WORKDIR /app

# Copy package manifests first for better layer caching
COPY package.json package-lock.json ./

# Install ALL dependencies (dev + prod) needed in development
RUN npm ci

# =============================================================================
# Stage 2: Install production-only dependencies
# =============================================================================
FROM node:22-alpine AS deps-prod

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

# =============================================================================
# Stage 3: Development — hot reload via node --watch
# =============================================================================
FROM node:22-alpine AS development

ENV NODE_ENV=development

WORKDIR /app

# Copy all deps (including devDependencies) from deps stage
COPY --from=deps /app/node_modules ./node_modules

COPY package.json package-lock.json ./
COPY src/ ./src/
COPY drizzle.config.js ./
COPY drizzle/ ./drizzle/

EXPOSE 3000

# Hot reload using node's built-in watch mode
CMD ["node", "--watch", "src/index.js"]

# =============================================================================
# Stage 4: Production
# =============================================================================
FROM node:22-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy production-only node_modules from deps-prod stage
COPY --from=deps-prod /app/node_modules ./node_modules

# Copy application source
COPY package.json package-lock.json ./
COPY src/ ./src/
COPY drizzle.config.js ./

# Drizzle migration output directory (needed if migrations run at startup)
COPY drizzle/ ./drizzle/

# Set ownership to the non-root user
RUN chown -R appuser:nodejs /app

USER appuser

EXPOSE 3000

# Health check — polls /health every 30s
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/index.js"]
