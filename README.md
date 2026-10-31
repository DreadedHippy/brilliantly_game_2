# Brilliantly

A 2D, African-inspired browser adventure with a painted world map and a playable Stage 1-1. The first trail follows the supplied winding layout through a freely explorable savanna grove, low pass and rising ridge, with the generated main character and seated mentor Arojinle. The world map retains its compass, floating level markers, zoom and pan. Locations remain fictional.

## Stack

| Technology          | Purpose                                                |
| ------------------- | ------------------------------------------------------ |
| TypeScript          | Strictly typed game code and content definitions       |
| Phaser 4.2.1        | Canvas/WebGL rendering, scenes, input, Arcade Physics  |
| Vite                | Development server, hot updates, production bundling   |
| Semantic HTML + CSS | Responsive, keyboard-operable game menus               |
| Vitest              | Battle and progression rule tests outside the renderer |
| Playwright          | Browser tests for the complete starter journey         |
| ESLint + Prettier   | Code checks and consistent formatting                  |

No backend or UI framework is required for this foundation. A backend can be introduced when account, cloud-save, or multiplayer requirements exist.

## Run locally

Install **Node.js 24 LTS** with npm (Node 22.13+ is also supported). Node must be on your terminal's PATH.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://127.0.0.1:5173`. Use `npm install` when intentionally changing dependency versions; commit the resulting lockfile.

Enter **River crossing** on the world map to play **Stage 1-1**. Review the character animations separately at `/assets/sprites/main-hero/preview.html` and `/assets/sprites/tutorial-elder/preview.html`. Source art, transparent sprites, animation metadata and their existing QA notes are retained in `public/assets/sprites/`.

```sh
npm run check          # formatting, lint, unit tests, types, production build
npm run format         # apply formatting
npm run test:watch     # unit tests while developing
npx playwright install chromium
npm run test:e2e       # starts its own local development server
npm run preview       # serve dist/ after a build
```

## Starter loop

1. Select **River crossing** on the world map. Scroll or pinch to zoom, drag to pan, or use the map's **+ / − / Reset** controls. With the map focused, use arrow keys to pan, **+ / −** to zoom, and **Home** to reset. Zoom is bounded to 100–300% and panning stays inside the terrain.
2. In Stage 1-1, use **WASD / arrow keys**, or **click / tap the terrain**, to move. Hold **Shift** to run; narrow and touch screens also have directional buttons and a **Run** toggle.
3. Meet the seated mentor near the start, then follow the winding trail. Walk freely across the grass or follow the road. Taps travel directly when clear and detour around solid trunks, rocks, signs, jars and Arojinle. Level edges keep the character inside the world.
4. The camera follows at a fixed 115% zoom, stays inside the level and ignores wheel, pinch and zoom keys. World-map camera controls are removed while the level is active.
5. Reach the ridge at the end, or choose **Return to map** at any time. The four encounter locations are reserved; NPC dialogue, combat and the Stage 1-2 transition are inactive until the next development step.

Movement applies while the game area or its movement controls have focus. Leaving focus, changing tabs, or cancelling a touch stops movement. Trail progress resets on re-entry; no save system is implemented yet. Legacy battle rules and prototype scenes remain isolated for later development and unit testing, and Stage 1-1 does not trigger them or unlock subsequent destinations.

## Project layout

```text
src/
  main.ts                 Mount UI and start the engine
  style.css               Shared responsive UI styles
  game/
    createGame.ts         Phaser configuration and scene registration
    theme.ts              Shared palette consumed by CSS and Phaser
    data/levels.ts        Encounter definitions
    data/worldMap.ts      Cached adapter for the global map index
    data/stageOne.ts      Canonical Stage 1-1 layout adapter
    state.ts              Session progress
    scenes/               Boot, world map, exploration, battle, placeholder art
    systems/battle.ts     Pure turn resolution, independent of Phaser
    systems/mapView.ts    Bounded map pan/zoom math shared by rendering layers
    systems/trail.ts      Road geometry, progress projection and camera math
    systems/worldMovement.ts  Free movement, bounds, footprints and tap routing
    systems/actorVisibility.ts  Alpha-tested character cue behind tree canopies
  ui/shell.ts             DOM menus, health meters, focus, announcements
  ui/worldMap.ts          Responsive map markers, compass, and route overlay
  ui/mapNavigation.ts     Mouse, touch, and keyboard map navigation
public/assets/maps/       Generated terrain art and world_map_codex.json index
public/assets/maps/stage-1-1/  Level layout, composed terrain, props and navigation QA
tests/unit/               Battle and progression tests
tests/e2e/                Real-browser starter journey checks
```

Scenes own rendering and input. Content lives in `data/`. Rules live in `systems/` and accept explicit state. HTML menus call into scenes; scene transitions reset temporary state in `init()`. Keep this boundary when adding inventory, abilities, dialogue, or quests.

## Next development steps

- Define a specific African setting, cultural references, characters, and art direction with appropriate research and review.
- Develop Arojinle's tutorial and the four Stage 1-1 encounter sequences; then connect the Stage 1-2 exit.
- Expand the battle model with party members, abilities, status effects, and turn order.
- Add versioned save data and settings once the progression model is established.

`DESIGN.md` records the initial visual direction and runtime ownership. Static production output is generated in `dist/`; Vite's relative base supports hosting under a subdirectory. Nothing is deployed by this scaffold.

The hero now has front/down and back/up walking, with a matching neutral standing pose for each direction. Vertical running reuses those walk poses at a faster playback rate. Preview the new set at `/assets/sprites/main-hero/directions/preview.html`; its source images, prompts, metadata and exact diagnostics are included alongside the PNGs. The original side-view bundle is retained.
