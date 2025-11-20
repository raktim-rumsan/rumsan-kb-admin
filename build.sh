#!/bin/bash

# Build script for Rumsan AI Knowledgebase Admin Panel Docker image

set -e

# Add Docker to PATH if not already there
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"

echo "🚀 Building Rumsan AI Knowledgebase Admin Panel Docker Image..."

# Check if .env file exists
if [ ! -f .env.prod ]; then
    echo "⚠️  Warning: .env.prod file not found. Creating from .env.example..."
    if [ -f env.example ]; then
        cp env.example .env.prod
        echo "📝 Please edit .env.prod file with your actual values before building"
        exit 1
    fi
fi

# Load environment variables
if [ -f .env.prod ]; then
    export $(cat .env.prod | grep -v '^#' | xargs)
    echo "📋 Loaded environment variables:"
    echo "  NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL"
fi

# Check required environment variables
required_vars=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "NEXT_PUBLIC_SERVER_API")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    printf '%s\n' "${missing_vars[@]}"
    echo "Please set these variables in your .env.prod file"
    exit 1
fi

# Build the image
echo "🔨 Building Docker image for AMD64 platform..."
docker build \
    --platform linux/amd64 \
    --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
    --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    --build-arg NEXT_PUBLIC_SERVER_API="$NEXT_PUBLIC_SERVER_API" \
    -t rumsan/ai-admin-kb:latest \
    .

echo "✅ Build completed successfully!"
echo ""
echo "🎯 Available commands:"
echo "  docker run -p 3001:3000 rumsan/ai-admin-kb:latest                 # Run the container"
echo "  docker compose -f docker-compose.build.yml up --build             # Build and run with compose"
echo "  docker compose up                                                 # Run with pre-built image"
echo ""
echo "🔗 The application will be available at: http://localhost:3001"