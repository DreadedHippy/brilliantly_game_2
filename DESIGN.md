---
version: alpha
name: Brilliantly
description: An African-inspired browser adventure with a quiet indigo journey interface.
colors:
  ink: '#202b47'
  surface: '#2b3855'
  text: '#f5edda'
  muted: '#bac6cf'
  gold: '#edc779'
  river: '#74b7b5'
  border: '#526078'
  land: '#3b5362'
typography:
  sans:
    fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif"
  display:
    fontFamily: "'Palatino Linotype', Palatino, Georgia, serif"
rounded:
  DEFAULT: 8px
  control: 5px
spacing:
  panel: 24px
  page-max: 1440px
components:
  button: {}
  destination: {}
  health-meter: {}
---

## Overview

The primary job is to select a destination, explore, and take a battle turn. The surface is a game interface, intended first for desktop browsers with responsive touch menus. English is the initial UI language; the brief does not establish a target country or a particular African culture.

The home map is a smooth, painted 2D landscape of fictional West African-inspired riverlands, green highlands, and copper-colored escarpments, with baobab silhouettes and small earthen courtyard settlements. Rich natural terrain sits within the existing quiet indigo interface. A curved gold route connects the original encounter positions, and a separate compass rose sits at the bottom right. This is an invented adventure region, not a geographic or historical claim. Stage 1-1 uses image-generated savanna ground, an ochre winding footpath, baobabs, acacias, rocks and woven camp props, together with the generated hero and seated mentor. The legacy exploration scene remains isolated; the battle scene now serves the masquerade in Stage 1-1 encounter 1.

Runtime ownership: `src/game/theme.ts` owns the palette. `src/main.ts` adapts its entries to `--color-*` CSS variables, and Phaser consumes the same palette through `color()`. This document mirrors the accepted values. Typography, geometry, and responsive rules are owned by `src/style.css`; update this document when changing durable choices.

## Mentor lesson

`src/ui/mentorLesson.ts` owns the manual seven-screen Arojinle carousel and native modal dialog behavior; `src/game/data/mentorLessons.ts` owns stable lesson IDs and English copy. Existing indigo, gold, text and river focus tokens and primary/secondary controls remain canonical. The seated mentor portrait anchors the left column on desktop, with one lesson and a gold rule reminder alongside it; mobile stacks the portrait above the copy. The native modal top layer makes the background inert and contains focus. Opening focuses the lesson heading; closing or Escape restores the trigger; the final Practice with Arojinle action closes the modal before starting guided practice. Arrow keys, Home/End, Back/Next and labelled step buttons navigate without auto-advance. Closing is harmless and reopening starts at lesson one; no completion gate or persistence is implied. Stage 1-1 owns proximity, the E/tap/Talk entry points and movement/input suspension; shutdown removes the dialog and listeners. The carousel teaches the current blade, shieldless defense, skill costs and timed-trivia rules. Verify the full lesson, interruption/replay, focus, movement suspension and mobile overflow in `tests/e2e/mentor-lesson.spec.ts`.

## Colors

Ink is the page/world base; surface separates the journey panel. Text and muted are readable foregrounds. Gold marks route nodes and primary actions. River indicates focus and supporting scenery. Border separates surfaces. Land is an illustration-only fill, never a text surface without a contrast check. Initial theme is dark; forced colors preserve system control borders and scrollbars.

## Typography

Palatino headings provide the atlas character; Trebuchet and Segoe UI keep controls readable. Local system fonts avoid network-dependent font swaps. Body text uses 1.5 line height; headings use 1.14. Control text is sentence case; small section eyebrows use tracked uppercase. Additional locales will need font and content review.

## Layout

The canvas uses a 960 by 540 logical coordinate space, scaled to its 16:9 frame. The generated 1672 by 941 backdrop uses uniform cover scaling, with less than one logical pixel cropped at the sides; it is never stretched. HTML markers and the SVG route share this logical viewport, with node coordinates owned by `public/assets/maps/world_map_codex.json`. At widths above 850px, the 300px controls panel sits beside the world. Below that breakpoint the panel stacks underneath. The document owns scrolling; the canvas owns pointer movement only. Menus wrap and remain reachable on narrow devices. The page max width is 1440px and panel spacing is 24px.

The home map supports 100–300% zoom. Wheel zoom anchors to the cursor, pinch zoom anchors to its moving midpoint, and dragging pans within the fitted terrain bounds. `src/game/systems/mapView.ts` owns the logical view transform; `src/ui/mapNavigation.ts` applies it to the HTML route/marker layer and the Phaser camera together. Input deltas are measured in logical viewport units, independent of frame rate and CSS resize. The compass, title, and zoom/reset controls stay fixed. Returning to the map starts at its fitted view. Arrow keys pan, plus/minus zoom, and Home resets while the map is focused. Pointer capture keeps drags working outside the viewport; a drag never activates a level. Keyboard focus reveals offscreen markers, and scene shutdown removes all gesture handlers.

