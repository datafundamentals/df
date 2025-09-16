# Project Plan: ChromaDB RAG Query System with Ollama Integration

1. Project Overview
   This project builds a complete Retrieval-Augmented Generation (RAG) system that combines ChromaDB vector storage with Ollama AI models to provide intelligent query responses based on stored document embeddings.

The system allows users to:

1. Store text documents as embeddings in ChromaDB using the `nomic-embed-text` model
2. Submit natural language queries that retrieve relevant stored content
3. Generate contextual answers using Ollama models with the retrieved information

This creates a complete RAG pipeline: document ingestion → vector storage → semantic retrieval → AI-generated responses.

Core Functionality:

Phase 1 (Completed): Document Storage

- Web interface with textarea for text input and "Save" button
- Text embedding using nomic-embed-text model
- Storage in local ChromaDB instance with persistence

Phase 2 (Current Objective): Query & Response System

- Query interface for natural language questions
- Semantic search through stored embeddings
- Ollama integration to generate contextual answers
- Display of both retrieved context and generated response

2. Technical Architecture & Concepts
   This RAG system involves four key components working together:

Component 1: ChromaDB Server (Vector Database Backend)
ChromaDB stores document embeddings and handles semantic similarity searches. Configured with the `nomic-embed-text` model for consistency with Ollama workflows.

- Persistence: Data saved to local `chromadata` folder
- API: HTTP interface for embedding storage and retrieval
- Search: Semantic similarity queries return relevant document chunks

Component 2: Ollama Server (AI Model Backend)
Local AI model server that generates responses based on retrieved context.

- Models: Compatible with various models (llama3, mistral, etc.)
- API: HTTP interface for chat completions
- Integration: Receives context from ChromaDB searches for RAG responses

Component 3: Node.js Proxy Server (API Orchestration Layer)
Express.js server that coordinates between ChromaDB, Ollama, and the frontend.

- ChromaDB Integration: Handles document storage and retrieval
- Ollama Integration: Manages AI model interactions
- RAG Pipeline: Combines retrieval and generation steps
- CORS Handling: Enables frontend communication

Component 4: Web Application (Frontend Interface)
Dual-mode interface for document management and querying:

- Document Mode: Text input and storage (existing functionality)
- Query Mode: Natural language questions with AI-generated responses
- Results Display: Shows both retrieved context and generated answers

3. Implementation Details

Current Implementation Status:
Phase 1 - Document Storage (Completed):

- ✅ Web interface with text input and save functionality
- ✅ Node.js proxy server (proxy-server.js) that handles requests
- ✅ Basic ChromaDB integration structure
- ✅ ChromaDB configuration with nomic-embed-text model

Phase 2 - RAG Query System (Completed):

- ✅ Query interface in frontend
- ✅ ChromaDB semantic search endpoint
- ✅ Ollama integration for response generation
- ✅ RAG pipeline orchestration
- ✅ Context + response display

Phase 3 - Metadata-Enhanced Querying (Completed):

- ✅ Metadata filtering in query interface
- ✅ Display metadata alongside retrieved context
- ✅ Support for filtering by title, tags, category, and related fields
- ✅ Enhanced AI prompts that utilize metadata for better responses

Phase 4 - Ontological Metadata Collections (Completed):
Semantic relationship-based content discovery through three-collection architecture:

**✅ Completed Implementation:**

- **Three-Collection Architecture**: Separated metadata into specialized Firestore collections:
  - `tags` collection: Non-ontological descriptive keywords  
  - `categories` collection: Document classification hierarchy
  - `ontology` collection: Semantic relationships (`is_a`, `child_of`, `has_a`)

- **Ontological Relationship Fields**:
  - `is_a`: "This document is a type of X" (inheritance-like)
  - `child_of`: "This document is a specific example of X" (reference-like)  
  - `has_a`: "This document contains/includes X" (property-like)

- **Collection-Specific TypeAhead**: UI components route to appropriate collections based on field type

