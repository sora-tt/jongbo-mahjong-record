# Copilot Instructions for Mahjong Record App

## Project Overview

**Jumbo (雀望録)** is a mahjong score management web application built with Next.js and TypeScript. It allows users to create leagues, record match results, and track player statistics across multiple games.

- **Frontend**: Next.js 15.5.4, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js packages directory (`packages/api/`) with DDD architecture (under development)
- **Workspace**: Monorepo with shared API package

## Architecture

### Frontend Structure (`src/`)

```
src/
├── app/              # Next.js app directory (pages, layouts)
│   └── styles/       # Global CSS (Tailwind)
├── components/       # Reusable React components
│   ├── common/       # Layout components (Header, UI primitives)
│   ├── pages/        # Page-specific components
│   └── ui/           # UI components (buttons, inputs, layout utilities, etc.)
├── types/domain/     # TypeScript domain types (League, User, Match, etc.)
└── mocks/            # Mock data for development
```

### Backend Architecture (`packages/api/src/`)

Follows **Clean Architecture** / **Domain-Driven Design**:

- `controller/` - HTTP request handling & response formatting
- `core/application/` - Application services (input validation, orchestration)
- `core/domain/` - Pure business logic (entities, value objects, services)
- `core/domain/repository/` - Repository interfaces (abstractions)
- `infra/repository/` - Concrete repository implementations (e.g., Firestore)

Example domain model: `League` with aggregated member stats (`totalPoints`, `rank`, `numberOfEachOrder`).

## Key Conventions

### Component Pattern

All components are **functional components with arrow function syntax** (enforced by ESLint):

```tsx
export const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  return <div>{prop1}</div>;
};
```

### Custom Hooks Pattern

Page-level logic is extracted into hooks (`src/app/*/hooks/index.ts`). Hooks:

- Handle state management and mock data loading
- Return state + handler functions
- Use `"use client"` directive when consuming hooks

Example:

```tsx
// src/app/home/hooks/index.ts
export const useHome = () => {
  const user = userData1; // mock
  const leagues = leaguesData; // mock
  return { userId, userName, leagues, hasLeagues, error };
};

// src/app/home/page.tsx
export const Home: React.FC = () => {
  const { userId, leagues } = useHome();
  // ...
};
```

### Styling

- **Tailwind CSS** with Spacer utility component for consistent spacing/layout
- Color palette via Tailwind (e.g., `bg-brand-500`, `text-text-dark`)
- Spacer component: `<Spacer padding="medium" gap="small" display="flex">` provides margin, padding, gap, and layout

### Import Order (ESLint enforced)

1. React/Next.js imports
2. Third-party libraries
3. Internal imports (`@/components/**`, `@/types/**`, `@/mocks/**`)
4. CSS imports last

## Data Management

### Type Definitions

Located in `src/types/domain/`:

- `league.ts` - `League`, `LeagueMember`, `LeagueTitle`
- `user.ts` - `User`, `UserIdType`
- `match.ts` - Match records
- `color.ts` - Color enums used in UI
- `utils/app-date.ts` - Date utility type

All IDs are branded types: `LeagueIdType`, `UserIdType`, `RuleIdType`

### Mock Data

Located in `src/mocks/`:

- `league.ts` - `leaguesData`, `leagueData1` (Record<string, League>)
- `user.ts` - `userData1` (User)
- `league-member.ts` - `leagueMembersData`

Currently no API integration; replace mocks with API calls when backend is ready.

## Development Workflow

### Running the Application

```bash
npm install         # Install dependencies
npm run dev         # Start dev server (Turbopack)
npm run build       # Build with Turbopack
npm run lint        # ESLint check
npm run lint:fix    # Auto-fix lint issues
npm run typecheck   # TypeScript check
```

### Git Workflow

- Branch naming: Issue-based (e.g., `ISSUE-56-create-league`, `feature/ISSUE-58-create-individual-score-screen`)
- Pre-commit hooks in `.githooks/`
- See `docs/how-to-manage-our-development.md` for detailed Git guide

### Code Quality

- **ESLint** enforces:
  - Arrow function components only
  - Import ordering
  - Prettier formatting (2-space tabs, LF line endings, trailing commas)
  - React hooks rules
- **TypeScript** strict mode enabled
- Unused variables flagged unless prefixed with `_`

## Common Patterns

### Handling Multiple Selections (Record Pattern)

```tsx
// From useLeagueNew hook - using Record<ID, Item> for collections
const [addedMembers, setAddedMembers] = React.useState<
  Record<UserIdType, UserBase>
>({});

// Add: merge new item
setAddedMembers((prev) => ({ ...prev, [userId]: user }));

// Remove: destruct and delete
setAddedMembers((prev) => {
  const rest = { ...prev };
  delete rest[userId];
  return rest;
});

// Convert to array for API: Object.keys(addedMembers) as UserIdType[]
```

### Page Layout Template

```tsx
"use client";
import * as React from "react";
import Header from "@/components/common/container/header";
import { Spacer } from "@/components/common/ui/spacer";
import { usePageHook } from "./hooks";

export const PageComponent: React.FC = () => {
  const { data, handlers } = usePageHook();
  return (
    <Spacer className="min-h-screen">
      <Header />
      <Spacer padding="medium" gap="small">
        {/* content */}
      </Spacer>
    </Spacer>
  );
};
export default PageComponent;
```

## Troubleshooting & Notes

- **API Package**: `packages/api/` has empty controller/service files; backend is under active development
- **Mock Data**: All data flows through `src/mocks/`; update mocks first when changing domain types
- **TODOs**: Search codebase for "TODO" comments marking incomplete features (e.g., player selection refinements)
- **Environment**: Node.js version pinned in `.nvmrc`; use `nvm use` to sync

## Remarks

- When performing a code review, respond in Japanese.

## Key Files Reference

- Configuration: `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`
- Entry point: `src/app/layout.tsx`
- Example pages: `src/app/home/page.tsx`, `src/app/league/new/page.tsx`
- Reusable components: `src/components/common/ui/spacer/`, `src/components/ui/button/`
- API docs: `docs/swagger/index.html` (Swagger UI)
