#!/bin/bash

# ChromaDB Infrastructure Service
# Starts ChromaDB vector database in Docker container
# Port: 8000
# Data persistence: ./chromadata

echo "🔵 Starting ChromaDB server..."
echo "📁 Data will be persisted to: $(pwd)/chromadata"
echo "🌐 Server will be available at: http://localhost:8000"
echo ""

# Create data directory if it doesn't exist
mkdir -p chromadata

# Start ChromaDB with persistence and CORS enabled
docker run -p 8000:8000 \
  -e CHROMA_SERVER_CORS_ALLOW_ORIGINS="*" \
  -e CHROMA_SERVER_HOST="0.0.0.0" \
  -e ALLOW_RESET=TRUE \
  -v $(pwd)/chromadata:/data \
  chromadb/chroma:latest