# DF NPM Info App

Wrapper shell for the npm info widget. Run the integration checks with:

```bash
pnpm --filter @df/df-npm-info-app test
```

The Playwright project mocks the npm registry via `page.route` so both ready and error branches of the widget and state store are covered. The `start:test` script compiles TypeScript before launching Vite on port 4173 for deterministic browser runs.
