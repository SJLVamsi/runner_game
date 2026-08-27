# AAA Root Cause Analysis: *Leela: Chronicles of Bharat*

This document tracks the diagnostic investigations, systems affected, and severity profiles for visual and gameplay feel bugs.

---

## 1. BUG-006: Stiff "Pencil Silhouette" Player Avatar

* **System Affected:** Avatar Meshing, Character Locomotion & Animation.
* **Reproduction Steps:**
  1. Open the game.
  2. Start a run.
  3. Observe that the character body is a static vertical cylinder structure without limbs.
* **Exact Cause:** Prototype meshes were built without joint components or child meshes, resulting in a static, floaty appearance.
* **Severity:** High (P1) - Impacts the game's overall quality and polish.
* **Fix Strategy:** Refactored [player.js](file:///Users/vamsisatuluri07/Documents/kashyap/subway_surfer/public/src/player.js) to build a chibi-style model with separate arm and leg meshes. Programmed rotation oscillations linked to the speed clock to animate runs, jumps, and slides.

---

## 2. BUG-007: Yamuna / Track Ground Seams Flashing Z-Fighting

* **System Affected:** Terrain Scroller, WebGL Vertex Shader Render.
* **Reproduction Steps:**
  1. Start a run at high speed.
  2. MonitorYamuna riverbanks and track lanes as the camera moves forward.
  3. Notice flickering gaps and thin black horizontal lines between track segments.
* **Exact Cause:** Floating-point rounding errors when laying track segments exactly end-to-end.
* **Severity:** Medium (P2) - Visually distracting.
* **Fix Strategy:** Extended the road geometries by `0.3` units in [track.js](file:///Users/vamsisatuluri07/Documents/kashyap/subway_surfer/public/src/track.js), allowing segments to overlap slightly.

---

## 3. BUG-008: Lack of Tactile Game Feel Feedback (Stiff Camera)

* **System Affected:** Camera follow routines, Feedback HUD.
* **Reproduction Steps:**
  1. Play the game and hit an obstacle with a shield active.
  2. Notice that the shield disappears with no camera shake or collision feedback.
* **Exact Cause:** The camera script used linear interpolation for positions but lacked shake offsets, making hits feel lightweight.
* **Severity:** Medium (P2) - Impacts gameplay immersion.
* **Fix Strategy:** Implemented a decay-controlled camera shake engine in [main.js](file:///Users/vamsisatuluri07/Documents/kashyap/subway_surfer/public/src/main.js). Triggered screen shake bursts on hits, shield breaks, collections, and gate crossings.
