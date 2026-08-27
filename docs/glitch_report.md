# AAA Glitch Report: *Leela: Chronicles of Bharat*

This report logs specific glitches (visual, physics, gameplay, and user interface) discovered during the test suite, identifying their symptoms and solutions.

---

## 1. Visual Glitches

### Seam Gaps (Ground Plane)
* **Symptom:** Small white horizontal lines flickered between track sections as the camera moved forward.
* **Analysis:** Caused by rounding coordinates during camera position changes.
* **Fix:** Extended ground segment planes by `0.3` units to overlap.

### Flame Rendering Z-Fighting
* **Symptom:** Flame cones on top of Mathura pillars occasionally flickered when rotating the camera in start-menu orbit mode.
* **Analysis:** The cap mesh and the lamp base were coplanar.
* **Fix:** Shifted the lamp base position up along the Y-axis to `4.35` and the flame to `4.48`, resolving coplanar overlaps.

---

## 2. Physics & Gameplay Glitches

### Collision Coordinate Lag
* **Symptom:** The player crashed into stones or gates, but the collision triggered slightly after passing the obstacle visually.
* **Analysis:** Three.js defers matrix updates to the render phase. Bounding boxes calculated immediately after updates used positions from the *previous frame*.
* **Fix:** Explicitly called `updateMatrixWorld(true)` on the player group and active obstacles before checking collisions.

---

## 3. UI Glitches

### Overlay Click Bleedthrough
* **Symptom:** Clicking buttons on menus occasionally triggered player lane changes behind the overlay panel.
* **Analysis:** The container layer `#ui-layer` lacked proper pointer-event control.
* **Fix:** Set `#ui-layer` pointer-events to `none` by default, and set `.overlay-panel` containers to `pointer-events: auto` to prevent clicks from bleeding through.

### Scoreboard Screen Overlaps on Mobile
* **Symptom:** Table columns overlapped when viewed on small mobile displays.
* **Analysis:** Missing responsive design constraints for small viewports.
* **Fix:** Applied flexible layouts (`%` widths and scrollable grids) in `scoreboard.html` and `style.css`.
