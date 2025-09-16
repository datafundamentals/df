#!/bin/bash

# Firebase Infrastructure Service
# Starts Firebase emulators for local development
# Services: auth, firestore, functions, storage
# Note: hosting excluded due to port conflicts

echo "🔥 Starting Firebase emulators..."
echo "📱 Services: auth, firestore, functions, storage"
echo "🌐 Firebase UI will be available at: http://localhost:4000"
echo ""

# Start Firebase emulators (excluding hosting due to port conflicts)
firebase emulators:start --only auth,firestore,functions,storage