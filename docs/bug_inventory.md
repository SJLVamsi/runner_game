# Bug Inventory: *Leela: Chronicles of Bharat*

This document tracks all discovered runtime, security, performance, and rendering bugs identified during the architectural and codebase review.

---

## Bug Index

* **BUG-001 [P0 - Critical]:** Shared Particle Geometry Disposed Prematurely
* **BUG-002 [P1 - High]:** Directory Exposure via Express Static Root
* **BUG-003 [P1 - High]:** Leaderboard Score Injection Vulnerability
* **BUG-004 [P2 - Medium]:** Collision Detection Coordinate Lag (Stale Matrices)
* **BUG-005 [P2 - Medium]:** Multiple Active Audio Context Instances

---

## BUG-001: Shared Particle Geometry Disposed Prematurely
* **Severity:** P0 (Critical)
* **Description:** When individual particles finish their lifecycles, the particle system calls `p.mesh.geometry.dispose()`. Because all particles share a single static geometry instance (`this.particleGeo`), the first particle to die deallocates the shared buffer from GPU memory. This causes all subsequent particle renders to throw WebGL errors and disappear.
* **Root Cause:** Calling `dispose()` on a shared resource inside instance-level cleanup loops.
* **Reproduction Steps:**
  1. Start the game.
  2. Collect a Makhan Pot to trigger a particle burst.
  3. Wait 1 second for the first particle to fade out and die.
  4. Collect another pot; observe WebGL warnings in the developer console and the absence of further particle explosions.
* **Affected Files:** `public/src/effects.js`
* **Fix Applied:** Remove `p.mesh.geometry.dispose()` from the individual particle update tick. Retain disposal only for the global system cleanup during resets.
* **Validation Status:** Resolved.

---

## BUG-002: Directory Exposure via Express Static Root
* **Severity:** P1 (High)
* **Description:** The static file server serves the root folder `__dirname`. This exposes critical backend files (such as `server.js`, `package.json`, and the local database `scores.json`) to the public web browser requests.
* **Root Cause:** Express static path set to the root project folder.
* **Reproduction Steps:**
  1. Start the server: `npm start`.
  2. Navigate to `http://localhost:3000/server.js` or `http://localhost:3000/scores.json`.
  3. Observe that the server returns the raw code and database records.
* **Affected Files:** `server.js`
* **Fix Applied:** Relocate all client-facing files into a `public/` subdirectory and point the static directory server there.
* **Validation Status:** Resolved.

---

## BUG-003: Leaderboard Score Injection Vulnerability
* **Severity:** P1 (High)
* **Description:** The WebSocket socket endpoint `submit_score` accepts score data packages blindly. A user can inject arbitrarily high scores into the server via browser console scripts, ruining leaderboard integrity.
* **Root Cause:** Missing server-side verification of submitted scores against duration and collected item metrics.
* **Reproduction Steps:**
  1. Open the game in a web browser.
  2. In the console, execute: `game.socket.emit('submit_score', { name: 'Cheater', score: 999999, butter: 999 })`.
  3. Inspect `scoreboard.html`; the entry appears immediately at Rank 1.
* **Affected Files:** `server.js`
* **Fix Applied:** Implement duration validation checks. Reject scores that exceed the maximum mathematically possible points generated per second of run duration.
* **Validation Status:** Resolved.

---

## BUG-004: Collision Detection Coordinate Lag (Stale Matrices)
* **Severity:** P2 (Medium)
* **Description:** Collisions are evaluated immediately after updating entity coordinates, but before Three.js updates its global world matrices during rendering. This results in bounding boxes being calculated using coordinates from the *previous frame*, causing delayed collision alerts.
* **Root Cause:** Deferring `matrixWorld` updates to the rendering phase.
* **Reproduction Steps:**
  1. Run at high speeds (>20 units/sec).
  2. Perform a jump or slide near an obstacle edge.
  3. Observe that collisions sometimes trigger slightly *after* the mesh has visually cleared or collided with the obstacle.
* **Affected Files:** `public/src/main.js`, `public/src/obstacles.js`
* **Fix Applied:** Manually invoke `updateMatrixWorld(true)` on player and obstacle groups before bounding-box evaluation.
* **Validation Status:** Resolved.

---

## BUG-005: Multiple Active Audio Context Instances
* **Severity:** P2 (Medium)
* **Description:** Both the puzzle manager and the effects manager create separate `AudioContext` instances. This can exceed browser context counts, leak memory, and cause audio crackles.
* **Root Cause:** Multi-class audio context duplication.
* **Reproduction Steps:**
  1. Play the game, trigger multiple jumps and slides.
  2. Trigger the flute puzzle meditation.
  3. Notice occasional crackling or lag in sound synthesis.
* **Affected Files:** `public/src/puzzles.js`, `public/src/effects.js`, `public/src/main.js`
* **Fix Applied:** Centralize a single `AudioContext` inside `Game` and pass it to all sub-managers.
* **Validation Status:** Resolved.
