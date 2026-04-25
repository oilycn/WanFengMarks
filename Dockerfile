# Use the "builder" stage based on the Node.js 20 Alpine image
FROM docker.io/library/node:20-alpine AS builder

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json/yarn.lock
COPY package*.json ./

# Install dependencies
RUN npm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Ensure both lowercase and uppercase default icon paths exist in Linux container.
# Some existing data or clients may still request /mark.PNG.
RUN if [ -f /app/public/mark.png ]; then cp /app/public/mark.png /app/public/mark.PNG; fi

# Set the NEXT_TS_CONFIG_PATH environment variable to tell Next.js where to find the tsconfig.json
ENV NEXT_TS_CONFIG_PATH=/app/tsconfig.json

# Build the Next.js application
# The `standalone` output mode will create a .next/standalone directory
RUN npm run build

# Use a smaller image for the runner stage
FROM docker.io/library/node:20-alpine AS runner

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=3000

# Set the working directory
WORKDIR /app

# Create a non-root user
RUN addgroup -S --gid 1001 nodejs
RUN adduser -S --uid 1001 nextjs
USER nextjs

# Copy the built Next.js application from the builder stage
# Including the standalone output and node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copy public assets (e.g. /mark.png) so runtime can serve them.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public


# Expose the port the application runs on
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
