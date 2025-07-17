#!/bin/bash

echo "🧹 AIoT Smart Greenhouse - Clean Docker Test"
echo "=================================================="

# Step 1: Stop all containers and clean images
echo "🔄 Stopping containers and cleaning images..."
docker compose down --rmi all
docker system prune -f

# Step 2: Build and start services  
echo "🔨 Building and starting services..."
docker compose up -d --build

# Step 3: Wait for services to initialize
echo "⏳ Waiting for services to start..."
sleep 30

# Step 4: Check service status
echo "🏥 Checking service health..."
docker compose ps

echo ""
echo "📊 Backend logs (last 20 lines):"
docker compose logs --tail=20 backend

echo ""  
echo "🌐 Frontend logs (last 20 lines):"
docker compose logs --tail=20 frontend

echo ""
echo "🗄️ Database logs (last 10 lines):"
docker compose logs --tail=10 mongodb

echo ""
echo "=================================================="
echo "✅ Test completed!"
echo "🌐 Frontend: http://localhost:3000"
echo "📡 Backend API: http://localhost:5000"
echo "🗄️ MongoDB: localhost:27017"
echo ""
echo "📖 Check REFACTOR_DOCUMENTATION.md for details"
