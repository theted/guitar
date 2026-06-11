# --- Build stage ---
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

RUN npm run build

# --- Runtime stage ---
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port and run nginx
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
