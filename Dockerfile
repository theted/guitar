# --- Build stage ---
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source
COPY . .

# Build CSS from Stylus and then the app
RUN yarn styles && yarn build

# --- Runtime stage ---
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port and run nginx
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
