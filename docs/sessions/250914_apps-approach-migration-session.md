# Next Session Context: apps/approach Migration

## Session Setup Information
**Recommended Session Type:** Integration Session
**Estimated Scope:** 2-3 hours (complex migration with multiple moving parts)
**Prerequisites:** Review this document and checklist before starting

## Pre-Session Checklist Context
When starting the next session, the Claude agent should:

1. **Read Required Documents:**
   - `docs/CLAUDE_SESSION_CHECKLIST.md` (session protocols)
   - `docs/architecture.md` (system overview)
   - `docs/shared-resources.md` (shared component strategy)
   - `apps/approach/CLAUDE.md` (project-specific context)
   - This file (`docs/sessions/apps-approach-migration-session.md`)

2. **Understand Current State:**
   - Bulletproof session checklist is complete and operational
   - Monorepo structure exists with apps/, shared/, docs/ directories
   - apps/approach contains complete RAG system needing migration
   - Session protocols have been established and tested

## Primary Objective: apps/approach Migration to apps/PREZadmin

### Goal
Copy and migrate the RAG system from `apps/approach/` to `apps/PREZadmin/` following proper monorepo structure. The original `apps/approach/` directory will remain unchanged as a backup.

### Key Components to Migrate
Based on apps/approach directory listing:
- **RAG System:** ChromaDB + Ollama integration
- **Documentation:** Multiple CODING_*.md addendum files
- **Configuration:** Firebase, TypeScript, testing setup
- **Source Code:** Complete web application with backend services

### Expected Outcomes
1. **New App Structure:** `apps/PREZadmin/` with proper monorepo organization
2. **Preserved Backup:** `apps/approach/` remains unchanged as safety backup
3. **Shared Extractions:** Common components moved to `shared/`
4. **Updated Documentation:** All docs reflect new structure
5. **Working System:** New application functions identically to original

## Migration Strategy

### Phase 1: Analysis and Planning
- Examine apps/approach codebase thoroughly
- Identify shared vs project-specific components
- Create migration TodoWrite list with specific tasks
- Map dependencies and external services

### Phase 2: Structure Creation
- Create new `apps/PREZadmin/` directory with proper structure
- Copy from `apps/approach/` (keeping original unchanged)
- Set up shared/ components as identified
- Migrate configuration files appropriately

### Phase 3: Code Migration
- Copy source code with proper imports/exports
- Update shared component references in new location
- Maintain functional equivalence

### Phase 4: Documentation and Testing
- Update all documentation to reflect new structure
- Verify system functionality
- Create clean handoff for future sessions

## Critical Dependencies

### External Services (Must Be Available)
- ChromaDB server (port 8000) - via `./runchroma.sh`
- Ollama server (port 11434) - system service
- Firebase/Firestore (configuration in apps/approach) - via `./firebasestart.sh`

### Startup Script Requirements
The original apps/approach required three terminal windows:
1. **Window 1:** `npm run rag:start` or `./ragstart.sh` - Main RAG server
2. **Window 2:** `./firebasestart.sh` - Firebase emulators (auth, firestore, functions, storage)
3. **Window 3:** `./runchroma.sh` - ChromaDB docker container

**Migration Requirement:** These startup scripts must be preserved/recreated in apps/PREZadmin

### Path Updates Required
**Directory Structure Change:**
- Original: `apps/approach/` → `../RAG` ✅
- New: `apps/PREZadmin/` → `../../../RAG` ✅ (adjusted for monorepo nesting)

**Fixed in Migration:**
- ✅ Updated `.env` file: `DEFAULT_MARKDOWN_SOURCE_DIR=../../../RAG`
- ✅ Verified path resolves to correct RAG directory with markdown files

### Current Working Components
The RAG system in apps/approach includes:
- Document storage with metadata
- Semantic search capabilities
- AI response generation
- Web interface for interaction

## Potential Challenges

1. **Complex Dependencies:** RAG system has multiple external service dependencies
2. **Large Codebase:** apps/approach has substantial implementation
3. **Documentation Volume:** Multiple addendum files need proper organization
4. **Service Configuration:** External services need proper connection handling

## Success Criteria

### Must Have
- [ ] RAG system functions identically after migration
- [ ] Shared components properly extracted and usable
- [ ] All external services connect properly
- [ ] Documentation updated and organized

### Should Have
- [ ] Improved code organization following monorepo patterns
- [ ] Clear separation of shared vs project-specific code
- [ ] Comprehensive session documentation for future work

## Session Exit Criteria

Do not exit the migration session until:
1. Basic RAG functionality is verified working
2. Shared components are documented in `docs/shared-resources.md`
3. Next session context is prepared
4. All protocols from checklist are completed

## Post-Migration Priorities

After successful migration, future sessions should focus on:
1. Additional shared component extraction
2. Cross-project integration testing
3. Development workflow optimization
4. Additional monorepo projects

---

**Preparation Note:** This migration represents the first major test of the session protocols. Follow the checklist meticulously to establish good patterns for future complex sessions.