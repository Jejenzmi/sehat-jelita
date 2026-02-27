# Use the official Node.js image as the base image for the builder stage
FROM node:20-bookworm-slim AS builder

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Build the application
RUN npm run build


# Use the official Node.js image as the base image for the production stage
FROM node:20-bookworm-slim AS production

# Install openssl
RUN apt-get update && apt-get install -y openssl && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy only the build artifacts from the builder stage
COPY --from=builder /app/dist ./dist

# Install production dependencies
COPY package*.json ./
RUN npm install --only=production

# Command to run the application
CMD [ "node", "dist/index.js" ]
