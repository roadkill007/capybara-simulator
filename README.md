# Capybara Simulator 3D

> The most addictive 3D capybara game ever made — built entirely in the browser with React Three Fiber.

A full-featured open-world 3D browser game where you play as a capybara exploring biomes, collecting food, battling enemies, and competing in three distinct mini-games. Built as a pnpm monorepo with a React + Three.js frontend and a Node.js REST API backend.

---

## Table of Contents

- [What is this?](#what-is-this)
- [Features](#features)
  - [Core Gameplay](#core-gameplay)
  - [Mini-Games](#mini-games)
  - [Progression System](#progression-system)
  - [World & Visuals](#world--visuals)
  - [Mobile Support](#mobile-support)
- [Controls](#controls)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Running Locally](#installation--running-locally)
- [The CCO REST API](#the-cco-rest-api)
  - [Endpoints](#endpoints)
  - [Authentication](#authentication)
  - [CCO Object Shape](#cco-object-shape)
  - [Example Requests](#example-requests)
- [Environment Variables](#environment-variables)
- [Architecture Notes](#architecture-notes)
- [Known Limitations & Warnings](#known-limitations--warnings)
- [License](#license)

---

## What is this?

Capybara Simulator 3D is a browser-based 3D game built with React, TypeScript, and Three.js via `@react-three/fiber`. It runs entirely client-side with no downloads or plugins required.

The game places you in a 130×130 unit open world divided into four biomes (grassland, jungle, mountain, desert), each with unique flora and visual identity. You control a fully animated capybara that can walk, run, swim, jump, eat, sleep, and shoot projectiles. Enemy capybaras stalk and attack you. Three embedded mini-games (racing, soccer, and shooting range) offer structured competitive challenges with their own scoring.

A companion Node.js/Express REST API (the **CCO API**) allows external programs, scripts, or tools to push game-object state into the server, which can be queried independently of the game.

---

## Features

### Core Gameplay

- **Open world exploration** — 130×130 unit seamless world with no loading screens; full camera-follow third-person control with scroll-wheel zoom and pinch-to-zoom on mobile
- **Food collection** — Watermelons, grass bundles, and sugarcane scattered across the map; each type restores different amounts of hunger, happiness, and score
- **Swimming** — Three ponds at fixed world positions; entering water switches the capybara into swim mode (reduced speed, buoyancy physics, ripple effect)
- **Shooting** — Fire projectiles with `Space` or `F`; bullets travel in the facing direction and detect collisions with enemy capybaras
- **Jump mechanic** — Physics-based jump with gravity; counts toward the Jump King quest
- **Sleep action** — Press `Z` to rest; restores energy over time
- **Eat action** — Press `E` to eat; plays eating animation and triggers hunger restoration tick
- **Giant mode (Growth Potion)** — Collect a glowing purple potion to activate 20 seconds of giant form: 2.5× model scale, 1.6× speed, full invincibility, enemy-repelling aura, and an orange glow crown
- **Enemy capybaras** — AI enemies spawn around the player at increasing rate; they roam randomly, enter chase state within 18 units, and attack within 2 units; enemies are fully paused during any active mini-game
- **Friend capybaras** — Passive NPC capybaras wander the world and mirror player animations
- **Day/night cycle** — 1 real second = 1 game minute; sky, lighting, fog color, and ambient intensity all update continuously; sunrise/sunset golden-hour hues; full moonlit nights with a blue point light

### Mini-Games

All three mini-games are triggered by walking into their proximity zone. A prompt appears and you press `Enter` (or tap on mobile) to begin.

#### Car Race
- Oval track centered at world position `[10, 0, -38]` with semi-axes 30×18 units
- 3-2-1 animated countdown before racing begins
- Four AI kart opponents with color-coded bodies and name labels
- AI racers use parametric track-following with randomised speed variance
- Finishing position determines bonus score: 1st = +600, 2nd = +350, 3rd = +150, 4th+ = +50
- HUD shows lap progress and current position in real time

#### Soccer (5v5)
- 30×20m pitch at world position `[-42, 0, 2]`
- 1 player + 4 AI allies vs. 4 AI opponents
- Player pushes the ball by walking into it (physics impulse)
- AI players use state-machine logic: defend, pressure ball, support attack
- Goals detected when ball crosses the goal plane within a 7-unit-wide aperture
- Match lasts 2 minutes; score tracked for both teams
- Win bonus: +400 pts · Draw: +150 pts · Loss: +50 pts

#### Shooting Range
- 20×18m range at world position `[2, 0, 50]`
- 45-second timed challenge
- 5 lanes with color-coded pop-up targets (red, orange, yellow, green, blue)
- Targets animate upward from below the floor surface; ray-cast hit detection
- Score based on targets hit; bonus awarded at the end of the session
- Targets have individual cooldown/reappear timers per lane

### Progression System

| Stat | Description |
|---|---|
| Health | Damaged by enemies; game ends at 0 |
| Hunger | Depletes over time; collect food to restore |
| Energy | Consumed by running; restored by sleeping/idle |
| Happiness | Increases from swimming and food; decreases when idle |
| Score | Accumulated from food, kills, combos, and mini-games |
| XP / Level | XP earned from score events; levels up automatically |
| Combo | Consecutive food collects without taking damage multiply score |

**Quests** — Five built-in quests with XP/score rewards:

| Quest | Goal | Reward |
|---|---|---|
| Snack Time | Collect 5 food items | +200 pts |
| Capy Hunter | Defeat 3 enemy capybaras | +300 pts |
| Water Lover | Swim for 10 seconds | +150 pts |
| High Scorer | Reach a score of 1,000 | +500 pts |
| Jump King | Jump 10 times | +250 pts |

**Persistent stats** — Best score and total plays survive session reloads (stored in Zustand / local state; extend with localStorage to persist across browser sessions).

### World & Visuals

- **Four biomes** each with distinct flora:
  - Grassland (center) — trees, grass patches, flower beds, bushes
  - Jungle (NW quadrant) — tall jungle trees with drooping fronds, dense undergrowth
  - Mountain (NE quadrant) — granite ground overlay, dodecahedron boulders, cliff ridges
  - Desert/Savanna (SE/SW) — cacti, acacia trees, sandy ground overlay
- **Atmospheric sky** — `@react-three/drei` Sky component with Rayleigh/Mie scattering; sun position driven by time of day
- **Animated clouds** — Procedural cloud clusters that drift across the sky
- **Pond water** — Animated water surfaces with sine-wave displacement and environment-mapped ripple rings
- **Post-processing** — Bloom (luminance-threshold glow) and Vignette via `@react-three/postprocessing`
- **Exponential fog** — `FogExp2` whose color matches the sky at every time of day
- **Dynamic shadows** — Directional light shadow map (1024×1024) that follows the sun position
- **Particle effects** — Food collection, damage, and jump burst particles

### Mobile Support

- On-screen virtual joystick for movement (bottom-left)
- Action buttons: Run, Shoot, Eat, Sleep (bottom-right)
- Pinch-to-zoom camera
- Responsive HUD that adapts to smaller viewports

---

## Controls

| Input | Action |
|---|---|
| `W` / `↑` | Move forward |
| `S` / `↓` | Move backward |
| `A` / `←` | Turn left |
| `D` / `→` | Turn right |
| `Shift` | Run (costs energy) |
| `Space` or `F` | Shoot projectile |
| `E` | Eat animation |
| `Z` | Sleep / rest |
| Scroll wheel | Zoom camera in/out |
| `Enter` | Confirm mini-game prompt |
| Pinch (touch) | Zoom camera (mobile) |

---

## Tech Stack

### Frontend (`artifacts/capybara-simulator`)

| Package | Role |
|---|---|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Dev server & bundler |
| Three.js (`^0.183`) | 3D rendering engine |
| `@react-three/fiber` (`^9`) | React renderer for Three.js |
| `@react-three/drei` (`^10`) | Helpers: Sky, OrbitControls, etc. |
| `@react-three/postprocessing` | Bloom, Vignette post-FX |
| `@react-three/rapier` | Physics (available; used for ball physics) |
| Zustand (`^5`) | Global game state store |
| Tailwind CSS | HUD and menu styling |
| shadcn/ui (Radix UI) | UI component primitives |

### Backend (`artifacts/api-server`)

| Package | Role |
|---|---|
| Node.js 18+ | Runtime |
| Express 5 | HTTP server |
| TypeScript | Type safety |
| Pino / pino-http | Structured JSON logging |
| cors | Cross-origin request support |
| esbuild | Production bundler |

### Monorepo

| Tool | Role |
|---|---|
| pnpm workspaces | Monorepo package management |
| TypeScript project references | Cross-package type sharing |

---

## Project Structure

```
/
├── artifacts/
│   ├── capybara-simulator/          # React + R3F game frontend
│   │   ├── public/
│   │   │   └── models/              # GLB model assets (optional)
│   │   └── src/
│   │       ├── components/
│   │       │   ├── game/            # All 3D game components
│   │       │   │   ├── Capybara.tsx         # Player character (procedural)
│   │       │   │   ├── Enemies.tsx          # Enemy AI state machine
│   │       │   │   ├── World.tsx            # Biomes, flora, ground
│   │       │   │   ├── SkyBox.tsx           # Atmospheric sky + clouds
│   │       │   │   ├── GameScene.tsx        # Root Canvas + Suspense
│   │       │   │   ├── GameLoop.tsx         # Frame-tick: time, stats
│   │       │   │   ├── SoccerGame.tsx       # 5v5 soccer mini-game
│   │       │   │   ├── ShootingRange.tsx    # 45s target range
│   │       │   │   ├── RaceTrack.tsx        # Oval kart race
│   │       │   │   ├── ProximityZones.tsx   # Mini-game entry triggers
│   │       │   │   ├── Bullets.tsx          # Projectile system
│   │       │   │   ├── FriendCapybaras.tsx  # Passive NPC capybaras
│   │       │   │   ├── ParticleEffects.tsx  # VFX bursts
│   │       │   │   ├── RealisticWater.tsx   # Pond water surface
│   │       │   │   └── playerState.ts       # Shared mutable player ref
│   │       │   └── ui/              # HUD, menus, mobile controls
│   │       │       ├── HUD.tsx              # Stat bars, quest tracker
│   │       │       ├── MainMenu.tsx         # Start screen / death screen
│   │       │       ├── MobileControls.tsx   # Virtual joystick + buttons
│   │       │       └── RaceHUD.tsx          # Race position overlay
│   │       └── store/
│   │           └── gameStore.ts     # Zustand store (all game state)
│   │
│   └── api-server/                  # Express REST API
│       └── src/
│           ├── app.ts               # Express app setup
│           ├── index.ts             # Server entry point
│           └── routes/
│               ├── health.ts        # GET /api/health
│               └── cco.ts           # CCO CRUD endpoints
│
├── lib/                             # Shared TypeScript packages
├── pnpm-workspace.yaml
└── package.json
```

---

## Installation & Running Locally

### Prerequisites

- **Node.js** 18 or higher
- **pnpm** 9 or higher (`npm install -g pnpm`)

### Steps

```bash
# 1. Clone the repository
git clone <repo-url>
cd <repo-name>

# 2. Install all workspace dependencies
pnpm install

# 3. Start the game frontend (Vite dev server)
pnpm --filter @workspace/capybara-simulator run dev

# 4. Start the API server (in a separate terminal)
pnpm --filter @workspace/api-server run dev
```

The game will be available at `http://localhost:<PORT>` (Vite prints the exact port on startup).

The API server listens on the port specified by the `PORT` environment variable (default configured in the workspace).

### Production build

```bash
# Build the frontend
pnpm --filter @workspace/capybara-simulator run build

# Build and start the API server
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run start
```

---

## The CCO REST API

**CCO** stands for **Custom Connected Object** — a generic, schema-flexible store for named game objects that can be created and queried by external scripts, bots, or tooling independently of the game client.

Each CCO has a position, rotation, a state string, and an open-ended `data` map for any extra fields. The store is fully in-memory; data is lost on server restart.

### Base URL

```
http://localhost:<API_PORT>/api
```

When deployed on Replit the live base URL is:

```
https://ed8fa166-d518-4e34-b0f9-6d88f9414eba-00-22f7ozmjdx638.riker.replit.dev/api
```

### Endpoints

| Method | Path | Auth required | Description |
|---|---|---|---|
| `GET` | `/api/health` | No | Server health check |
| `GET` | `/api/cco` | No | List all CCO objects |
| `GET` | `/api/cco/:id` | No | Get a single CCO by ID |
| `POST` | `/api/cco/:id` | Yes | Create or update a CCO |
| `DELETE` | `/api/cco/:id` | Yes | Delete a single CCO |
| `DELETE` | `/api/cco` | Yes | Delete all CCOs |

### Authentication

Write and delete operations require an API key passed as the `x-api-key` request header.

```
x-api-key: <your_CCO_API_KEY>
```

If the `CCO_API_KEY` environment variable is not set on the server, authentication is skipped entirely (development mode).

### CCO Object Shape

```jsonc
{
  "id": "my-object",
  "position": { "x": 10.0, "y": 0.4, "z": -5.0 },
  "rotation": { "x": 0.0, "y": 1.57, "z": 0.0 },
  "state": "idle",
  "data": {
    // Any arbitrary JSON fields
    "health": 100,
    "tag": "npc"
  },
  "updatedAt": "2026-03-24T18:00:00.000Z"
}
```

All fields except `id` are optional on `POST` — missing fields fall back to existing values, or sensible defaults on first creation.

### Example Requests

**List all objects**
```bash
curl https://<base-url>/api/cco
```

**Get a specific object**
```bash
curl https://<base-url>/api/cco/my-capybara
```

**Create / update an object**
```bash
curl -X POST https://<base-url>/api/cco/my-capybara \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "position": { "x": 5, "y": 0, "z": 10 },
    "state": "chasing",
    "data": { "health": 80, "team": "red" }
  }'
```

**Delete one object**
```bash
curl -X DELETE https://<base-url>/api/cco/my-capybara \
  -H "x-api-key: YOUR_API_KEY"
```

**Clear all objects**
```bash
curl -X DELETE https://<base-url>/api/cco \
  -H "x-api-key: YOUR_API_KEY"
```

---

## Environment Variables

| Variable | Service | Required | Description |
|---|---|---|---|
| `PORT` | API server | Yes | Port the Express server binds to |
| `CCO_API_KEY` | API server | No | API key for write operations; if unset, auth is disabled |

---

## Architecture Notes

**State management** — All game state lives in a single Zustand store (`gameStore.ts`). The Three.js render loop (`useFrame`) reads from and writes to the store each frame. To avoid the React anti-pattern of calling `setState` inside another component's `setState` updater, enemy damage events are accumulated in a `useRef` during the frame pass and flushed after the enemy state update completes.

**Shared mutable player ref** — Because many 3D components need the player's current position and facing direction without subscribing to React state (which would cause re-renders), a module-level `playerState` object (`playerState.ts`) is written by `Capybara.tsx` each frame and read directly by `Enemies`, `SoccerGame`, `ShootingRange`, and `RaceTrack`.

**Procedural capybara model** — The player character is built from Three.js primitive geometries (capsule, box, sphere, cone) rather than a loaded GLB. This keeps the initial page load fast and avoids Suspense blocking the entire scene while a multi-megabyte model downloads.

**Deterministic world placement** — Trees, bushes, rocks, flowers, and all other flora use a seeded linear-congruential RNG with a minimum-distance rejection sampler (`spreadPlace`). This means the world layout is identical on every load without persisting any data.

**Mini-game isolation** — Enemy AI is fully suspended (`inMiniGame` flag) whenever any mini-game is in its active phase, preventing enemies from attacking the player while they are inside an arena.

**Post-processing** — Bloom and Vignette are applied via `@react-three/postprocessing` which uses EffectComposer under the hood. These are the only full-screen passes; no SSAO or other expensive effects are enabled.

---

## Known Limitations & Warnings

- **In-memory API storage** — The CCO API stores all objects in a JavaScript `Map`. Everything is lost when the server process restarts. For persistence, swap the in-memory store for a database.
- **No user authentication in the game** — There is no login system. Score and play counts are client-side only and reset on page refresh unless you add localStorage persistence to the Zustand store.
- **Single-player only** — The game has no networking or multiplayer. All AI is simulated locally in the browser.
- **Mobile performance** — The game runs well on mid-range phones but may lag on low-end devices. Reduce `fogDensity` and further cut flora counts in `World.tsx` if needed.
- **WebGL required** — The game requires WebGL 2 support. Most modern browsers on desktop and mobile support this; very old devices or browsers with hardware acceleration disabled will show a fallback message.
- **Physics are approximate** — Gravity, jumping, and ball physics are hand-rolled (not a full physics engine) to keep the bundle size small. Jitter or tunnelling can occur at very high frame deltas.
- **Giant mode crown clip** — In Giant mode, the crown geometry may clip through low-hanging geometry or the ground on sloped terrain. This is cosmetic only.

---

## License

This project is released for personal and educational use. Third-party packages are subject to their own licenses (MIT, Apache-2.0, etc.) as listed in each workspace `package.json`.

The capybara concept is inspired by the world's most beloved semi-aquatic rodent. No actual capybaras were harmed in the making of this game.
