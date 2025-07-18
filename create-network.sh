#!/bin/bash
# Script to create the required external network for testing

echo "🌐 Creating external network: multi-domain"

# Check if network already exists
if docker network ls | grep -q "multi-domain"; then
    echo "✅ Network 'multi-domain' already exists"
else
    # Create the external network
    docker network create multi-domain
    echo "✅ Network 'multi-domain' created successfully"
fi

echo "🔍 Network information:"
docker network inspect multi-domain --format='{{.Name}}: {{.Driver}} ({{.Scope}})'

echo ""
echo "🚀 Network is ready for Docker Compose deployment"
echo "Run: docker compose up -d --build"
