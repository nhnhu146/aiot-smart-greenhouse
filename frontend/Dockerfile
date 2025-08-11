# Use Node.js 20 Alpine with reliable registry settings
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock* ./

# Install dependencies with retry and timeout
RUN if [ -f yarn.lock ]; then \
	yarn config set registry https://registry.npmjs.org/ && \
	yarn install --network-timeout 300000 --network-concurrency 1; \
	else \
	echo "Using yarn as default..." && \
	yarn install --network-timeout 300000 --network-concurrency 1 --registry https://registry.npmjs.org/; \
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
	echo "Using yarn for build..." && \
	yarn build; \
	fi

# Install serve to serve the static files
RUN yarn global add serve@latest --registry https://registry.npmjs.org/

# Create log directory for error logging
RUN mkdir -p /app/logs

# Expose port
EXPOSE 3000

# Start the application with proper error logging and output redirection
CMD ["sh", "-c", "serve -s dist -l 3000 2>&1 | tee /app/logs/frontend.log; echo 'Frontend container started' >> /app/logs/frontend.log"]