- **Semantic Discovery System**: Advanced relationship traversal with confidence scoring and clustering

- **Interactive Concept Explorer**: Multi-view interface for exploring ontological relationships

**Current System Capabilities:**
- Document storage with rich ontological metadata
- Collection-specific autocomplete and validation
- Semantic relationship discovery and graph building
- Interactive concept exploration with neighborhood analysis

**Next Objective:** Add metadata filtering to query interface for targeted searches (e.g., "find all documents where is_a contains 'teacher'")

**Design Reference:** See `CODING_CHUNK_METADATA_COLLECTIONS_ADDENDUM.md` for complete technical specification.

### Ontological Architecture Overview

The system implements intelligent content discovery through semantic relationships:

**Three-Collection Data Architecture:**
- **Tags Collection**: Descriptive keywords for topic categorization
- **Categories Collection**: Document classification (primary/secondary/reference)  
- **Ontology Collection**: Semantic relationships (`is_a`, `child_of`, `has_a`)

**Key Capabilities:**
- **Dynamic Relationship Discovery**: Find related concepts without pre-computing relationships
- **Semantic Search Enhancement**: Query by ontological relationships (e.g., "all teachers with domain expertise")
- **Intelligent Context Assembly**: Build contextual knowledge from relationship traversal
- **Interactive Exploration**: Visual concept neighborhood and pathway discovery

**Query Enhancement Examples:**
- `is_a: teacher` → Find all documents that are examples of teachers
- `child_of: teachers` → Find all specific teacher instances under the general "teachers" concept
- `has_a: domain` → Find all documents that contain domain expertise information

This enables question-answering that goes beyond keyword matching to semantic understanding of concept relationships within your knowledge base.

4. Setup and Running Instructions

Step 1: Install Dependencies

```bash
npm install
```

Step 2: Start ChromaDB Server
Create a `chromadata` folder and run ChromaDB with nomic-embed-text model:

```bash
mkdir -p chromadata
docker run -p 8000:8000 \
  -e CHROMA_SERVER_CORS_ALLOW_ORIGINS="*" \
  -e CHROMA_SERVER_HOST="0.0.0.0" \
  -e ALLOW_RESET=TRUE \
  -v $(pwd)/chromadata:/data \
  chromadb/chroma:latest
```

Step 3: Start Ollama Server
Ensure Ollama is installed and running with a compatible model:

```bash
# Install a model if not already available
ollama pull llama3

# Start Ollama server (usually runs on localhost:11434)
ollama serve
```

Step 4: Start the Application

```bash
node proxy-server.js
```

Then open http://localhost:3001 in your browser.

5. RAG Workflow with Metadata Enhancement
   The complete system enables this enhanced workflow:

1. **Document Ingestion**: Users input text documents with rich ontological metadata that get embedded and stored in ChromaDB
1. **Query Processing**: Users ask natural language questions with semantic and metadata filtering
1. **Ontological Retrieval**: System searches ChromaDB using semantic similarity plus ontological relationship discovery
1. **Context Integration**: Retrieved content provides context with semantic relationship information for the AI model
1. **Enhanced Response Generation**: Ollama generates informed answers using document content plus ontological context
1. **Rich Result Display**: Users see document content, ontological relationships, and AI-generated responses

## Metadata Structure

Documents are stored with the following ontological metadata format:

```
title: "Document Title"
tags: "keyword1, keyword2, keyword3"
category: "primary|secondary|reference"
is_a: "teacher, educator"
child_of: "teachers, faculty"
has_a: "domain, expertise"
```

**Field Meanings:**
- `is_a`: What type/category this document represents (inheritance-like relationships)
- `child_of`: What broader concept this document is an example of (reference-like relationships)  
- `has_a`: What properties/attributes this document contains (property-like relationships)

This creates a complete RAG system where AI responses are grounded in your stored documents and enhanced with semantic ontological relationships, enabling intelligent content discovery and contextually-aware question-answering over your knowledge base.
