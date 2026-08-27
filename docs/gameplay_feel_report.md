# AAA Gameplay Feel Report: *Leela: Chronicles of Bharat*

This document reviews the physics, camera responsiveness, and visual feedback systems that contribute to the game's overall feel.

---

## 1. Locomotion & Physics Tuning

To match the fast-paced gameplay of classic runner games, character movement was tuned:

* **Lane Switch Speed:** Set to `15.0` units/sec using linear interpolation. This enables immediate lane switches on keyboard/swipe inputs.
* **Jump Velocity:** Configured with a `12.0` upward force and `32.0` gravity. This creates a quick, responsive jump cycle.
* **Slide Duration:** Scaled to `0.6` seconds. The chibi avatar squishes down along the Y-axis (scale = 0.55) and widens slightly (scale = 1.15) to maintain its volume.
* **Peacock Flight (Pushpak):** Elevates the player to `Y = 6.0` and positions the camera further back to display sky coins.

---

## 2. Camera Physics & Transitions

* **Dynamic FOV (Speed Trails):**
  * *Behavior:* As the runner's speed increases, the camera's FOV dynamically widens from `60` to `75` degrees. During flight, it is locked at `72` degrees.
  * *Impact:* Creates a sense of high speed and improves visibility of upcoming obstacles.
* **Camera Shake (Tactile Feedback):**
  * *Behavior:* Spawns random displacement offsets on the X and Y axes, decaying at a rate of `4.0` per second.
  * *Tuned Intensities:*
    - Player Crash: `0.65` (High impact)
    - Shield Break: `0.35` (Medium impact)
    - Wrong Gate Crossing: `0.25`
    - Correct Gate / Powerup Collect: `0.12` - `0.15` (Micro-impacts)
