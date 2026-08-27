# AAA Optimization Plan: *Leela: Chronicles of Bharat*

This document provides guidelines and plans to maintain 60 FPS on mobile and 120 FPS+ on desktop viewports.

---

## 1. rendering Optimization Strategies

### A. Shared Geometry Pool (LOD / Instancing)
* **Goal:** Keep draw calls under 50.
* **Plan:**
  1. Share the base geometry across objects (e.g., reuse a single `BoxGeometry` and `CylinderGeometry` for all track segments).
  2. Implement an object pooler for coins (Makhan Pots) and stone obstacles. Avoid calling `new THREE.Mesh()` or `scene.add()` during active runs.
  3. Pre-instantiate a pool of 20 coins and 8 obstacles. Move inactive items out of view (e.g., Y = -100) and position them on-track as needed.

### B. Frustum Culling
* **Goal:** Reduce shader overhead.
* **Plan:** Keep `mesh.frustumCulled = true` active. Three.js will skip rendering segments positioned behind the camera, reducing vertex processing.

---

## 2. Memory & Asset Management

### A. Material Reusability
* **Goal:** Reduce texture switching overhead.
* **Plan:** Limit materials to a single palette. The game uses a shared material pool defined in `Track.js`, which speeds up rendering.

### B. Clean Resource Disposal
* **Goal:** Prevent GPU memory leaks.
* **Plan:**
  1. Call `material.dispose()` and `geometry.dispose()` when deleting custom meshes (such as diorama unlocks).
  2. For particles, reuse a single `BoxGeometry` and dispose of the unique material clone upon fadeout.
