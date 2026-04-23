# Copilot Instructions - Jongbo Mahjong Record

## Project Overview

A web application for managing mahjong scores. Main features include league creation, match recording, and statistics tracking.
This is a monorepo with `frontend/` and `backend/` directories.

## Tech Stack

### Frontend (`frontend/`)

- Next.js 15.5.4 (App Router, Turbopack), React 19, TypeScript (strict)
- Tailwind CSS 4, ESLint + Prettier

### Backend (`backend/`)

- Hono (Node.js), Firebase Admin SDK (Firestore, Auth), TypeScript
- DDD / Clean Architecture

## Development Commands

### Frontend

```bash
# From the repository root
pnpm dev:frontend    # Start dev server (Turbopack)
pnpm build           # Build frontend
pnpm lint:fix        # Run ESLint with auto-fix
pnpm typecheck       # Run TypeScript type check

# Or from frontend/
cd frontend
pnpm dev             # Start dev server (Turbopack)
pnpm build           # Build
pnpm lint:fix        # Run ESLint with auto-fix
pnpm typecheck       # Run TypeScript type check
```

### Backend

```bash
# From the repository root
pnpm dev:backend     # Start backend dev server
pnpm typecheck       # Run TypeScript type check for all packages

# Or from backend/
cd backend
pnpm emulator        # Start Firebase Emulator (run this first)
pnpm dev:emulator    # Start dev server connected to the Emulator
pnpm seed            # Seed data into Firestore
pnpm typecheck       # Run TypeScript type check
```

## Coding Conventions

### Basic Rules (enforced by ESLint + Prettier)

- Components must be defined as **arrow functions**
- Using `React.FC` is recommended, but not mandatory
- Import order in the frontend must follow `frontend/eslint.config.mjs`: `builtin` → `external` (place `react` first and keep `next/**` grouped after it) → `internal` (`@/`) → `relative` → `type`; treat `**/*.css` as a separate group
- Prettier: 2-space indent, LF line endings, trailing commas
- Prefix unused function arguments with `_`

### Frontend Design Patterns

- Extract page-level logic into custom hooks under `src/app/*/hooks/index.ts`
- Hooks return state and handlers; page components focus on rendering
- When creating a new page, refer to `src/app/home/page.tsx` as a template
- IDs use branded types (e.g. `LeagueIdType`); collections follow the `Record<ID, Item>` pattern
- API integration is still ongoing, and some data currently comes from mocks under `src/mocks/`. Update mocks when domain types change

### Backend Design Patterns

- Dependency direction: `src/http/routes/` → `src/application/services/` → `src/domain/` → `src/infrastructure/`
- Repositories: interfaces in `src/domain/repositories/`, implementations in `src/infrastructure/repositories/`

## Git Workflow

- Default branch: `develop` (**direct changes are forbidden**)
  - All development must be done in separate branches created from `develop`
  - `main` branch is for releases only, should be same as production, and should not be used for development
- Working branches: `ISSUE-XX-description` (always include the Issue number)
- Development flow: create Issue → create branch → implement changes → create PR → review → merge into `develop`
- Write commit messages in English, keep them concise
- For details, see `docs/how-to-manage-our-development.md`

## Documentation Index

| File | Description |
|---|---|
| `docs/how-to-manage-our-development.md` | Git workflow guide |
| `docs/pull-request-template.md` | PR template |
| `docs/architecture.drawio` | Architecture diagram |
| `backend/docs/api-design.md` | API design document |
| `backend/docs/api-reference.md` | API reference |
| `backend/docs/auth-design.md` | Authentication design document |
| `backend/docs/firestore.yaml` | Firestore schema definition |
| `docs/swagger/` | Swagger UI |

## Code Review Guidelines

- **Write code reviews in Japanese**
- Leave not only comments, but also suggested code changes when possible to make it easier for the author to understand and apply the feedback
- Focus on code quality, readability, and adherence to conventions
- Provide constructive feedback and suggestions for improvement
- If you find a bug or potential issue, explain it clearly and suggest a fix
- For frontend reviews, also consider user experience and design consistency
- For backend reviews, also consider security, performance, and scalability implications
- Please try to finish review **only once**, avoid multiple rounds of review if possible
- If PR looks good to you, approve it and leave a positive comment to encourage the author

## Notes

- The frontend currently runs on mock data (API integration is pending)
- The backend has parts still under development
- Use `pnpm` for dependency management and script execution across the monorepo
- Node.js version is managed via `.nvmrc`; run `nvm use` to match it
- Do not commit environment variable files (e.g. `.env`)
