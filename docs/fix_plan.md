# Fix Plan: *Leela: Chronicles of Bharat*

This document outlines the detailed plans, alternative solutions (Options A and B), and justifications for resolving the identified system issues.

---

## 1. BUG-001: Shared Particle Geometry Disposed Prematurely

* **Option A (Clone Geometries):** Clone the `THREE.BoxGeometry` for every individual particle.
  * *Pros:* Safe; allows calling `.dispose()` on each particle instance.
  * *Cons:* Destroys GPU memory efficiency; results in high memory allocation overhead.
* **Option B (Shared Geometry with Isolated Material Disposal - *Recommended*):** Keep the geometry shared and do NOT call `dispose()` on it when individual particles die. Only dispose of the unique material instance (`material.dispose()`). The shared geometry is disposed of only once when the overall `ParticleSystem` is destroyed.
  * *Pros:* Optimal performance; zero CPU/GPU memory footprint bloating.
  * *Cons:* Requires discipline in deallocation code structure.
* **Decision:** We implement Option B. Endless runners generate thousands of particles; memory performance is critical on WebGL browsers.

---

## 2. BUG-002: Directory Exposure via Express Static Root

* **Option A (Explicit File Routing):** Create explicit Express routes for each file (e.g., `app.get('/index.html')`, `app.get('/src/main.js')`, etc.).
  * *Pros:* Highly secure.
  * *Cons:* Unmaintainable; adds tedious file mappings for every asset, image, and script.
* **Option B (Directory Sandboxing - *Recommended*):** Create a dedicated `/public` folder, move all client-facing files (HTML, CSS, JS, assets) into it, and serve only that subdirectory: `app.use(express.static(path.join(__dirname, 'public')))`.
  * *Pros:* Standard clean architecture; securely isolates server scripts (`server.js`, `package.json`, `scores.json`) from user queries.
  * *Cons:* Requires reorganizing the workspace directory.
* **Decision:** We implement Option B. It aligns with production web engineering best practices.

---

## 3. BUG-003: Leaderboard Score Injection Vulnerability

* **Option A (Client-Side Encrypted Signature):** Hash the score with a secret salt on the client and verify the hash on the server.
  * *Pros:* Simple.
  * *Cons:* Extremely easy to bypass. Anyone can inspect the JavaScript source code, find the salt, and generate valid hashes.
* **Option B (Server-Side Time-Rate Check - *Recommended*):** Track the start and end timestamp of a run on the server. Calculate the maximum possible score:
  $$\text{Max Score} = (\text{Duration in seconds} \times 20) + (\text{Butter Collected} \times 110) + 1000$$
  If the submitted score exceeds this limit, reject it.
  * *Pros:* Highly effective; doesn't rely on obfuscated client secrets.
  * *Cons:* Adds mathematical checking logic on the server.
* **Decision:** We implement Option B. This provides robust validation for event environments.

---

## 4. BUG-004: Collision Detection Coordinate Lag (Stale Matrices)

* **Option A (Update Matrix World on Every Object):** Force `scene.updateMatrixWorld(true)` on every frame tick.
  * *Pros:* Simple; resolves all stale matrices.
  * *Cons:* High CPU overhead; recalculates world matrices for all static objects unnecessarily.
* **Option B (Targeted Matrix Updates - *Recommended*):** Call `.updateMatrixWorld(true)` *only* on the player group and the specific active obstacle group immediately before performing bounding box intersection checks.
  * *Pros:* Zero performance overhead; precise and correct coordinate synchronization.
  * *Cons:* Requires manual invocation in collision managers.
* **Decision:** We implement Option B.

---

## 5. BUG-005: Multiple Active Audio Context Instances

* **Option A (Audio Manager Service Locator):** Implement an independent audio manager class that coordinates contexts.
  * *Pros:* Highly structured.
  * *Cons:* Over-engineered for a simple event-driven WebGL project.
* **Option B (Shared Audio Context - *Recommended*):** Instantiate a single `AudioContext` inside the core `Game` class and pass it to both `PuzzleManager` and `SoundFXManager` upon creation.
  * *Pros:* DRY compliant; resolves context limits and prevents audio overlap crackles.
  * *Cons:* Requires minor constructor refactoring.
* **Decision:** We implement Option B.
