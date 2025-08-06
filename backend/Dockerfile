# Use Node.js 20 Alpine - Prioritized for Yarn
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies with retry
RUN apk add --no-cache \
	curl \
	dumb-init \
	&& rm -rf /var/cache/apk/*

# Copy package files - Only yarn.lock needed
COPY package.json yarn.lock* ./

# Install dependencies with Yarn (prioritized)
RUN \
	if [ -f yarn.lock ]; then \
	echo "📦 Installing with yarn (yarn.lock found)..." && \
	yarn config set registry https://registry.npmjs.org/ && \
	yarn install --frozen-lockfile --network-timeout 300000 --network-concurrency 1; \
	else \
	echo "📦 No yarn.lock found, using yarn anyway..." && \
	yarn config set registry https://registry.npmjs.org/ && \
	yarn install --network-timeout 300000 --network-concurrency 1; \
	fi

# Development stage
FROM base AS dev
COPY . .
EXPOSE 5000
CMD ["yarn", "dev"]

# Build stage
FROM base AS builder
COPY . .
# Install dependencies - Prioritize yarn over npm/pnpm
RUN echo "🔨 Building backend..." && yarn build

# Production stage - Use reliable base image
FROM node:20-alpine AS production

# Update package index and install dumb-init for proper signal handling
RUN apk update && apk add --no-cache \
	curl \
	dumb-init \
	&& rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

# Create logs directory
RUN mkdir -p /app/logs && chown nodejs:nodejs /app/logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
	CMD curl -f http://localhost:5000/api/health || exit 1

# Start application with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
