# Shared Resources Documentation

## Overview
This document tracks shared components, services, and utilities available across all projects in the monorepo.

## Current Status
**Status:** Initial setup - resources will be populated during apps/approach migration

## Available Shared Resources

### shared/components/
*To be populated during migration*
- Will contain reusable UI components extracted from projects
- Expected: Form components, data display components, layout components

### shared/services/
*To be populated during migration*
- Database connection utilities
- API service abstractions
- External service integrations (ChromaDB, Ollama, Firebase)

### shared/config/
*To be populated during migration*
- Environment configuration management
- Service endpoint configurations
- Common constants and enums

### shared/utils/
*To be populated during migration*
- Pure utility functions
- Data transformation helpers
- Common validation logic

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

### From apps/approach
During the upcoming migration session, the following will be extracted to shared/:

**Services to Extract:**
- ChromaDB client setup and connection logic
- Ollama integration utilities
- Firebase/Firestore configuration and helpers

**Components to Extract:**
- Document input forms
- Query interfaces
- Results display components
- Metadata management components

**Utilities to Extract:**
- Text processing helpers
- Embedding utilities
- Error handling patterns

## Next Session Requirements

The next session should:
1. Review apps/approach codebase for shared resource candidates
2. Extract and migrate appropriate components to shared/
3. Update this documentation with newly available resources
4. Establish clear interface contracts for shared components

---

**Last Updated:** 2025-09-15 (Initial creation)
**Next Review:** After apps/approach migration session