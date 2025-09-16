#!/bin/bash

# Development Environment Orchestrator
# Manages the complete development stack for the monorepo

SCRIPTS_DIR="$(dirname "$0")"
PROJECT_ROOT="$(dirname "$0")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}=====================================${NC}"
    echo -e "${BLUE}  Development Environment Manager${NC}"
    echo -e "${BLUE}=====================================${NC}"
    echo ""
}

print_usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  status          - Check status of all services"
    echo "  start-all       - Start all services in background"
    echo "  stop-all        - Stop all services"
    echo "  chromadb        - Start ChromaDB only"
    echo "  firebase        - Start Firebase only"
    echo "  prezadmin       - Start PREZadmin proxy only"
    echo "  frontend        - Start PREZadmin frontend only"
    echo "  setup           - Show manual setup instructions"
    echo ""
    echo "Individual service scripts:"
    echo "  scripts/infrastructure/start-chromadb.sh"
    echo "  scripts/infrastructure/start-firebase.sh"
    echo "  scripts/apps/prezadmin/start-prezadmin.sh"
    echo "  scripts/apps/prezadmin/start-frontend.sh"
}

check_service() {
    local port=$1
    local name=$2
    if curl -s "localhost:$port" >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} $name (port $port)"
        return 0
    else
        echo -e "  ${RED}✗${NC} $name (port $port)"
        return 1
    fi
}

check_status() {
    echo -e "${YELLOW}Service Status:${NC}"
    check_service 8000 "ChromaDB"
    check_service 4000 "Firebase UI"
    check_service 5011 "PREZadmin Proxy"
    check_service 8001 "PREZadmin Frontend"
    check_service 11434 "Ollama"
    echo ""
}

show_setup() {
    echo -e "${YELLOW}Manual Terminal Setup (Recommended for Development):${NC}"
    echo ""
    echo "Terminal 1 (PREZadmin Proxy):"
    echo "  ./scripts/apps/prezadmin/start-prezadmin.sh"
    echo ""
    echo "Terminal 2 (ChromaDB):"
    echo "  ./scripts/infrastructure/start-chromadb.sh"
    echo ""
    echo "Terminal 3 (Firebase):"
    echo "  ./scripts/infrastructure/start-firebase.sh"
    echo ""
    echo "Terminal 4 (Frontend):"
    echo "  ./scripts/apps/prezadmin/start-frontend.sh"
    echo ""
    echo "Terminal 5 (Claude):"
    echo "  # Your AI assistant session"
    echo ""
    echo "Terminal 6 (Misc):"
    echo "  # General bash commands"
    echo ""
    echo -e "${GREEN}Each service runs in its own terminal for better log visibility and control.${NC}"
}

case "$1" in
    "status")
        print_header
        check_status
        ;;
    "chromadb")
        exec "$SCRIPTS_DIR/infrastructure/start-chromadb.sh"
        ;;
    "firebase")
        exec "$SCRIPTS_DIR/infrastructure/start-firebase.sh"
        ;;
    "prezadmin")
        exec "$SCRIPTS_DIR/apps/prezadmin/start-prezadmin.sh"
        ;;
    "frontend")
        exec "$SCRIPTS_DIR/apps/prezadmin/start-frontend.sh"
        ;;
    "setup")
        print_header
        show_setup
        ;;
    "start-all")
        echo -e "${RED}Note: start-all runs services in background.${NC}"
        echo -e "${RED}For development, use individual terminals (see: $0 setup)${NC}"
        echo ""
        echo "Starting all services..."
        # This would start all in background - not recommended for development
        ;;
    "stop-all")
        echo "Stopping all services..."
        pkill -f "chromadb"
        pkill -f "firebase"
        pkill -f "rag-server"
        ;;
    *)
        print_header
        print_usage
        echo ""
        show_setup
        ;;
esac