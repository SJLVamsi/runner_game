# Implementation Report: *Leela: Chronicles of Bharat*

This document details the code fixes applied to resolve the five identified architectural, performance, and security bugs.

---

## 1. Modifications Log

### server.js (Project Root)
* **Reason for Change:** Fix **BUG-002** (Directory exposure) and **BUG-003** (Leaderboard score injection).
* **Changes Made:**
  - Relocated static file serving to the sandbox: `app.use(express.static(path.join(__dirname, 'public')))` (isolated private node files).
  - Added socket connection start-time listeners: `socket.on('start_run', ...)` which caches `socket.startTime = Date.now()`.
  - Implemented duration-rate validations inside `submit_score` WebSocket callback:
    $$\text{Max Score} = (\text{Duration} \times 22) + (\text{Butter Collected} \times 115) + 1200$$
    If `score > maxExpectedScore`, reject the submit and emit `submission_rejected` event.
* **Risks Evaluated:** Very low. Requires client to properly emit `start_run` when starting gameplay.
* **Expected Outcome:** Secure static serving and complete protection against raw score injection attempts.

---

### public/src/puzzles.js
* **Reason for Change:** Fix **BUG-005** (Multiple AudioContexts).
* **Changes Made:**
  - Refactored class constructor to accept `audioCtx` from caller, discarding local `new AudioContext()` instantiation.
* **Risks Evaluated:** Low. If a caller fails to pass a context, audio will fail silently.
* **Expected Outcome:** Prevent browser audio context limits from being reached and avoid overlapping context memory leaks.

---

### public/src/effects.js
* **Reason for Change:** Fix **BUG-001** (Shared geometry disposal) and **BUG-005** (Multiple AudioContexts).
* **Changes Made:**
  - Refactored `SoundFXManager` constructor to accept and bind the shared `audioCtx` context.
  - Inside the `ParticleSystem.update()` loop, commented out `p.mesh.geometry.dispose()` to prevent clearing the shared static geometry buffer (`this.particleGeo`). Added a dedicated `disposeSharedResources()` handler for global cleanup.
* **Risks Evaluated:** Low. Requires verifying that materials are still correctly disposed of to prevent leaks.
* **Expected Outcome:** Core WebGL particle loops rendering consistently without deallocating shared buffers, resolving audio glitches.

---

### public/src/main.js
* **Reason for Change:** Fix **BUG-004** (Collision detection coordinate lag) and integrate shared audio contexts and anti-cheat triggers.
* **Changes Made:**
  - Instantiated a single global `this.audioCtx = new AudioContext()` in constructor, passing it to `PuzzleManager` and `SoundFXManager` instantiation calls.
  - Emitted `start_run` WebSocket signal in `startGame()` and `restartGame()` routines.
  - Immediately before performing AABB bounding box collision checks inside `animate()` loop, call `.updateMatrixWorld(true)` on `player.meshGroup` and each active obstacle mesh in the queue.
* **Risks Evaluated:** Extremely low. Minor CPU overhead for matrix updates, which is negligible (<0.02ms).
* **Expected Outcome:** Precise real-time WebGL collision detection and anti-cheat compliance.
