# AAA Graphics Audit: *Leela: Chronicles of Bharat*

This document provides a critical review of the graphics system, lighting pipelines, environment scenery, and character art quality of the game.

---

## 1. Character Quality & Proportions

| Asset | Current Silhouette | Materials & Colors | Shading Style | Quality Rating |
| :--- | :--- | :--- | :--- | :--- |
| **Lord Krishna** | Chibi proportion, short torso, large head. Moving limbs. | Flat Lambert yellow dhoti, blue chest skin, gold mukut. | Soft diffuse Lambert lighting. | **Very Good** |
| **Monuments (Dioramas)** | High detail low-poly sandstone (dwarka gate, huts). | Sandstone tones, thatched gold roofs. | Static ambient lighting and scaling. | **Excellent** |

### Visual Flaws & Gaps:
* **The "Pencil" Silhouette:** The initial character model used single stacked cylinder primitives without arms or legs. This made the player avatar look like an inanimate vertical pole (indie prototype feel). Overhauled in Sprint 5 by shortening the torso, widening the chest, scaling up the head, and adding swinging cylinder limbs.
* **Lack of Clothing Details:** The dhoti and mukut use flat basic colors. Adding a decorative golden texture or specular details to the crown and waist belt will improve depth.

---

## 2. Environment & Scenery Quality

* **Mathura Theme:** Terracotta and sandstone brick lanes flanked by side pillars.
  * *Audit Finding:* Looks repetitive and empty at times. Resolved by adding **Diyas (Clay Lamps)** with orange flames on top of the column caps to provide atmospheric warm lighting.
* **Gokul Theme:** Green grass lanes with pastel green textures.
  * *Audit Finding:* The grass lanes felt like a flat, generic plane. Resolved by adding **Lush forest trees** (stacked green spheres and brown trunks) and **Pasture fencing rails** along the sides, creating a pastoral woodland landscape.
* **Seam Lines & Z-Fighting:** The ground plane tiles met exactly end-to-end. Floating-point variations caused the seams to occasionally flicker, showing black cracks (major visual glitch). Resolved by extending plane lengths by 0.3 units to overlap.

---

## 3. Lighting & Shadow Pipeline

* **Sun Light Configuration:** A single directional light was cast from `(5, 12, 3)` with shadow map resolution set to `1024x1024`.
  * *Audit Finding:* The shadows were pixelated, and the scene had flat, black unlit regions where the sun could not reach.
  * *Overhaul Fix:*
    1. Added a **HemisphereLight** with sky-blue (`0xB1E1FF`) and ground-orange (`0xB97A20`) colors at `0.5` intensity. This simulates realistic ambient light bounce, removing harsh black voids.
    2. Shadow maps were configured with soft filtering (`THREE.PCFSoftShadowMap`), which creates smooth shadow edges on mobile.
