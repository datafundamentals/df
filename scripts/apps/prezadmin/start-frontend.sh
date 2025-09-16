#!/bin/bash

# PREZadmin Frontend Development Server
# Serves the web application for development
# Port: 8001
# Dependencies: PREZadmin proxy server (5011)

cd "$(dirname "$0")/../../../apps/PREZadmin"

echo "🌐 Starting PREZadmin Frontend..."
echo "📂 Working directory: $(pwd)"
echo "🔧 Building and serving..."
echo "🌐 Frontend will be available at: http://localhost:8001"
echo ""

# Build and serve the frontend
npm run build && npm run serve