## Elevation & Depth

Use tonal planes and borders for the shell. On the map, level medallions use ground shadows and a gold halo to separate interactive destinations from the painted terrain. Hover and focus lift the medallion and label together. Illustration ellipses in exploration and battle indicate physical ground, separate from interface depth.

## Shapes

Stage 1-1 follows the user's winding outline in a 3600×1440 world. `public/assets/maps/stage-1-1/layout.json` owns the road controls, stage actors, encounter positions, exit and fixed 115% camera zoom. The runtime and terrain compositor sample the same centre line; `map-bundle.json` contains the full playable region and prop/NPC foot obstacles for navigation validation; its road polygon is used for painting, not movement limits. Source art is uniformly scaled and tiled, with no stretched sprites or scenery. Props and characters sort by their ground anchors. Only the character's foot footprint collides; the seated mentor has a separate ground obstacle. The road is visual guidance. Free movement covers the level, bounded only by world edges and solid ground footprints. A cached grid supplies smoothed tap detours around objects; clear taps move directly across grass.

The stage camera follows with a deadzone, look-ahead, exponential time-based smoothing and world-edge clamping. It exposes no level zoom or manual camera pan. World-map zoom and pan remain separate. `src/ui/shell.ts` owns stage loading, exploration, progress and retry states. `src/ui/stageControls.ts` owns the native directional buttons and run toggle shown on touch and narrow screens, with 44px targets. Shared theme colours and existing button/focus styles remain canonical. Arojinle teaches nearby; encounter 1 is playable, while encounters 2?4 and the Stage 1-2 transition remain inactive.

Use 8px rounding on the game frame and 5px on controls. Circles denote map nodes and an encounter radius; these are gameplay indicators. Do not reuse them as unexplained badges.

## Components

Native buttons in `src/ui/shell.ts` own sidebar actions; `src/ui/worldMap.ts` owns equivalent map marker buttons, the route overlay, and the compass. Gold medallions indicate available destinations, teal marks completion, and muted lock icons mark unavailable levels. Locked levels cannot start encounters. Hovering or focusing a sidebar destination emphasizes the corresponding map marker. Map labels use dark backing for readability over terrain. Outlined secondary buttons and destination entries share focus, hover, disabled, and pressed behavior from `src/style.css`. Disabled locations explain their unlock condition in text.

Native meters pair with health labels and numeric values. `#announcement` owns polite status feedback. Scene changes focus the new panel heading or exploration surface; battle actions restore action focus after rendering. The mentor lesson uses the shared native modal described above. No network mutations, forms or loading overlays are part of this scaffold.

Scrollbar baseline is global, uses border on ink with muted hover and gold active, and respects forced colors. Map hover/focus uses a 220ms feedback transition and a gentle 1.8s float cycle. Reduced motion disables floating and transitions while retaining the glow and visible keyboard focus. The map index also records the exact generation prompt, provenance, asset dimensions, and region bounds. Game exploration remains spatial and is not yet a complete screen-reader-accessible gameplay implementation.

## Do's and Don'ts

- Keep rendering, game rules, data, and HTML interface ownership separate.
- Give every new scene a keyboard and pointer navigation path.
- Research the chosen setting before creating culturally specific assets.
- Do not introduce a second palette or duplicate menu behavior inside canvas controls.

Directional locomotion uses generated front/down and back/up sheets with eight walk poses and a ninth neutral pose. Direction selection follows the dominant travel axis with hysteresis; stop keeps the last facing. Both share the established 384px frame, [192,320] root and 96px body. Vertical running accelerates those walking frames. `actorVisibility.ts` caches actual image alpha and shows a faint gold actor-shaped cue when an opaque foreground tree pixel covers a visible actor pixel. Tree art never fades. The corrected mentor name is owned by `layout.json` as Arojinle.

## Encounter-one battle

`src/game/systems/battleFeedback.ts` owns subtle action presentation: a 16px melee lunge, 3-degree defensive brace, affinity-colored cast cue, 13px enemy response and 7px hit recoil with a single soft alpha dip. Actor scale and artwork aspect ratios stay fixed. Feedback is sequenced independently of the pure combat resolver; commands are briefly disabled with `aria-busy` and a turn-phase message, while Return to map remains available. Only valid turns animate, and killing hits never animate an enemy response. Scene shutdown resolves pending presentation promises, removes transient effects and prevents stale UI updates. Reduced motion skips these cues. Arojinle's tutorial portrait has one small greeting tilt on opening, also disabled by reduced motion.

