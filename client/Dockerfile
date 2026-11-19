
# Stage 1 - Build React Application

FROM node:22-alpine AS builder

LABEL maintainer="Mayuresh Kasar"
LABEL description="Portfolio App - React + Vite Frontend"

WORKDIR /app

# Install dependencies (better layer caching)
COPY package*.json ./

RUN if [ -f package-lock.json ]; then \
      npm ci; \
    else \
      npm install; \
    fi

# Copy application source
COPY . .

ENV NODE_ENV=production

# Build production bundle
RUN npm run build


# Stage 2 - Nginx Production Server

# The unprivileged image listens on 8080 and runs as UID 101. It keeps the
# same nginx configuration surface but cannot bind privileged ports or write
# outside its tmp paths.
FROM nginxinc/nginx-unprivileged:stable-alpine

# The image runs as UID 101 by default. Package installation needs root for
# this single layer only; the final image drops back to 101 below.
USER root

# Apply Alpine security updates, install timezone data, and clear default
# nginx files in a single layer. Upgrading in the image keeps the fixed OS
# packages ahead of the base image's release cadence (Trivy scans the result).
# The base image pins nginx, so request the patched package explicitly;
# this fails the build rather than silently shipping the vulnerable version.
# hadolint ignore=DL3018
RUN apk upgrade --no-cache \
    && apk add --no-cache "nginx>=1.30.7-r0" tzdata \
    && rm -rf /usr/share/nginx/html/*

# Copy production build and configuration as the runtime user.
COPY --chown=101:101 --from=builder /app/dist /usr/share/nginx/html
COPY --chown=101:101 nginx.conf /etc/nginx/conf.d/default.conf

USER 101

EXPOSE 8080

STOPSIGNAL SIGQUIT

CMD ["nginx", "-g", "daemon off;"]
