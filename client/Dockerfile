
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

FROM nginx:stable-alpine

# Install timezone data and clear default nginx files in a single layer.
# hadolint ignore=DL3018
RUN apk add --no-cache tzdata \
    && rm -rf /usr/share/nginx/html/*

# Copy production build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