`src/ui/battleMeters.ts` owns the 420ms eased HP/SP interpolation. It captures currently displayed values before HUD replacement, animates only changed meters, and lands on the exact bounded target. Resource labels and the combat model use final values; the interpolated native meter value is presentation only. Detached meters stop updating on the next animation frame, and reduced motion snaps to the target. Browser checks sample rendered actor positions and intermediate meter values, verify one accepted turn under repeated input, and exercise scene exit and reduced motion.

Starter spell casts use a short 180ms wind-up, a 340ms visible projectile and a larger local impact ring with six fading fragments. Fire uses a glowing core and ember trail; Storm uses a bright zigzag bolt with a cyan halo; Wind uses three sweeping rings; Earth uses three rotating gold-edged stone shards. These are transient Phaser effects using the shared palette, with a 34px cast ring and 36px impact ring. Actor artwork is never stretched, and no camera shake or screen flash is added. Reduced motion skips the entire sequence; scene-exit cleanup owns all projectile children and impact fragments.

`src/game/data/combat.ts` owns starting stats, the reference-based level-one iron blade, the sixteen-spell catalogue, four starter IDs and trivia tuning. `battle.ts` owns immutable turn resolution and SP validation. `BattleScene.ts` owns generated actor loading, scene-local trivia deadlines and timer cleanup. `shell.ts` owns scene headings and delegates battle presentation to `src/ui/battleInterface.ts`. That component owns split status plates anchored to the battlefield and the bottom command box: Fight, Spells, Defend and Trivia. Spells opens a four-move submenu with affinity, base damage and SP costs; Back and Escape return without spending a turn. Arrow keys, Home/End and native Tab navigate enabled commands. Selecting a move returns to the root menu after turn resolution. The hero stands lower left and the enemy upper right on ground ellipses, using existing generated art. Status cards use cream plates with indigo text, gold framing and river HP/gold SP meters. A viewport-aware single-column battle frame replaces the exploration sidebar; the bottom prompt and command grid sit alongside each other on desktop and stack on narrow displays. Mobile framing keeps the enemy above the hero status plate. Trivia answers occupy the same command box, retaining their deadline and explicit Skip action. Phaser refreshes its FIT scale after battle layout changes. Leaving removes the status overlay and restores the exploration layout. The native mentor dialog remains the top-layer overlay. Encounter victory records only encounter 1 in session state, leaving full-stage progression locked. Starting balance and explicit limits are recorded in COMBAT_DESIGN.md.

## Guided mentor practice

`src/ui/practiceSpotlight.ts` owns a single decorative, non-blocking practice spotlight in the global `--layer-practice-guide` layer (20), below the browser's native modal top layer. A fixed transparent cutout with a gold border leaves the real required button bright and dims its surroundings. The generated transparent hand sprite at `public/assets/ui/tutorial-finger.png` moves back and forth by 7px over an 850ms alternating cycle; reduced motion keeps it still. The cursor preserves image aspect ratio. Focus and hover can move the spotlight between valid spell choices; Back and Leave practice remain reachable. Trivia highlights the entire question and answers without revealing which answer is correct. The spotlight hides during turn feedback and is removed on completion or scene exit. Scroll, resize and DOM changes reposition it with batched animation-frame work; observers, event listeners and queued frames are disposed together. The overlay never intercepts clicks or adds focus stops, and is hidden from assistive technology because existing instructions and native buttons remain authoritative. The hand's exact prompt and image-generation provenance are stored beside the asset.

The carousel keeps its header and navigation footer visible while long lesson content scrolls inside the body. Each slide starts at the top of that body; seven 44px navigation targets fit on common mobile widths or wrap rather than overflowing.

`src/game/data/mentorPractice.ts` owns the four ordered prompts, Arojinle practice stats and action-gate predicate. `BattleScene.ts` reuses combat and animation presentation in an explicit practice mode, with the elder atlas and dynamic opponent labels. The scene validates requested actions as well as disabling unavailable commands; only a valid action advances the step. Practice completes after a correct trivia response rather than an HP knockout. Quiz retries have no enemy damage, and only practice uses that exception. It does not write encounter completion or world progression. `battleInterface.ts` owns the highlighted available command, step counter, instruction association, Leave practice and completion states. `mentorLesson.ts` starts this scene from the final carousel action after the native dialog closes, preventing modal focus restoration from stealing battle focus. The seventh navigation marker wraps safely on narrow screens. Tests cover affinities, modal handoff, command bypass attempts, all four actions, retry/expiry, SP recovery, completion, leaving mid-feedback and replay.
