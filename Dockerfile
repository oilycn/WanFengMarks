# Dockerfile for 晚风Marks Next.js Application

# ---- Builder Stage ----
# Use a Node.js LTS version on Alpine Linux for a smaller base image
FROM node:20-alpine AS builder
WORKDIR /app

# Set environment variables for the build stage
ENV NODE_ENV build

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies using npm ci for faster, more reliable builds
# This installs all dependencies, including devDependencies needed for the build
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Build the Next.js application
# This will also generate the standalone output in .next/standalone
# because we will configure output: 'standalone' in next.config.ts
RUN npm run build

# ---- Runner Stage ----
# Use a fresh Node.js Alpine image for the final, smaller image
FROM node:20-alpine AS runner
WORKDIR /app

# Set environment variables for the production runtime
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
# The Next.js app inside Docker will run on port 3000 by default
# You can override this with -e PORT=xxxx when running the container
ENV PORT 3000

# Create a non-root user and group for better security
# UID/GID 1001 are common for non-root users in Docker images
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output from the builder stage
# This includes the server.js, minimal node_modules, etc.
# The chown command ensures the files are owned by the non-root user
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy the public folder from the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy the static assets from .next/static (needed for client-side JS, CSS, images)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to the non-root user
USER nextjs

# Expose the port the app will run on
EXPOSE 3000

# Command to run the Next.js server in standalone mode
CMD ["node", "server.js"]
