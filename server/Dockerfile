
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

# Create non-root user
RUN addgroup -S nodegroup && \
    adduser -S nodeuser -G nodegroup && \
    chown -R nodeuser:nodegroup /app

USER nodeuser

# Expose backend port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5000/api/health || exit 1

# Start server
CMD ["node", "server.js"]
