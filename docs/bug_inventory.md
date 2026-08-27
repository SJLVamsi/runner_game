# AAA Bug Inventory: *Leela: Chronicles of Bharat*

This inventory lists the ten visual, technical, gameplay, and security issues resolved during the software engineering and AAA art overhaul.

---

## Bug Registry

1. **BUG-001 [P0 - Critical]:** Shared Particle Geometry Disposed Prematurely (Fixed)
2. **BUG-002 [P1 - High]:** Directory Exposure via Express Static Root (Fixed)
3. **BUG-003 [P1 - High]:** Leaderboard Score Injection Vulnerability (Fixed)
4. **BUG-004 [P2 - Medium]:** Collision Detection Coordinate Lag (Fixed)
5. **BUG-005 [P2 - Medium]:** Multiple Active Audio Context Instances (Fixed)
6. **BUG-006 [P2 - Medium]:** Stiff "Pencil Silhouette" Player Avatar (Fixed)
7. **BUG-007 [P3 - Low]:** Ground Planes Seam Cracking / Z-Fighting (Fixed)
8. **BUG-008 [P3 - Low]:** Lack of Tactile Game Feel Feedback (Camera Shake) (Fixed)
9. **BUG-009 [P3 - Low]:** Synth Note Clicks/Pops Audio Artifacts (Fixed)
10. **BUG-010 [P3 - Low]:** Empty / Artificial Track Scenery (Fixed)

---

## Visual & Tactile Bug Details

### BUG-006: Stiff "Pencil Silhouette" Player Avatar
* **Severity:** P2 (Medium)
* **Description:** The player avatar lacked limbs and had unrealistic cylinder proportions, resembling a floating pencil. It lacked animation feedback during jumps, runs, and slides.
* **Fix Applied:** Overhauled [player.js](file:///Users/vamsisatuluri07/Documents/kashyap/subway_surfer/public/src/player.js). Enlarged head (chibi ratio), shortened/widened torso, and added 3D cylinder legs and arms. Programmed walking/running oscillation rotations linked to frame delta times. Added distinct limb poses for jumping and sliding.

### BUG-007: Ground Planes Seam Cracking / Z-Fighting
* **Severity:** P3 (Low)
* **Description:** Track segments laid end-to-end exactly matching `segmentLength` spacing displayed tiny black gaps and flickering seams due to rendering round-off errors.
* **Fix Applied:** In [track.js](file:///Users/vamsisatuluri07/Documents/kashyap/subway_surfer/public/src/track.js), extended road geometries by `0.3` units, creating overlapping joints that mask gaps.

### BUG-008: Lack of Tactile Game Feel Feedback
* **Severity:** P3 (Low)
* **Description:** Collisions, powerup collections, and puzzle completions occurred without screen impact feedback, making gameplay feel lightweight and non-visceral.
* **Fix Applied:** In [main.js](file:///Users/vamsisatuluri07/Documents/kashyap/subway_surfer/public/src/main.js), coded a camera shake system with high-frequency offsets and decay triggers. Triggered shake bursts on hits, shield breaks, collections, and gate alignments.

### BUG-009: Synth Note Clicks/Pops Audio Artifacts
* **Severity:** P3 (Low)
* **Description:** Web Audio oscillators started and stopped abruptly at non-zero amplitudes, causing clicks.
* **Fix Applied:** Coded Attack-Decay-Release volume envelopes (exponential gain ramps) in [puzzles.js](file:///Users/vamsisatuluri07/Documents/kashyap/subway_surfer/public/src/puzzles.js) and [effects.js](file:///Users/vamsisatuluri07/Documents/kashyap/subway_surfer/public/src/effects.js) to smoothly start and stop sounds.

### BUG-010: Empty / Artificial Track Scenery
* **Severity:** P3 (Low)
* **Description:** Sandstone pillars sat on empty tracks, making environments look generic and barren.
* **Fix Applied:** Updated [track.js](file:///Users/vamsisatuluri07/Documents/kashyap/subway_surfer/public/src/track.js) to spawn clay oil lamps (Diyas) in Mathura, and pasture fences and low-poly forest trees on outer banks in Gokul.
