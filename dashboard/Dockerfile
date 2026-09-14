# ==============================================================================
# AEGIS Frontend Dockerfile (Multi-Stage Build)
# Stage 1: Build React SPA bundle with Node 20
# Stage 2: Serve optimized assets with Nginx Alpine
# ==============================================================================

# Stage 1: Build environment
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies using cached layers
COPY package*.json ./
RUN npm ci

# Copy source assets and build production bundle
COPY . .
RUN npm run build

# Stage 2: Production runtime environment
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
