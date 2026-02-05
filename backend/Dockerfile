# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and config files needed for build (from monorepo root context)
COPY backend/package*.json ./
COPY backend/tsconfig*.json ./
COPY backend/nest-cli.json ./
COPY backend/prisma.config.ts ./
COPY backend/prisma ./prisma/

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY backend/src ./src

# Build the application
RUN npm run build

# Verify build output exists
RUN ls -la /app/dist && ls -la /app/dist/src/main.js || echo "Build verification failed"

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install network tools for debugging (optional, can be removed in production)
RUN apk add --no-cache curl postgresql-client

# Install only production dependencies
COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy Prisma schema, config and generated client
COPY --from=builder /app/prisma ./prisma
COPY backend/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy built application
COPY --from=builder /app/dist ./dist

# Verify dist was copied correctly
RUN ls -la /app/dist || (echo "dist directory not found in production stage" && exit 1)
RUN test -f /app/dist/src/main.js || (echo "main.js not found!" && ls -la /app/dist/ && exit 1)

# Copy translation files (needed at runtime)
COPY --from=builder /app/src/i18n/translations ./src/i18n/translations

# Set default port for production (port 80)
ENV PORT=80

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Change ownership of app directory
RUN chown -R nestjs:nodejs /app

# Expose port 80
EXPOSE 80

# Note: Running as root to bind to port 80
USER root

# Run database migrations and start the application
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]