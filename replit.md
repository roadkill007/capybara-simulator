# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

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

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── capybara-simulator/ # 3D Capybara Simulator game (React + Vite + Three.js)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Capybara Simulator 3D

A fully 3D browser game built with React Three Fiber (@react-three/fiber), Three.js, and Zustand.

### Features
- Open-world 3D environment with forest, pond, flowers, trees, rocks
- Playable capybara character with walking, running, swimming, eating, sleeping, happy animations
- Food collection system (watermelon, grass, sugarcane) with floating 3D items
- Friend capybaras that spawn based on happiness level
- Day/night cycle with dynamic sky, sun, moon, and stars
- Particle effects for actions (celebrate, swim splash, eat crumbs)
- Score system with combos, XP, and levels
- HUD with happiness/hunger/energy bars
- Main menu with best score tracking

### Controls
- WASD / Arrow keys: Move
- Shift: Run
- Space: Celebrate (happy bounce)
- E: Eat
- Z: Sleep
- Walk into the pond: Swim

### Key Files
- `src/store/gameStore.ts` — Zustand global game state
- `src/components/game/GameScene.tsx` — Canvas wrapper
- `src/components/game/Capybara.tsx` — Player character
- `src/components/game/World.tsx` — Environment, terrain, food items
- `src/components/game/SkyBox.tsx` — Dynamic sky and clouds
- `src/components/game/FriendCapybaras.tsx` — AI friend capybaras
- `src/components/game/ParticleEffects.tsx` — Particle system
- `src/components/ui/HUD.tsx` — In-game HUD overlay
- `src/components/ui/MainMenu.tsx` — Start screen

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes in `src/routes/`.

### `artifacts/capybara-simulator` (`@workspace/capybara-simulator`)

React + Vite + Three.js 3D game. No backend needed — purely frontend.
Dependencies: three, @react-three/fiber, @react-three/drei, zustand

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec and Orval config.

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client.
