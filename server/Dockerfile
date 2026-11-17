
# Portfolio Backend - Production Dockerfile


FROM node:26-alpine

# Image metadata
LABEL maintainer="Mayuresh Kasar"
LABEL description="Portfolio Backend API - Node.js + Express.js"

# Create application directory
WORKDIR /app

# Copy package files first for better Docker cache
COPY package*.json ./

# Install production dependencies. The npm cache is cleared in the same layer so
# it does not bloat the image; stderr is silenced only to hide npm's harmless
# "using --force" warning.
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev; \
    else \
      npm install --omit=dev; \
    fi && \
    npm cache clean --force 2>/dev/null

# Production environment
ENV NODE_ENV=production
ENV npm_config_update_notifier=false

# Apply Alpine security updates and drop npm from the runtime image. The app
# starts with `node server.js`, so npm/npx are not needed after the build and
# removing them also removes npm's bundled dependencies from the attack
# surface (and from Trivy image scans).
RUN apk upgrade --no-cache && \
    rm -rf /usr/local/lib/node_modules \
           /usr/local/bin/npm \
           /usr/local/bin/npx \
           /usr/local/bin/corepack

# Create non-root user with explicit ids so the numeric USER below always
# resolves, no matter how the host maps uids.
RUN addgroup -S -g 1001 nodegroup && \
    adduser -S -u 1001 -G nodegroup nodeuser

# Copy application source as the runtime user; no recursive chown is needed.
COPY --chown=1001:1001 . .

USER 1001:1001

# Expose backend port
EXPOSE 5000

STOPSIGNAL SIGTERM

# Health check in exec form so the container runtime receives wget's exit code
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1:5000/api/health"]

# Start server
CMD ["node", "server.js"]
