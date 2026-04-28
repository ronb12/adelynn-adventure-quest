# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Artifacts

- **3d-game** (`artifacts/3d-game`) — "Adelynn's Adventure Quest: The Shattered Crown", a Zelda-style top-down 3D action-adventure built with React Three Fiber, drei, and zustand. Features: three-area world (field/forest/desert), multiple enemy types with AI behaviors, score/combo/timer system, lore stones, sprint/stamina system, weapon variety, shop, NPCs, and a global leaderboard backed by PostgreSQL via the API server.
- **api-server** (`artifacts/api-server`) — Express 5 REST API. Provides `/api/leaderboard` (GET top 20, POST new score). The 3d-game Vite dev server proxies `/api` to this server on port 8080. DB schema at `lib/db/src/schema/leaderboard.ts`.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
