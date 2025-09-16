# PREZadmin - RAG System

PREZadmin is a comprehensive Retrieval-Augmented Generation (RAG) system that combines ChromaDB vector storage with Ollama AI models for intelligent document querying and response generation.

This is a **local RAG backend service** that runs ChromaDB + Ollama locally to avoid expensive cloud AI costs, while providing similar functionality as cloud-based RAG services.

## Quick Start

**Three terminal windows required:**
1. `./runchroma.sh` - ChromaDB server
2. `./firebasestart.sh` - Firebase emulators
3. `./ragstart.sh` - RAG server → http://localhost:5011

## Migration Status

This project was migrated from `apps/approach/` as part of monorepo restructuring:
- ✅ Original `apps/approach/` preserved as backup
- ✅ Shared utilities extracted to `shared/` directory
- ✅ Environment configuration standardized
- ✅ Build system updated for monorepo compatibility
- ✅ Startup scripts restored
- ✅ **Path Fix:** Updated `DEFAULT_MARKDOWN_SOURCE_DIR=../../../RAG` for monorepo structure

## Features

- **Document Storage**: Store text documents as vector embeddings with rich metadata
- **Semantic Search**: Query documents using natural language with ChromaDB similarity search
- **RAG Pipeline**: Complete retrieval-augmented generation using local Ollama models
- **Ontological Relationships**: Support for `is_a`, `child_of`, `has_a` semantic relationships with three-collection architecture
- **Metadata Filtering**: Rich metadata support for organizing knowledge hierarchically
- **TypeScript**: Full type safety with modern ES modules

## Quick Start

### Prerequisites

- Docker Desktop (for ChromaDB)
- Ollama installed with `llama3.1` and `nomic-embed-text` models
- Node.js 16+ (for TypeScript and web dev server)

### Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

   **Note**: If you encounter Firebase auth errors like "Component auth has not been registered yet", ensure you have the latest Firebase version. This was a known breaking change that was fixed in Firebase 12.x:

   ```bash
   npm install firebase@latest
   ```

2. **Start Docker Desktop** (required for ChromaDB)

3. **Start ChromaDB:**

   ```bash
   ./runchroma.sh
   ```

4. **Start Ollama and pull models:**

   ```bash
   ollama serve
   ollama pull llama3.1
   ollama pull nomic-embed-text
   ```

5. **Start Required Services (3 Terminal Windows):**

   **Terminal 1 - ChromaDB Server:**
   ```bash
   ./runchroma.sh
   ```

   **Terminal 2 - Firebase Emulators:**
   ```bash
   ./firebasestart.sh
   ```

   **Terminal 3 - RAG Server:**
   ```bash
   ./ragstart.sh
   # (equivalent to: npm run rag:start)
   ```

6. **Optional: Start web development server (for web components):**

   ```bash
   npm run serve
   ```

7. **Open browsers:**
   - RAG Interface: http://localhost:5011
   - Web Components: http://localhost:8002 (if serve is running)

## Architecture

This system replaces expensive cloud RAG services (OpenAI + Pinecone, etc.) with local alternatives:

- **ChromaDB**: Local vector database (replaces Pinecone/Weaviate)
- **Ollama**: Local AI models (replaces OpenAI API)
- **RAG Server**: Orchestrates retrieval + generation pipeline
- **Web Interface**: Simple UI for document management and querying

### Project Structure

```
├── src/
│   └── server/
│       └── rag-server.ts  # Main RAG backend service (TypeScript)
├── dev/
│   ├── index.html         # Development tools landing page
│   ├── rag.html           # Main RAG interface
│   ├── rag-script.js      # RAG frontend logic
│   └── rag-style.css      # RAG styling
├── out-tsc/               # Compiled TypeScript output
├── chromadata/            # ChromaDB persistent storage
├── runchroma.sh          # ChromaDB Docker startup script
└── tsconfig.json         # TypeScript configuration
```

## Usage

### Document Storage

1. Switch to "Document Storage" tab
2. Enter text content and metadata:
   ```
   title: concept name
   tags: keyword1, keyword2
   category: primary|secondary|reference
   is_a: teacher, educator
   child_of: teachers, faculty
   has_a: domain, expertise
   ```
3. Click "Save" to store as embeddings

### RAG Queries

1. Use "Query & Chat" tab (default)
2. Ask natural language questions
3. System retrieves relevant documents and generates contextual answers
4. Adjust "Max Results" to control context breadth (default: 20)

### Semantic Relationships

The system supports ontological knowledge organization through three-collection architecture:

