# Monorepo Development Context

## Current State
**Last Updated:** 2025-09-16 (Script Rationalization Session Completed)
**Active Projects:** 1 (PREZadmin)
**Shared Components:** Established
**Development Scripts:** Rationalized to `/scripts` directory

## Project Overview

This monorepo contains multiple applications with shared components and utilities. The architecture supports independent development while maximizing code reuse.

### Current Applications

#### apps/PREZadmin/
**Status:** ✅ Operational
**Type:** RAG System (ChromaDB + Ollama)
**Migration:** Completed from apps/approach/ (preserved as backup)

**Key Features:**
- Document storage with semantic embeddings
- Natural language querying with AI responses
- Ontological metadata management
- Web-based interface for document management

**Dependencies:**
- ChromaDB server (port 8000)
- Ollama server (port 11434)
- Firebase/Firestore emulators
- RAG proxy server (port 5011)
- Frontend dev server (port 8001)

**Startup:** 4-terminal process using rationalized scripts:
- `./scripts/infrastructure/start-chromadb.sh` (Terminal 2)
- `./scripts/infrastructure/start-firebase.sh` (Terminal 3)
- `./scripts/apps/prezadmin/start-prezadmin.sh` (Terminal 1)
- `./scripts/apps/prezadmin/start-frontend.sh` (Terminal 4)

#### apps/approach/
**Status:** 🗄️ Backup (Preserved)
**Purpose:** Safety backup of original RAG system
**Action:** Do not modify - kept for rollback if needed

### Shared Resources

#### shared/services/
- `chromadb-client.ts` - ChromaDB connection and management
- `ollama-client.ts` - Ollama AI service wrapper
- `file-processing.ts` - Markdown parsing and token counting

#### shared/config/
- `environment.ts` - Environment variable loading and validation

#### shared/components/
- Currently empty (UI components remain app-specific due to framework dependencies)

### Documentation Structure

#### docs/
- `architecture.md` - Monorepo structure and principles
- `shared-resources.md` - Available shared components
- `sessions/` - Claude development session documentation
- `CLAUDE_SESSION_CHECKLIST.md` - Session protocols

#### Conceptual Documentation
**Location:** `docs/` (shared across all projects)
- `CODING_STANDARDS_STYLES.md` - Code style and formatting guidelines
- `CODING_TEST_METHODOLOGY.md` - Testing approach and principles
- `CODING_TESTING_STRATEGY.md` - Comprehensive testing strategy
- `CODING_AUTHENTICATION_WRAPPER_ADDENDUM.md` - Auth patterns for all apps
- `CODING_COMPONENTS_ADDENDUM.md` - Component architecture patterns
- `CONTEXT_SESSION_CLAUDE_STRATEGY.md` - Session management protocols

## Development Protocols

### Session Management
- Each development session documented in `docs/sessions/`
- Session checklist followed for consistency
- **CLAUDE.md updated at session close** ⚠️
- Clean handoffs between sessions

### Shared Component Strategy
- Extract utilities and services to `shared/`
- UI components remain app-specific due to framework complexity
- Maintain interface contracts between shared and project code

### Path Management
- **Critical:** Relative paths adjusted for monorepo structure
- Example: `DEFAULT_MARKDOWN_SOURCE_DIR=../../../RAG` (not `../RAG`)

## Next Session Priorities

1. **Future Projects:** Additional apps leveraging shared components
2. **Enhanced Shared Components:** UI component extraction as framework dependencies allow
3. **Cross-Project Integration:** Testing shared component contracts
4. **Development Workflow:** Standardized build/test/deploy processes

## Recent Accomplishments

### Script Rationalization Session (2025-09-16)
- ✅ Created `/scripts` directory with organized structure
- ✅ Separated infrastructure vs. app-specific startup scripts
- ✅ Implemented master development orchestrator (`development.sh`)
- ✅ Added service status monitoring and setup guidance
- ✅ Updated all scripts with proper documentation and port information
- ✅ Maintained compatibility with existing 10-tab terminal workflow

### Migration Session (2025-09-15)
- ✅ Successfully migrated apps/approach → apps/PREZadmin
- ✅ Established shared/ directory with core services
- ✅ Created comprehensive .gitignore coverage
- ✅ Restored startup scripts and operational procedures
- ✅ Fixed path configurations for monorepo structure
- ✅ Consolidated documentation architecture

### Architecture Achievements
- ✅ Clean separation between shared and project-specific code
- ✅ Bulletproof .gitignore for node_modules and .env files
- ✅ Session documentation protocols established
- ✅ Path fix: `../../../RAG` correctly resolves to markdown source
- ✅ Rationalized script organization supporting monorepo growth
- ✅ Infrastructure vs. application script separation

## Environment Notes

**ChromaDB:** Local vector database for RAG embeddings
**Ollama:** Local AI models (llama3.1, nomic-embed-text)
**Firebase:** Emulated services for development
**Monorepo Structure:** `/df/` contains apps/, shared/, docs/, ssg/, scripts/
**Development Scripts:** Organized in `/scripts` with infrastructure and app-specific separation

---

**Session Status:** Ready for next development phase
**System Health:** All services operational
**Documentation:** Current and comprehensive