# Stage 1: Build React frontend
FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY package*.json ./

# Build arguments for environment variables
ARG VITE_API_MODE=nodejs
ARG VITE_API_URL=/api

RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.prod.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
