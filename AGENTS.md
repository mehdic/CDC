# Repository Guidelines

## Project Structure & Module Organization

This is a Node.js/TypeScript monorepo using npm workspaces.

- `backend/`: Express/TypeORM API services (`backend/src/`), shared utilities (`backend/shared/`), Jest tests (`backend/tests/`, `backend/__tests__/`), DB migrations (`backend/migrations/`) and scripts.
- `web/`: Vite + React web app (`web/src/`), unit tests (Jest), and E2E tests (Playwright in `web/e2e/`).
- `mobile/`: React Native apps (role-based sub-apps like `mobile/doctor-app/`, `mobile/patient-app/`) plus shared code in `mobile/shared/`; E2E uses Detox.
- `packages/`: shared packages (e.g. API types in `packages/api-types/src/`).
- `infrastructure/`, `kubernetes/`, `docker-compose*.yml`: local/dev/prod deployment assets.

## Build, Test, and Development Commands

Run commands from the repo root unless noted.

- Install all workspaces: `npm install`
- Build everything: `npm run build`
- Run all tests: `npm test`
- Lint all workspaces: `npm run lint`
- Start locally:
  - Backend dev: `npm run dev:backend`
  - Web dev: `npm run dev:web`
  - Mobile dev: `npm run dev:mobile`
- Backend DB tooling: `npm run migrate:up` / `npm run migrate:down` / `npm run seed:dev`
- Docker (uses `infrastructure/docker/docker-compose.yml`): `npm run docker:up` / `npm run docker:logs` / `npm run docker:down`

## Coding Style & Naming Conventions

- TypeScript first; prefer explicit types over `any` (root ESLint blocks `any` in non-test code).
- Formatting: Prettier (`.prettierrc.json`) with 2-space indentation and single quotes.
- Linting: ESLint (root `.eslintrc.json` plus workspace overrides). Prefix intentionally-unused parameters/vars with `_`.
- Files: use `kebab-case` for folders and `PascalCase.tsx` for React components where applicable.

## Testing Guidelines

- Unit/integration: Jest (`backend`, `web`, `mobile`). Keep tests close to code (`__tests__/` or `*.test.ts(x)`).
- Web E2E: Playwright (`web/package.json` → `test:e2e`).
- Mobile E2E: Detox (`mobile/package.json` → `test:e2e:*`).
- Prefer deterministic tests (mock time/network); avoid real credentials and external calls.

## Commit & Pull Request Guidelines

- Commits follow Conventional Commits seen in history: `feat(scope): ...`, `fix(scope): ...`, `docs: ...`, often with a ticket like `T8-021` in the scope.
- PRs: include a short description, linked issue/ticket, test evidence (commands run), and screenshots/screen recordings for UI changes. Avoid committing secrets; use `*.env.example` files (`backend/.env.example`, `web/.env.example`, `mobile/.env.example`).

