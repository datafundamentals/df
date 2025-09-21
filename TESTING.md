# Testing Strategy

## Overview
This monorepo uses different testing approaches based on the type of code:

## UI Components & Applications
- **Framework**: Web Test Runner (WTR) + Web Dev Server (WDS)
- **Rationale**: Following Google Chrome team's approach from lit-starter kit
- **Browser Testing**: Chromium, Firefox, WebKit
- **Test Location**: `src/test/` directories
- **Commands**:
  - `pnpm test` - Run all tests (dev + prod modes)
  - `pnpm test:dev` - Development mode tests
  - `pnpm test:prod` - Production mode tests

## Storybook
- **Framework**: Vite-based testing (Storybook's built-in system)
- **Rationale**: Storybook has its own optimized testing ecosystem
- **Test Location**: `stories/` directories
- **Commands**:
  - `pnpm test` - Run Storybook tests
  - `pnpm dev` - Interactive testing via Storybook UI

## Utility Packages (future)
- **Framework**: WTR + WDS (same as UI components)
- **Rationale**: Consistency with main UI testing approach
- **Test Location**: `src/test/` directories when implemented

## Notes
- All tests run in actual browsers for maximum compatibility
- Production builds are tested to catch build-time issues
- Lit-specific testing patterns follow Google Chrome team standards