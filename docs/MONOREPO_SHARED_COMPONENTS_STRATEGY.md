# Monorepo Shared Components Strategy

## Session Context: 250916_refactor_page_author

**Objective:** Extract page author functionality from PREZadmin into independent app while establishing proper shared component architecture.

**Current Status:** Page author successfully extracted but using component duplication (temporary solution).

## Problem Statement

When refactoring page author functionality, we identified 4 shared components:
- `awr-resource-documenter` - Main resource documenter component
- `awr-upload-link` - File upload and link management
- `awr-sgmtd-button` - Segmented button UI component
- `awr-markdown-codemirror` - Markdown editor with CodeMirror

Initial attempt to use direct cross-directory imports failed due to TypeScript `rootDir` restrictions.

## Architecture Options Analysis

### Option 1: Build Shared as NPM Package ⭐ **RECOMMENDED**

**Approach:** Build `shared/` as a proper NPM package that apps consume as dependency.

**Pros:**
- ✅ Clean separation of concerns
- ✅ Proper versioning of shared components
- ✅ Standard NPM dependency resolution
- ✅ TypeScript works out of the box
- ✅ Can be published privately or locally
- ✅ Easiest migration path from current setup

**Cons:**
- ⚠️ Requires build step for shared components
- ⚠️ Apps need to rebuild when shared changes
- ⚠️ Slightly more complex development workflow

**Implementation:**
```bash
# In shared/ directory
npm run build  # Builds to dist/
npm link       # Creates local package

# In app directories
npm link shared-components  # Links to local package
```

### Option 2: TypeScript Project References

**Approach:** Use TypeScript's project references to allow cross-project imports.

**Pros:**
- ✅ Native TypeScript solution
- ✅ Incremental compilation
- ✅ Proper type checking across projects

**Cons:**
- ⚠️ More complex TypeScript configuration
- ⚠️ Requires careful tsconfig.json management
- ⚠️ Still requires build coordination

**Implementation:**
```json
// In app tsconfig.json
{
  "references": [
    { "path": "../shared" }
  ]
}
```

### Option 3: Monorepo Tools (Nx/Lerna/Rush)

**Approach:** Use dedicated monorepo management tools.

**Pros:**
- ✅ Purpose-built for monorepos
- ✅ Advanced features (caching, task orchestration)
- ✅ Handles dependencies automatically
- ✅ Great for scaling

**Cons:**
- ❌ Significant learning curve
- ❌ Adds tool complexity
- ❌ May be overkill for current size
- ❌ Migration overhead

### Option 4: Symlinks/Build Pipeline

**Approach:** Custom build pipeline with symlinks or file copying.

**Pros:**
- ✅ Full control over process
- ✅ Can be tailored to specific needs

**Cons:**
- ❌ Custom tooling maintenance
- ❌ Platform-specific issues (symlinks)
- ❌ Complex debugging
- ❌ Reinventing existing solutions

## Recommended Implementation Path

### Phase 1: Option 1 - Shared NPM Package
Start with building shared as NPM package because:
1. **Simplest conceptually** - leverages familiar NPM patterns
2. **Lowest risk** - can revert to duplication if issues arise
3. **Good foundation** - can migrate to other options later
4. **TypeScript friendly** - works with existing configurations

### Phase 2: Evaluation and Potential Migration
After Phase 1 is stable, evaluate:
- **If scaling issues arise** → Consider Option 3 (Nx/Lerna)
- **If build coordination becomes complex** → Consider Option 2 (Project References)
- **If development workflow is too slow** → Optimize or migrate

## Implementation Plan for Option 1

### Step 1: Set up shared package build
```bash
cd shared/
# Configure package.json for publishing
# Set up build process (TypeScript → dist/)
# Configure exports and types
```

### Step 2: Revert duplication in apps
```bash
# Remove duplicated components from apps/
# Update imports to use package name
# Install shared package as dependency
```

### Step 3: Development workflow
```bash
# Shared component changes:
cd shared/ && npm run build
cd ../apps/PREZadmin && npm update shared-components

# Or use watch mode for development
cd shared/ && npm run build:watch
```

## Success Criteria

1. ✅ Both PREZadmin and pageAuthor build successfully
2. ✅ No component duplication
3. ✅ Clear development workflow documented
4. ✅ Type safety maintained across packages
5. ✅ Easy to add new shared components
6. ✅ Migration path to other options preserved

## Future Considerations

- **Performance:** Monitor build times as shared package grows
- **Versioning:** Consider semantic versioning for shared components
- **Testing:** Shared components should have their own test suite
- **Documentation:** Component documentation and storybook
- **Migration:** Keep Option 3 (monorepo tools) as future possibility

## Session Documentation

**Date:** 2025-09-16
**Session:** 250916_refactor_page_author
**Status:** Architecture documented, ready for implementation
**Next:** Implement Option 1 - Build shared as NPM package