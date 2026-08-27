# Root Cause Analysis: *Leela: Chronicles of Bharat*

This document tracks the deep diagnostic trace, Five Whys logs, and failure paths for our critical and high-priority bugs (P0/P1).

---

## 1. BUG-001 [P0]: Shared Particle Geometry Disposed Prematurely

### Five Whys Analysis
1. *Why did the particles stop rendering after the first burst completed?*
   Because the WebGL geometry buffers for the particles were deallocated from the GPU.
2. *Why were the geometry buffers deallocated?*
   Because `p.mesh.geometry.dispose()` was called when the first particle reached the end of its life.
3. *Why did that dispose the active geometry of other particles?*
   Because all particles share a single references pointer to the same `THREE.BoxGeometry` instance (`this.particleGeo`).
4. *Why did they share the geometry instance?*
   To optimize CPU/GPU memory footprint and draw calls by reusing a single geometry structure instead of instantiating new box geometries for each particle.
5. *Why was the cleanup loop executing instance-level disposal of a shared resource?*
   Because the disposal routine blindly called `.dispose()` on all mesh properties without separating instance-unique resources (cloned materials) from static shared resources (shared geometry).

### Failure Path Mapping
```
Particle System constructor instantiates shared this.particleGeo
  ↓
spawnBurst() creates meshes sharing this.particleGeo
  ↓
First particle life reaches 0.0 in update()
  ↓
Cleanup routine calls p.mesh.geometry.dispose()
  ↓
GPU frees buffer data for the shared geometry
  ↓
Next frame, remaining particles try to draw using disposed geometry
  ↓
WebGL throws warning, rendering for all particles fails
```

---

## 2. BUG-002 [P1]: Directory Exposure via Express Static Root

### Five Whys Analysis
1. *Why could visitors read server.js and scores.json from their web browsers?*
   Because the static file server was configured to serve files directly from the root project directory `__dirname`.
2. *Why were backend files situated in the root directory?*
   Because there was no physical separation of client files (HTML, CSS, JS) and server scripts (`server.js`, `package.json`).
3. *Why wasn't there a separate client folder?*
   Because the initial rapid prototype positioned all files in the root folder for simplicity.
4. *Why did we serve the root folder instead of specific files?*
   Because `express.static(__dirname)` was used as a quick shortcut to serve game client assets.
5. *Why wasn't the security risk audited?*
   Because security constraints were not checked during early development iterations, resulting in technical debt.

### Failure Path Mapping
```
Server starts: Express mounts app.use(express.static(__dirname))
  ↓
Client requests GET /server.js
  ↓
Express static resolver maps path to absolute file system route
  ↓
Static handler reads server.js and returns it with a 200 OK
  ↓
Raw backend code, port bindings, and API logic exposed to client
```

---

## 3. BUG-003 [P1]: Leaderboard Score Injection Vulnerability

### Five Whys Analysis
1. *Why could a player inject any score into the venue leaderboard?*
   Because the server accepted the score payload from the WebSocket without verifying if it was correct.
2. *Why was the score accepted without check?*
   Because the server-side listener had no verification or limit validation checks.
3. *Why was the client in charge of score calculations?*
   Because in endless runner games, client-side tracking of scores is typical to ensure instant HUD updates.
4. *Why didn't the server-side validator cross-reference the score with duration?*
   Because the WebSocket payload did not include timestamp markers or duration metrics, preventing rate-checks.
5. *Why was duration-based validation skipped?*
   Because the system was designed for local, non-commercial events, and developers assumed users would only use the standard client interface rather than open the browser console.

### Failure Path Mapping
```
User opens browser console
  ↓
Invokes socket.emit('submit_score', { score: 99999, name: 'Cheater' })
  ↓
Server receives JSON payload on Socket.io connection
  ↓
Basic syntax check passes (name exists, score is a number)
  ↓
Server inserts entry, sorts, writes to scores.json, and broadcasts standings
  ↓
Leaderboard displays injected score immediately, cheating the event
```
