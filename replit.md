# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Artifacts

- **3d-game** (`artifacts/3d-game`) — "Adelynn's Adventure Quest: The Shattered Crown", a Zelda-style top-down 3D action-adventure built with React Three Fiber, drei, and zustand. Features: three-area world (field/forest/desert), multiple enemy types with AI behaviors, score/combo/timer system, lore stones, sprint/stamina system, **weapon discovery system** (13 hidden weapon altars across all areas — player starts with sword only and must explore to unlock each weapon, ALTTP-style), shop, NPCs, and a global leaderboard backed by PostgreSQL via the API server. Weapon placement: Field→Bow+Boomerang, Forest→Wand+Frost+Moonbow, Desert→Bomb+Shuriken+Flare, Boss→Shadow+Veil+Quake+Aura+Chain.
- **mobile-game** (`artifacts/mobile-game`) — "Adelynn's Adventure Quest: The Shattered Crown" Expo/React Native mobile port with FULL feature parity to the web game. React Three Fiber (native) + expo-gl for 3D rendering, Zustand, PanResponder joystick + 5-button action layout. Features: full Adelynn character model (hat/head/torso/arms/legs/boots/shield), 10 swords with detailed 3D SwordMesh + per-sword decorations (crystal/flame/thunder/frost/shadow/holy/viper/storm/dragon/cosmos), 13-weapon projectile system (bow/boomerang/wand/frost/moonbow/bomb/shuriken/flare/shadow/veil/quake/aura/chain), 14 NPCs with full dialogue overlay, shop UI (Zarko's Wares), 3 crystal shard chests (progression), armor system (blue/red tunic + damage reduction), heart piece collectibles, item fanfare popups, fairy fountains (full heal), weapon altars, 9 sword chests, 4 areas (field/forest/desert/boss), 8 enemy types + boss Malgrathak, 12 lore stones, score/combo/timer, AsyncStorage best-record persistence, area transitions, boss health bar, game over + victory screens.
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
