# Use Node.js 20 Alpine with reliable registry settings
FROM node:20-alpine

WORKDIR /app

# Configure npm with reliable settings
RUN npm config set registry https://registry.npmjs.org/ && \
	npm config set fetch-retry-mintimeout 20000 && \
	npm config set fetch-retry-maxtimeout 120000 && \
	npm config set fetch-retries 3

# Copy package files
COPY package.json yarn.lock* ./

# Install dependencies with retry and timeout
RUN if [ -f yarn.lock ]; then \
	yarn config set registry https://registry.npmjs.org/ && \
	yarn install --frozen-lockfile --network-timeout 300000 --network-concurrency 1; \
	else \
	npm install --registry https://registry.npmjs.org/; \
	fi

# Copy source code
COPY . .

# Set build-time environment variables
ARG VITE_API_URL=http://localhost:5000
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN if [ -f yarn.lock ]; then \
	yarn build; \
	else \
	npm run build; \
	fi

# Install serve to serve the static files
RUN npm install -g serve@latest --registry https://registry.npmjs.org/

# Expose port
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "dist", "-l", "3000"]
