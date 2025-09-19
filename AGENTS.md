# Repository Guidelines

## Project Structure & Module Organization
This pnpm/turbo monorepo organizes deliverables by workspace: `apps/` hosts runnable front ends (current focus `apps/lit-starter`), `packages/` contains shareable libraries such as `ui-lit`, `state`, `types`, and `utils`, and `services/` is reserved for backend services. Shared configuration files live at the repo root (`ts.config.base.json`, `turbo.json`). Application-level assets and docs for Lit starter reside under `apps/lit-starter/docs` and `docs-src`, while production bundles target `dist/` or `build/` depending on the package.

## Build, Test, and Development Commands
Install dependencies with `pnpm install`; use `pnpm --filter <workspace> install` if you only need one package. `pnpm dev` runs `turbo run dev --parallel` so each workspace handles its own development server (`apps/lit-starter` relies on `npm run serve`). `pnpm build`, `pnpm test`, and `pnpm lint` fan out via Turbo to every workspace; add `--filter apps/lit-starter` (or another package name) to scope the command. Clean builds with `pnpm clean`, which removes per-package caches in addition to `.turbo`. When iterating inside `apps/lit-starter`, the local scripts `pnpm --filter apps/lit-starter run test:watch` and `run lint:eslint` give faster feedback loops.

## Coding Style & Naming Conventions
TypeScript is standard across workspaces; prefer ES modules and keep shared types in `packages/types`. Import shared code via the `@df/...` path aliases mapped in `ts.config.base.json`. Prettier enforces 2-space indentation, single quotes, `arrowParens: "always"`, and no extra bracket spacing (`.prettierrc.json`). ESLint extends the TypeScript recommended stack and treats `any` as an error unless explicitly overridden; use leading underscores for intentionally unused parameters. Lit components follow PascalCase class names with kebab-case selectors (`MyElement` in `my-element.ts`); colocate store helpers under `src/stores/` to maintain discoverability.

## Testing Guidelines
`pnpm test` delegates to `@web/test-runner` for Lit components; the canonical spec lives in `apps/lit-starter/test/my-element_test.js`. Mirror that `_test` suffix and keep fixture helpers under `src/test/` when adding coverage. Run `pnpm --filter apps/lit-starter run test:prod` before shipping UI changes to verify the production build mode. Aim to exercise new observed DOM states and events, and include accessibility assertions via `@open-wc/testing` helpers where possible.

## Commit & Pull Request Guidelines
Recent history favors concise, sentence-case messages that describe intent ("Rationalize development scripts for monorepo architecture"); keep subjects under 72 characters and use the imperative mood when you can. Squash commits before merging unless a reviewer requests otherwise. Every PR should describe scope, list affected workspaces, reference related issues (e.g., "Fixes #123"), and link to any design docs. For UI-facing updates, attach screenshots or GIFs and note which `pnpm test` and `pnpm lint` runs passed. Ensure Turbo caches are rebuildable by running `pnpm clean && pnpm build` at least once before requesting review.

## Agent Workflow Notes
Prefer read-only inspection commands before mutating files; when automation must write artefacts, route changes through the root workspace so Turbo can detect them. Use `pnpm --filter <workspace> exec` to run workspace-specific CLIs (e.g., `lit-analyzer`) without polluting global installs. When introducing a new workspace, register it in `pnpm-workspace.yaml` and export its build artefacts under `dist/` to align with Turbo’s cache strategy.
