# SIMRS ZEN - Node.js API Dockerfile

FROM node:20-bookworm-slim

WORKDIR /app

# deps + openssl untuk Prisma
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .

# generate prisma client
RUN npx prisma generate

EXPOSE 3000
CMD ["sh", "entrypoint.sh"]
