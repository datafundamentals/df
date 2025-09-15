# Architecture Overview

## Monorepo Structure

```
workspace/
├── apps/                    # Individual applications
│   └── approach/           # RAG system (to be migrated)
├── shared/                 # Shared resources across projects
│   ├── components/         # Reusable UI components
│   ├── services/          # Shared APIs, database models
│   ├── config/            # Environment configs, constants
│   └── utils/             # Pure utility functions
├── docs/                  # Project documentation
│   ├── sessions/          # Claude Code session documentation
│   ├── architecture.md    # This file
│   └── shared-resources.md # Shared resource documentation
└── ssg/                   # Static site generation projects
```

## Session Management Strategy

**Session Types:**
1. **Shared Resource Sessions:** Longer sessions for developing/maintaining shared components
2. **Project-Specific Sessions:** Focused sessions for individual app features
3. **Integration Sessions:** Bridge sessions for cross-project concerns

**Context Management:**
- Each session references this architecture
- Session-specific documentation in `docs/sessions/`
- Persistent knowledge base through file system documentation

## Current Projects

### apps/approach (Migration Target)
- **Type:** RAG System with ChromaDB, Ollama, Firestore
- **Status:** Exists in apps/approach, needs monorepo migration
- **Components:** Document storage, semantic search, AI response generation
- **Dependencies:** ChromaDB server, Ollama server, Firebase/Firestore

### shared/ (Emerging)
- **Status:** Structure exists, needs population from migrated projects
- **Goal:** House reusable components across RAG and future projects

## Technology Stack

**Backend Services:**
- ChromaDB: Vector database for embeddings
- Ollama: Local AI model server
- Firebase/Firestore: Document storage and real-time updates

**Frontend:**
- Web Components: Reusable UI elements
- Modern JavaScript: ES modules, async/await patterns

**Development:**
- Claude Code sessions: Focused development sprints
- Git workflow: Feature branches, clean commits
- Documentation-driven: Persistent context across sessions

## Architectural Principles

1. **Session Boundaries:** Clear scope for each Claude Code session
2. **Shared Resource Stability:** Versioned interfaces, clear contracts
3. **Documentation as Code:** All context persisted in files
4. **Clean Handoffs:** Each session prepares context for next
5. **Monorepo Benefits:** Shared tooling, cross-project visibility

## Next Steps

1. Migrate apps/approach to proper monorepo structure
2. Extract shared components to shared/ directory
3. Establish cross-project dependency management
4. Create standardized development workflows