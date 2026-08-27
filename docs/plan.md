# Master Plan: *Leela: Chronicles of Bharat*

This document serves as the implementation blueprint for the development team. It combines design, technology, learning frameworks, and project schedules into a detailed backlog ready for execution.

---

## 1. Game Vision & Narrative Setup
*Leela: Chronicles of Bharat* is a lightweight, responsive 3D endless-runner and puzzle game designed specifically for educational exhibitions, cultural festivals, and community events. Built using **Three.js (WebGL/TypeScript)**, it runs directly in mobile browsers upon scanning a QR code at the event venue. The game features zero ads, zero in-app purchases, and requires no downloads or registration.

Players control various forms of Lord Krishna, running through beautifully stylized low-poly environments (Mathura, Vrindavan, Gokul, Dwarka, and more) to gather *Gyan Patras* (Knowledge Fragments), solve interactive puzzle gates, and spend progress points to rebuild sacred monuments in a peaceful virtual Sanctuary.

---

## 2. Comprehensive Feature List
1. **Lightweight WebGL Runner:** Frame-independent mobile browser locomotion (lane shifting, jumping, sliding, swing traversal).
2. **Three.js Graphics System:** Ornate, low-poly 3D models with Draco mesh compression (.glb) to keep loading size under 10MB.
3. **Interactive Puzzle Gates:** Mid-run checkpoints (Sudarshan Gates, Flute Melodies) rendering as clean DOM overlays on top of the WebGL canvas.
4. **Heritage Restoration Metagame:** Sanctuary dashboard where players use collected *Makhan Pots* (progression points) to rebuild 3D monument dioramas.
5. **No Commercial Gating:** No ads, no microtransactions. All skins, characters, and stories are unlocked organically through score progression.
6. **Live Venue Projection Leaderboards:** A Socket.io-driven local WebSocket server that streams player scores instantly to a central projection screen at the venue.
7. **Dedicated PC Kiosk Mode:** Support for local physical kiosk setups with tactile arcade controls or keyboards.
8. **Offline Fail-Soft Mode:** The client caches scores in `localStorage` if local network drops, syncing automatically when connectivity resumes.
9. **Scribe's Scrolls Library:** A reading log where players review stories they unlocked during runs.
10. **Responsive Web Design:** Seamless scale adjustment supporting both portrait mobile screens and landscape desktop kiosks.

---

## 3. Developer-Actionable User Stories

### Web Runner Mechanics (RUN)
* **USER-RUN-01:** *As an event visitor, I want the game to load in under 3 seconds in my mobile browser so that I don't lose interest.*
  * *Acceptance Criteria:* Total initial load package size < 10MB. Draco decompression library loaded asynchronously.
* **USER-RUN-02:** *As a player, I want to swipe left/right to change lanes so that I can avoid incoming obstacles.*
  * *Acceptance Criteria:* Swipe gesture listener tracks delta-X and triggers lane transition. X position interpolates smoothly over 150ms.
* **USER-RUN-03:** *As a keyboard kiosk player, I want to use WASD/Arrow keys to control movement so that I can navigate physical arcade setups.*
  * *Acceptance Criteria:* Keydown event handlers mapped (A/Left Arrow = shift left; D/Right Arrow = shift right; W/Up Arrow = jump; S/Down Arrow = slide).

### Puzzle Integration (PZL)
* **USER-PZL-01:** *As a player, I want to repeat a flute melody to smash obstacle gates.*
  * *Acceptance Criteria:* Game loop pauses. plays a 3-note audio sequence. Displays a circular button interface. Tapping correct notes triggers a destruction animation and resumes the run.
* **USER-PZL-02:** *As a player, I want to answer a multiple-choice question in the Knowledge Portal to get a temporary shield.*
  * *Acceptance Criteria:* Portal displays a 3-second countdown and a multiple-choice question. Selecting the correct answer triggers a spinning *Sudarshana Shield* mesh.

### Event Systems (EVT)
* **USER-EVT-01:** *As a player, I want my high score to show on the hall's projector screen so that I can compete with other visitors.*
  * *Acceptance Criteria:* At run end, score is pushed via Socket.io. Server saves score in Redis and broadcasts update to the display client within 500ms.

