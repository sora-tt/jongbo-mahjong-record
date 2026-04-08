# CLAUDE.md - Jongbo Mahjong Record

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
cd frontend
npm run dev          # Start dev server (Turbopack)
npm run build        # Build
npm run lint:fix     # Run ESLint with auto-fix
npm run typecheck    # Run TypeScript type check
```

### Backend

```bash
cd backend
npm run emulator     # Start Firebase Emulator (run this first)
npm run dev:emulator # Start dev server connected to the Emulator
npm run seed         # Seed data into Firestore
npm run typecheck    # Run TypeScript type check
```

## Coding Conventions

### Basic Rules (enforced by ESLint + Prettier)

- Components must be defined as **arrow functions with `React.FC`**
- Import order: React/Next → third-party → internal modules (`@/`) → CSS
- Prettier: 2-space indent, LF line endings, trailing commas
- Prefix unused variables with `_`

### Frontend Design Patterns

- When creating a new page, refer to `src/app/home/page.tsx` as a template
- IDs use branded types (e.g. `LeagueIdType`); collections follow the `Record<ID, Item>` pattern
- API is not yet integrated. Data comes from mocks under `src/mocks/`. Update mocks when domain types change

### Backend Design Patterns

- Dependency direction: `src/http/routes/` → `src/application/services/` → `src/domain/` → `src/infrastructure/`
- Repositories: interfaces in `src/domain/repositories/`, implementations in `src/infrastructure/repositories/`

## Git Workflow

- Main branch: `develop` (**direct changes are forbidden**)
- Working branches: `ISSUE-XX-description` (always include the Issue number)
- Development flow: create Issue → create branch → develop → create PR → review → merge
- Write commit messages in English, keep them concise
- **Write code reviews in Japanese**
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

## Notes

- The frontend currently runs on mock data (API integration is pending)
- The backend has parts still under development
- Node.js version is managed via `.nvmrc`; run `nvm use` to match it
- Do not commit environment variable files (e.g. `.env`)
