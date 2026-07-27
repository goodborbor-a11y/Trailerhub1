# ===========================================
# Multi-stage Dockerfile for Movie Trailers App
# ===========================================

# Stage 1: Build the frontend
FROM node:24.18.0-alpine@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Set build-time environment variables
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the frontend
RUN npm run build

# Stage 2: Build the backend
FROM node:24.18.0-alpine@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd AS backend-builder

WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./
COPY server/tsconfig.json ./

# Install all dependencies (including dev dependencies for TypeScript)
RUN npm ci

# Copy server source
COPY server/src ./src

# Build TypeScript
RUN npm run build

# Stage 3: Production image
FROM node:24.18.0-alpine@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd AS production

WORKDIR /app

# Install PID 1 signal handling and a minimal privilege-drop helper.
RUN apk add --no-cache dumb-init su-exec

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built frontend
COPY --from=frontend-builder /app/dist ./dist

# Install backend runtime dependencies from the lockfile. Development tools stay
# in the builder stage and are never copied into the production image.
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev && npm cache clean --force

# Copy compiled backend output and runtime data.
COPY --from=backend-builder /app/server/dist ./server/dist
COPY server/data ./server/data

# This script contains no secret. It validates and stages the read-only host
# credential into ephemeral tmpfs before permanently dropping privileges.
COPY scripts/dead-city-entrypoint.sh /usr/local/bin/dead-city-entrypoint
RUN chown root:root /usr/local/bin/dead-city-entrypoint && \
    chmod 0755 /usr/local/bin/dead-city-entrypoint

# Create uploads directory
RUN mkdir -p /var/www/uploads && chown nodejs:nodejs /var/www/uploads

# Set ownership
RUN chown -R nodejs:nodejs /app

EXPOSE 3001

# The entrypoint starts as root only to stage the credential, then execs
# dumb-init and Node as UID/GID 1001.
ENTRYPOINT ["/usr/local/bin/dead-city-entrypoint"]
CMD ["node", "server/dist/index.js"]
