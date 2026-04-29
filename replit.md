# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Artifacts

- **3d-game** (`artifacts/3d-game`) — "Adelynn's Adventure Quest: The Shattered Crown", a Zelda-style top-down 3D action-adventure built with React Three Fiber, drei, and zustand. Features: three-area world (field/forest/desert), multiple enemy types with AI behaviors, score/combo/timer system, lore stones, sprint/stamina system, **weapon discovery system** (13 hidden weapon altars across all areas — player starts with sword only and must explore to unlock each weapon, ALTTP-style), shop, NPCs, and a global leaderboard backed by PostgreSQL via the API server. Weapon placement: Field→Bow+Boomerang, Forest→Wand+Frost+Moonbow, Desert→Bomb+Shuriken+Flare, Boss→Shadow+Veil+Quake+Aura+Chain.
- **mobile-game** (`artifacts/mobile-game`) — "Adelynn's Adventure Quest: The Shattered Crown" Expo/React Native mobile port. Massively exceeds ALTTP in scope. React Three Fiber (native) + expo-gl + Zustand + PanResponder joystick.
  - **13 areas**: field, forest, desert, boss, cave, jungle, ice, volcano, sky, shadow, dungeon1 (Shadowmere Crypt), dungeon2 (Ashrock Forge), dungeon3 (Crystal Spire)
  - **21 enemy types**: slime, goblin, briarwolf, thornspitter, emberscorpion, voidwraith, bat, knight, boss, skeleton, lizardman, rockgolem, icewolf, lavabeast, crystalspider, thunderbird, shadowslime, cavedemon, jungletroll, frostphantom, volcanodemon — all with unique hand-crafted 3D mesh components
  - **3 special items**: Magic Mirror (field↔shadow warp), Speed Boots (+35% move speed), Hookshot — collected from glowing Item Altars in caves, ice, and dungeons
  - **Story chapter cards**: first-visit cinematic chapter title cards per area (13 chapters)
  - **Special items HUD strip**: live icons for collected Mirror/Boots/Hookshot + small key count
  - **Lore stones**: 3 per area × 13 areas = 39 total world-lore entries
  - **Sword chests**: 21 total across all areas + weapon altars
  - **Portal network**: fully connected world — field↔forest/desert/cave/sky, forest↔jungle, desert↔volcano, cave↔ice/dungeon1, jungle↔dungeon1, ice↔dungeon3, volcano↔dungeon2, sky↔shadow, shadow↔boss
  - **10 swords**, 13-weapon projectile system, 14 NPCs, shop, armor system, heart pieces, fairy fountains, boss health bar, score/combo/timer, AsyncStorage persistence
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
