#!/bin/bash

# PREZadmin Application Server
# Builds and starts the RAG system proxy server
# Port: 5011 (proxy server)
# Dependencies: ChromaDB (8000), Firebase emulators, Ollama (11434)

cd "$(dirname "$0")/../../../apps/PREZadmin"

echo "🚀 Starting PREZadmin RAG System..."
echo "📂 Working directory: $(pwd)"
echo "🔧 Building TypeScript..."
echo ""

# Build and start the RAG server
npm run rag:start