- `is_a`: What type/category this document represents (inheritance-like relationships)
- `child_of`: What broader concept this document is an example of (reference-like relationships)  
- `has_a`: What properties/attributes this document contains (property-like relationships)
- Natural language queries automatically discover related concepts across collections

## API Endpoints

The RAG server exposes these endpoints at `/api/v2`:

- `save_document` - Store text with metadata as embeddings
- `query_rag` - Semantic search + AI response generation
- `find_by_parent_concept` - Find documents by parent concept relationships (searches child_of field)
- `find_by_is_a` - Find documents by type relationships (searches is_a field)
- `find_by_has_a` - Find documents by property relationships (searches has_a field)
- `get_documents` - Retrieve all stored documents
- `list_collections` - List ChromaDB collections

## Configuration

### Environment Variables (.env)

```bash
DEFAULT_N_RESULTS=20    # Default number of results to retrieve
PORT=5011              # Server port
```

### TypeScript Build & RAG Scripts

```bash
npm run build         # Compile TypeScript
npm run rag:start     # Build and run RAG server
npm run rag:dev       # Development mode (watch + restart)
```

## Development & Testing

### Component Testing Tools

The project includes interactive testing tools for validating component architecture and refactoring:

- **Development Landing Page**: `http://localhost:8001/dev/`
  - Central hub for all development tools
  - Links to RAG interfaces and testing utilities

- **Quick Component Test**: `dev/quick-component-test.html`
  - Minimal test to verify extracted components load correctly
  - Visual validation of component rendering
  - Basic event communication testing

- **Component Playground**: `dev/component-playground-standalone.html`
  - Interactive testing environment with event logging
  - Mock data scenarios for component behavior validation
  - Risk-based testing approach (High/Medium/Low priority)

- **Testing Documentation**: `dev/README-COMPONENT-TESTING.md`
  - Complete testing methodology and usage guide
  - Component integration testing strategies

### Development Workflow

1. **Run Development Server**: `npx http-server . -p 8001`
2. **Access Tools**: Visit `http://localhost:8001/dev/`
3. **Component Testing**: Use testing tools after component changes
4. **Build Validation**: Run `npm run build` to ensure TypeScript compilation

## Why This Architecture?

**Cost Savings**: Running Ollama + ChromaDB locally vs cloud RAG services:

- OpenAI API + Pinecone: $$$
- Local Ollama + ChromaDB: Free (after hardware)

**Privacy**: Your documents never leave your machine

**Performance**: No API rate limits or network latency

**Flexibility**: Full control over models, embeddings, and processing

## Integration & Dual-Server Architecture

This project combines two complementary systems:

### RAG Server (localhost:5011)

- Local AI processing with ChromaDB + Ollama
- Cost-effective alternative to cloud RAG services
- Handles semantic search and document storage

### Web Components (localhost:8002)

- Firebase-integrated web application
- User authentication and app data management
- Lit-based web components with TypeScript

### Development Workflow

Both servers run simultaneously during development:

```bash
# Terminal 1: RAG Server
npm run rag:start

# Terminal 2: Web Dev Server
npm run serve
```

The Web Dev Server includes middleware that proxies RAG API calls (`/api/v2/*`) to the RAG server, enabling seamless integration between Firebase features and local AI processing.

This architecture allows you to:

- Use expensive cloud services only where needed (user auth, app data)
- Keep AI processing local and cost-effective
- Maintain separation of concerns between different backend services

## Troubleshooting

### Firebase Authentication Issues

**Problem**: Getting "Component auth has not been registered yet" error when loading web components.

**Solution**: This was a breaking change in Firebase 11.x versions. Upgrade to the latest Firebase version:

```bash
npm install firebase@latest
npm run build
```

**Root Cause**: Firebase versions 11.0.1 through 11.10.0 had module initialization timing issues that were resolved in Firebase 12.x.

### RAG Server Connection Issues

**Problem**: Web components show "RAG API not available" or 500 errors.

**Solution**: Ensure both servers are running:

```bash
# Check if RAG server is running
curl http://localhost:5011/api/v2/list_collections

# Check if ChromaDB is running
curl http://localhost:8000/api/v1/heartbeat
```

**Common Fixes**:

- Restart ChromaDB: `./runchroma.sh`
- Restart RAG server: `npm run rag:start`
- Check Docker Desktop is running

## Dependencies

- **TypeScript** - Type safety and modern development
- **Express** - Web server framework
- **ChromaDB** - Vector database for embeddings
- **Ollama** - Local AI model serving
- **Axios** - HTTP client for Ollama API calls
- **CORS** - Cross-origin request handling
- **Firebase** - Web app backend services (auth, database)
- **Lit** - Web components framework
