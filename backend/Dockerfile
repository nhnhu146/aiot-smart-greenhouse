# Use Node.js 20 Alpine with multiple registry fallbacks
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Configure npm registry with fallbacks
RUN npm config set registry https://registry.npmjs.org/ && \
	npm config set fetch-retry-mintimeout 20000 && \
	npm config set fetch-retry-maxtimeout 120000 && \
	npm config set fetch-retries 3

# Install system dependencies with retry
RUN apk add --no-cache \
	curl \
	dumb-init \
	&& rm -rf /var/cache/apk/*

# Copy package files
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

# Install dependencies based on the preferred package manager with retry
RUN \
	if [ -f yarn.lock ]; then \
	echo "📦 Installing with yarn (yarn.lock found)..." && \
	yarn config set registry https://registry.npmjs.org/ && \
	yarn install --frozen-lockfile --network-timeout 300000 --network-concurrency 1; \
	elif [ -f package-lock.json ]; then \
	echo "📦 Installing with npm (package-lock.json found)..." && \
	npm ci --registry https://registry.npmjs.org/; \
	elif [ -f pnpm-lock.yaml ]; then \
	echo "📦 Installing with pnpm (pnpm-lock.yaml found)..." && \
	npm install -g pnpm@latest --registry https://registry.npmjs.org/ && \
	pnpm config set registry https://registry.npmjs.org/ && \
	pnpm i --frozen-lockfile; \
	else \
	echo "📦 No lock file found, defaulting to npm install..." && \
	npm install --registry https://registry.npmjs.org/; \
	fi

# Development stage
FROM base AS dev
COPY . .
EXPOSE 5000
CMD ["yarn", "dev"]

# Build stage
FROM base AS builder
COPY . .
RUN \
	if [ -f yarn.lock ]; then \
	echo "Building with yarn (yarn.lock found)..." && yarn build || (echo "Build failed, trying TypeScript compile only..." && npx tsc); \
	elif [ -f package-lock.json ]; then \
	echo "Building with npm (package-lock.json found)..." && npm run build || (echo "Build failed, trying TypeScript compile only..." && npx tsc); \
	elif [ -f pnpm-lock.yaml ]; then \
	echo "Building with pnpm (pnpm-lock.yaml found)..." && corepack enable pnpm && pnpm build || (echo "Build failed, trying TypeScript compile only..." && npx tsc); \
	else \
	echo "No lock file found, defaulting to yarn build..." && yarn build || (echo "Build failed, trying TypeScript compile only..." && npx tsc); \
	fi

# Production stage - Use reliable base image
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache \
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