---

## 4. Gameplay Loop Specifications

### The Web Runner Loop (Frame-by-Frame)
```
RequestAnimationFrame 
  → Read Touch/Keyboard Input 
  → Update Player Coordinates & Velocities 
  → Translate Track Tiles & Obstacles (Z-Axis) 
  → Execute AABB Collision Checks 
  → Render Scene
```

### The Event Progression Loop (Session-by-Session)
```
Scan Banner QR 
  --> Input Nickname 
  --> Run & Collect Makhan 
  --> Rebuild Monuments in Sanctuary 
  --> Stream Final Score to Venue Projector 
  --> Screenshot Heritage Badge
```

---

## 5. Heritage Locations Roadmap
1. **Mathura Prison (Level 1):** Ornate stone vaults, watchtowers, and swinging pendulum chains.
2. **Gokul Village (Level 2):** Cowherd sheds, clay butter pots, and running calves.
3. **Vrindavan Forests (Level 3):** Kadamba trees, river ghat steps, and swinging vines.
4. **Govardhan Hill (Level 4):** Rocky climbs, rain effects, and falling boulders.
5. **Dwarka Bridges (Level 5):** White-marble bridges, golden spires, and sea views.
6. **Sunken Dwarka (Level 6):** Underwater ruins, bioluminescent flora, and sea turtles.

---

## 6. Puzzle Systems
Puzzles replace traditional monotonous running blocks, challenging memory and pattern recognition.
* **Sudarshan Gates:** Match Sanskrit characters on gates with the target glyph displayed on-screen.
* **Flute Melodies:** Listen to short Sargam sequences and repeat them by tapping circular notes.
* **Govardhan Paths:** A 1-second top-down map flash shows which lane is clear of falling rocks; players must memorize the lane sequence (e.g., Left, Middle, Right).
* **Symbol Matching:** Rotate stone dials on temple walls during a slide sequence to align matching motifs (Lotus-Lotus, Conch-Conch).

---

## 7. Event Multiplayer & Local Leadboards
* **Networking Topology:** Client-server WebSockets via **Socket.io** over a local Wi-Fi router.
* **Aggregator Screen:** A dedicated HTML5 dashboard client running on the venue PC projector. It connects to the local Node.js server, receiving live JSON ranking updates.
* **Local Database:** Redis running on a local server box, storing player scores keyed by nicknames.
* **Bandwidth Optimization:** Scoring updates are sent once at the end of a run to prevent Wi-Fi router bottlenecks. Only active high-score attempts stream low-frequency coordinate ticks.

---

## 8. Learning Systems: The Implicit Design
* **Cultural Context:** Characters and monuments use historically accurate Sanskrit and regional terms (e.g., *Makhan Pot* instead of "Gold Coin", *Gyan Patra* instead of "Scrolls").
* **Scribe's Log:** Completing story scrolls requires filling in missing facts learned from environmental graffiti and NPC speech.
* **Active Prompts:** Entering blue portals triggers quick historical questions. Answering correctly grants standard shields, reinforcing learning through immediate reward loops.

---

## 9. Technology Stack Summary
* **Game Engine:** HTML5 / **Three.js** (3D Library) with TypeScript.
* **Assets Format:** Draco-compressed GLB (3D), compressed MP3 (Audio), PNG sprites sheets (UI).
* **Server Stack:** Node.js, Express, Socket.io (WebSocket library).
* **Database:** Redis (Low-latency local cache).
* **Hosting:** Netlify / GitHub Pages (Client files), Local EC2 or on-site router PC (Socket Server).

---

## 10. Development Milestones
* **Milestone 1 (Pre-Prod):** Low-poly assets Draco-compressed, Three.js engine blockout ready (Month 2).
* **Milestone 2 (Alpha Playable):** Lane-shifting, jumping, sliding, and basic Mathura level active in mobile browser (Month 4).
* **Milestone 3 (Beta Puzzles):** Sudarshan Gates, Flute Melodies, and Sanctuary restoration panel functional (Month 6).
* **Milestone 4 (Event Ready):** Node.js Socket server live, scoreboard page projection tested, local network configurations finalized (Month 7).
* **Milestone 5 (Event Launch):** Live installation at the cultural festival (Month 8).

