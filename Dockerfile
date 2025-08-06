# Use the official Node.js runtime as the base image
FROM node:22-alpine

# Set the working directory in the container
WORKDIR /app

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite

# Copy package files first for better caching
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev for build)
RUN npm ci

# Switch to SQL Server schema for production if it exists
RUN if [ -f "prisma/schema.sqlserver.prisma" ]; then \
      cp prisma/schema.sqlserver.prisma prisma/schema.prisma; \
    fi

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose the port the app runs on
EXPOSE 5001

# Set environment to production
ENV NODE_ENV=production
ENV PORT=5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5001/api/health || exit 1

# Command to run the application
CMD ["node", "server.js"]