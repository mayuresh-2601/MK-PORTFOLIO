
# Portfolio Backend - Production Dockerfile


FROM node:22-alpine

# Image metadata
LABEL maintainer="Mayuresh Kasar"
LABEL description="Portfolio Backend API - Node.js + Express.js"

# Create application directory
WORKDIR /app

# Copy package files first for better Docker cache
COPY package*.json ./

# Install production dependencies
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev; \
    else \
      npm install --omit=dev; \
    fi && \
    npm cache clean --force

# Copy application source
COPY . .

# Production environment
ENV NODE_ENV=production

# Create non-root user with explicit ids so the numeric USER below always
# resolves, no matter how the host maps uids.
RUN addgroup -S -g 1001 nodegroup && \
    adduser -S -u 1001 -G nodegroup nodeuser && \
    chown -R nodeuser:nodegroup /app

USER 1001:1001

# Expose backend port
EXPOSE 5000

# Health check in exec form so the container runtime receives wget's exit code
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1:5000/api/health"]

# Start server
CMD ["node", "server.js"]
