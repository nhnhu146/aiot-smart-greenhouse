#!/bin/bash

# Data Merger Script for Docker Container
# This script runs data merge operation inside the Docker container

echo "🔄 Starting data merge operation in Docker container..."

# Check if container is running
CONTAINER_NAME="aiot-greenhouse-backend"

if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    echo "✅ Container $CONTAINER_NAME is running"
    
    # Execute data merge command inside container
    echo "🔄 Running data merge..."
    docker exec $CONTAINER_NAME npm run data:merge:build
    
    echo "✅ Data merge completed!"
else
    echo "❌ Container $CONTAINER_NAME is not running"
    echo "💡 Please start the container first using: docker-compose up -d"
    exit 1
fi
