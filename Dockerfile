# =============================================================================
# Stage 1: Install production dependencies only
# =============================================================================
FROM node:22-alpine AS deps

WORKDIR /app

# Copy package manifests first for better layer caching
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# =============================================================================
# Stage 2: Build the final runtime image
# =============================================================================
FROM node:22-alpine AS runner

# Accept NODE_ENV as a build argument (defaults to production)
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy production node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules

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
