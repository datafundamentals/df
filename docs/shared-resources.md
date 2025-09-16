# Shared Resources Documentation

## Overview
This document tracks shared components, services, and utilities available across all projects in the monorepo.

## Current Status
**Status:** Initial setup - resources will be populated during apps/approach migration

## Available Shared Resources

### shared/components/
**Status:** UI components kept project-specific due to framework dependencies
- Complex Lit Element dependencies make extraction challenging
- Tag typeahead and document metadata remain in project directories

### shared/services/
**Available Resources:**
- `chromadb-client.ts`: ChromaDB connection service with configuration
- `ollama-client.ts`: Ollama AI service wrapper with generate methods
- `file-processing.ts`: Markdown parsing, token counting utilities

### shared/config/
**Available Resources:**
- `environment.ts`: Environment variable loading and validation utilities
- Supports dotenv configuration loading
- Validates required environment variables

### shared/utils/
**Status:** File processing utilities moved to shared/services
- Text processing helpers available in file-processing service
- Token counting and markdown parsing utilities

## Usage Guidelines

### Before Creating New Components
1. Check this document for existing implementations
2. Review shared/ directory structure
3. Consider if new component should be shared or project-specific

### Adding New Shared Resources
1. Create component in appropriate shared/ subdirectory
2. Document interface/API in this file
3. Version the component clearly
4. Update consuming projects to use shared version

### Versioning Strategy
- Use semantic versioning for breaking changes
- Document migration paths for interface changes
- Maintain backward compatibility when possible

## Dependencies

### External Services
- **ChromaDB:** Vector database (port 8000)
- **Ollama:** AI model server (port 11434)
- **Firebase/Firestore:** Document storage and real-time sync

### Development Tools
- Node.js and npm for package management
- ESLint for code quality
- TypeScript for type safety (where applicable)

## Migration Notes

### From apps/approach → apps/PREZadmin
**Completed Migration Results:**

**Services Extracted to shared/:**
- ✅ ChromaDB client setup and connection logic → `shared/services/chromadb-client.ts`
- ✅ Ollama integration utilities → `shared/services/ollama-client.ts`
- ✅ File processing utilities → `shared/services/file-processing.ts`
- ✅ Environment configuration → `shared/config/environment.ts`

**Components Remaining Project-Specific:**
- Tag typeahead input (complex Lit Element dependencies)
- Document metadata components (UI framework specific)
- Query interfaces (project-specific business logic)
- Results display components (application-specific)

**Utilities Extracted:**
- ✅ Text processing helpers → shared/services/file-processing
- ✅ Markdown parsing and token counting utilities
- ✅ Environment validation patterns

## Usage Examples

### Using ChromaDB Service
```typescript
import { ChromaDBService } from 'shared/services/chromadb-client';

const chromaService = new ChromaDBService({
  host: 'localhost',
  port: 8000,
  embeddingModel: 'nomic-embed-text'
});

const collection = await chromaService.getOrCreateCollection('documents');
```

### Using Environment Configuration
```typescript
import { loadEnvironment, validateEnvironment } from 'shared/config/environment';

const env = loadEnvironment('/path/to/project/root');
validateEnvironment(env);
```

## Next Session Priorities

Future sessions should focus on:
1. ✅ Additional shared component extraction as UI framework dependencies are resolved
2. ✅ Cross-project integration testing
3. Additional monorepo projects using established shared resources
4. Refinement of shared service interfaces based on usage patterns

---

**Last Updated:** 2025-09-15 (Migration session completed)
**Next Review:** After additional projects added to monorepo