---

## 11. Sprint Plan (Sprints 1–6: Months 1–3)

### Sprint 1: Three.js Renderer Setup & Input Listening
* **Focus:** Build the basic WebGL loop.
* **Tasks:**
  * Initialize Three.js WebGLRenderer, PerspectiveCamera, and ambient/directional lights.
  * Implement mobile touch swipe listeners and desktop keyboard listener.
  * Create the player avatar block and establish the 3 lanes along the X axis.
  * Interpolate the player avatar's position smoothly during lane changes.
* **Deliverable:** A browser page where players can shift a blue cube left and right in three lanes using swiping or keyboard arrow keys.

### Sprint 2: Procedural Track Spawner & Obstacle Pools
* **Focus:** Endless track generation in JavaScript.
* **Tasks:**
  * Create a modular tile generator that positions track segment planes sequentially along the Z-axis.
  * Implement an object recycling queue to move tiles that pass behind the camera to the front of the track.
  * Write basic AABB (Axis-Aligned Bounding Box) logic to test collisions between the player cube and obstacles.
  * Program speed acceleration mechanics (Z-axis translation speeds scale up slowly).
* **Deliverable:** An endless running loop with random barriers and score markers spawning continuously.

### Sprint 3: Model Loading & Draco Compression
* **Focus:** Replace placeholders with optimized assets.
* **Tasks:**
  * Configure Three.js `GLTFLoader` with `DRACOLoader` extensions.
  * Import low-poly GLB models of Krishna, temple columns, and obstacles.
  * Implement material overrides (unlit or simple lambert materials to ensure fast rendering).
  * Build the peacock glider flight mechanic (changing Y-axis height and falling rate on trigger).
* **Deliverable:** A run scene rendering the stylized Krishna model, jumping over stones and sliding under temple arch balconies at 60 FPS.

### Sprint 4: DOM Overlay Puzzles
* **Focus:** Overlaying puzzle gates on WebGL.
* **Tasks:**
  * Build the HTML/CSS template system for overlay menus (centered, scaling correctly).
  * Program the *Sudarshan Gate* multiple-choice UI screen.
  * Integrate the Web Audio API to play Sargam flute notes and handle button click checks.
  * Set up smooth engine pause and resume transitions on puzzle completion.
* **Deliverable:** The player runs, encounters a portal, the game pauses, a flute pattern UI overlays, and correctly tapping the pattern resumes the runner.

### Sprint 5: Sanctuary Page & Local Progress
* **Focus:** Restoration metagame.
* **Tasks:**
  * Configure browser `localStorage` integration to save player's collected pots and progress.
  * Build the Sanctuary HTML/CSS dashboard with 3D canvas viewport.
  * Implement monument unlocking states (restoring a building renders its visible 3D mesh).
  * Set up the scroll-reader interface using clean typography.
* **Deliverable:** A main hub menu allowing players to check their unlocked stories, spend points to rebuild monument dioramas, and click play to run.

### Sprint 6: Local WebSocket Server & Scoreboard
* **Focus:** Local networking.
* **Tasks:**
  * Write the Node.js server using Express and Socket.io.
  * Build the projected Scoreboard page displaying the top 10 scores with a scrolling marquee.
  * Implement Socket.io events: `submit_score` (client sends score) and `update_leaderboard` (server pushes standings).
  * Deploy Redis on the local development setup to test sorting latency.
* **Deliverable:** A fully working local build where players run on mobile browsers, and their scores instantly stream to a separate scoreboard page on a desktop monitor.

---

## 12. Venue Deployment & Networking Strategy
To handle physical site limitations at the event:
* **Local Server Box:** A dedicated laptop or Raspberry Pi 4 running Node.js and a local instance of Redis.
* **Local Router Setup:** A high-range commercial router. Banners display a QR code with the URL `http://192.168.1.100:3000` (or a local domain name like `leela.run` mapped via local DNS redirects on the router).
* **Aggregate Screen:** A venue PC connected to the local router via Ethernet, driving the central projector/LED display in fullscreen browser mode.
