# Repository Guide for Agents

This file documents build/lint/test commands and code style conventions observed
in this repo. Follow it to keep changes consistent and safe.

## Repo Scope
- Primary app lives in `fortune-app/` (this file is in that root).
- Run commands from `fortune-app/` unless stated otherwise.

## Quick Facts
- Framework: Next.js (App Router) with TypeScript
- Styling: Tailwind CSS + `app/globals.css` utilities
- Linting: ESLint (flat config via `eslint.config.mjs`)
- Database: Prisma (PostgreSQL)
- Animations: framer-motion in client components

## Commands
### Install
- `npm install`

### Dev Server
- `npm run dev`

### Build / Start
- `npm run build`
- `npm run start` (requires build output)

### Lint
- `npm run lint` (runs `eslint .`)
- Single file/folder: `npx eslint app/api/fortune/route.ts` or `npx eslint app/`

### Tests
- No test runner configured in `package.json`.
- Ad-hoc scripts exist: `node test_api.mjs`, `node test_google.mjs`, etc.
  - These scripts are not CI tests and may contain hardcoded credentials.
- If you add tests, document the commands here and in `package.json`.

### Database (Local)
- `docker compose up -d` (uses `docker-compose.yml` for Postgres)

## Project Structure
- `app/` Next.js App Router routes and pages
- `app/api/**/route.ts` API route handlers
- `app/components/` UI components
- `lib/` shared utilities (auth, prisma, bazi)
- `prisma/` Prisma schema and migrations

## TypeScript / Tooling
- TypeScript `strict` is enabled (`tsconfig.json`).
- Path alias: `@/*` resolves to repo root.
- `moduleResolution` is `bundler` and `target` is `ES2017`.
- Prefer `.ts`/`.tsx` for new code.

## Imports
- Order imports: external libs, then internal modules.
- Use the `@/` alias for internal paths when possible.
- Type-only imports use the `type` keyword in import lists.

## Formatting
- TS/TSX files use double quotes and semicolons.
- Indentation is 2 spaces.
- Trailing commas are used in multiline objects/arrays.
- JS config files follow their local style (some use single quotes).

## Naming Conventions
- Components: `PascalCase` (e.g., `FortuneCard`).
- Files in `app/components`: `PascalCase.tsx`.
- Functions: `camelCase`.
- Constants: `UPPER_SNAKE_CASE`.
- Types/Interfaces: `PascalCase`.
- HTTP handlers: `GET`, `POST`, `PUT`, etc.

## React / Next.js Patterns
- App Router conventions: `app/layout.tsx`, `app/page.tsx`.
- Client components start with `"use client"` and include hooks.
- Server components avoid browser APIs and hooks.
- Prefer function components with typed props interfaces.

## File Conventions
- API handlers stay in `app/api/**/route.ts`.
- Route pages are `page.tsx`; layouts are `layout.tsx`.
- Shared logic belongs in `lib/`.
- Global styles belong in `app/globals.css`.

## State & Data Flow
- Use React hooks (`useState`, `useEffect`, `useCallback`, `useMemo`).
- Derived values are computed locally instead of extra state.
- Client storage uses `localStorage` when needed; clear on logout.

## API Route Conventions
- Export HTTP verb functions (`GET`, `POST`, `PUT`).
- Use `NextRequest`/`NextResponse` for handlers.
- Validate inputs early; return JSON + HTTP status.
- Wrap risky operations in `try/catch` and log with context.
- Avoid empty catch blocks; return safe error messages.

## Error Handling
- Server routes log with `console.error("<Context>:", error)`.
- Client routes set error state and show friendly messages.
- Do not swallow errors silently.

## Tailwind / Styling
- Tailwind config defines custom colors: `primary`, `secondary`, `accent`, `surface`.
- Shared utility classes live in `app/globals.css` (e.g., `glass`, `card`).
- Prefer Tailwind utility classes over new CSS.
- Keep className strings readable; multiline is common.

## Fonts & Theme
- Fonts are configured via `next/font/google` in `app/layout.tsx`.
- CSS variables `--font-space-grotesk` and `--font-inter` are used in Tailwind.
- UI copy includes non-English text; keep locale consistent.

## Prisma / Database
- Prisma client is cached in `lib/prisma.ts` (use the exported `prisma`).
- Schema is in `prisma/schema.prisma` (PostgreSQL).
- `DATABASE_URL` is required for Prisma.
- Prisma CLI is available via `npx prisma` (no scripts defined).

## Auth / Sessions
- JWT helpers live in `lib/auth.ts` using `jose`.
- Cookie name: `fortune_session`.
- Use `setSessionCookie` / `clearSessionCookie` helpers.
- `AUTH_SECRET` is required for signing tokens.

## External Services
- Fortune generation uses Google Gemini via `GOOGLE_API_KEY`.
- Avoid hardcoding API keys in code or test scripts.

## Environment Files
- `.env` and `.env.local` exist; do not commit real secrets.
- `.env.example` documents required env vars for local dev.
- Example env files contain sensitive placeholders; replace locally.

## Generated / Vendor Files
- Do not edit `.next/` or `node_modules/`.
- Keep `package-lock.json` in sync with dependencies.

## Manual QA (Common Flows)
- Load `/` and generate a fortune.
- Register and login via `/register` and `/login`.
- Confirm profile read/write via `/profile` and `/api/profile`.

## Cursor / Copilot Rules
- No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md` found.

## Suggested Agent Workflow
- Read relevant files before editing.
- Keep changes minimal and scoped to the request.
- Avoid refactors when fixing bugs.
- Run `npm run lint` after modifying TS/TSX or API routes.
