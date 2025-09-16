#!/bin/bash
docker run -p 8000:8000 \
  -e CHROMA_SERVER_CORS_ALLOW_ORIGINS="*" \
  -e CHROMA_SERVER_HOST="0.0.0.0" \
  -e ALLOW_RESET=TRUE \
  -v $(pwd)/chromadata:/data \
  chromadb/chroma:latest