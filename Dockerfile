
# Stage 1: Builder
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Environment variables for the builder stage
ENV NODE_ENV=production

# Install dependencies
# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./
RUN npm install --production=false # Install all dependencies including devDependencies for build

# Copy the rest of the application code
COPY . .

# Build the Next.js application
# The `standalone` output mode will create a .next/standalone directory
RUN npm run build


# Stage 2: Runner
FROM node:20-alpine AS runner

WORKDIR /app

# Environment variables for the runner stage
ENV NODE_ENV=production
# Set the port the app will run on (Next.js default, adjust if your app uses a different one internally)
ENV PORT=3000
# Set HOSTNAME to localhost, so it listens on all interfaces inside the container
ENV HOSTNAME=0.0.0.0

# Create a non-root user and group for security
# The nodejs group should exist. If not, create it first.
# Alpine's node images usually provide a 'node' user/group. Let's create our own for clarity.
RUN addgroup -S nodejs && adduser -S --uid 1001 -G nodejs nextjs

# Copy the standalone output from the builder stage.
# This includes server.js, node_modules, .next/server, .next/static,
# and the public directory (if one was part of the build output).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Set user
USER nextjs

# Expose the port the application runs on
EXPOSE 3000

# Command to run the application
# server.js is the entry point for standalone Next.js apps
CMD ["node", "server.js"]
