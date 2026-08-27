# Asset Requirements: *Leela: Chronicles of Bharat*

This document catalogs the 3D, 2D, and audio assets required to assemble *Leela: Chronicles of Bharat*. It includes design specifications, references, and sources for open-source and Creative Commons assets.

---

## 1. Visual Research & Asset References

### A. Environment Architecture
* **Style:** Traditional Indian Architecture (Northern Nagar Style, Rajasthani Haveli, and Indo-Aryan style).
* **Key Features:** *Jarokhas* (overhanging balconies), *Chatris* (dome-shaped pavilions), *Shikharas* (temple spires), *Pillars* with intricate lotus engravings, and *Ghats* (stone steps leading down to water).
* **Reference Sources:**
  * [Archaeological Survey of India (ASI) Digital Portal](https://asi.nic.in/) - Public domain architectural plans and high-resolution historical photos.
  * [Wikimedia Commons: Indian Architecture Category](https://commons.wikimedia.org/wiki/Category:Ancient_temple_architecture_in_India) - CC BY-SA photos of Mathura, Vrindavan, and Dwarka structures.
  * [Sketchfab CC Search](https://sketchfab.com/feed) - Search queries: "Indian Temple", "Stepwell", "Ornate Pillars" (Filtered by CC Attribution).

### B. Character Design & Outfits
* **Style:** Semi-stylized, high-appeal character models (Pixar-meets-traditional Indian paintings, e.g., Amar Chitra Katha).
* **Key Motifs:** Peacock feathers (*Mayur Pankh*), flute (*Bansuri*), yellow silks (*Pitambar*), flower garlands (*Vaijayanti Mala*), and traditional ornaments (armlets, waist-bands).
* **Reference Sources:**
  * [Ravi Varma Press Prints (Public Domain)](https://commons.wikimedia.org/wiki/Category:Raja_Ravi_Varma) - Excellent reference for drapery, expressions, and posture of mythological figures.
  * [Metropolitan Museum of Art Open Access](https://www.metmuseum.org/about-the-met/policies-and-documents/open-access) - Search for "Krishna paintings" or "sculptures" from the 16th–18th century (Public Domain).

---

## 2. Environment Asset List (3D Models)

The following assets must be created in low-poly models (optimized for mobile/URP) with high-detail PBR textures.

| Asset ID | Asset Name | Description | Poly Count (Target) | Reference / Source Link |
| :--- | :--- | :--- | :--- | :--- |
| **ENV-TEM-01** | Ornate Pillar | Sandstone pillar with lotus carvings at the base. | 500 tris | [Sketchfab Reference](https://sketchfab.com/3d-models/indian-temple-pillar-cc0-928ef231f) |
| **ENV-TEM-02** | Shikhara Dome | Large temple spire for background skyline. | 1,500 tris | [ASI Photo Library](https://asi.nic.in/) |
| **ENV-TEM-03** | Rajasthani Jarokha | Overhanging balcony obstacle (hangs over runner lanes). | 800 tris | [Wikimedia Commons Jarokhas](https://commons.wikimedia.org/wiki/File:Jaisalmer_Haveli_Balcony.jpg) |
| **ENV-NAT-01** | Kadamba Tree | Twisted trunk with green canopy, yellow round flowers. | 1,200 tris | [Nidhivan Forest botanical references](https://commons.wikimedia.org/wiki/Category:Flora_of_Uttar_Pradesh) |
| **ENV-NAT-02** | Sacred Cow (Gir) | Animated calf/cow grazing or walking. | 2,200 tris | [Gir Cow Reference CC-BY](https://commons.wikimedia.org/wiki/File:Gir_cow.jpg) |
| **ENV-NAT-03** | Peacock (Mayur) | Fully textured peacock (used for dynamic lanes). | 1,500 tris | [Peacock references](https://commons.wikimedia.org/wiki/File:Pavo_cristatus_peacock.jpg) |
| **ENV-GHT-01** | River Ghat Steps | Modular stone steps for riverbank runs. | 300 tris | [Kesi Ghat Vrindavan Photos](https://commons.wikimedia.org/wiki/Category:Kesi_Ghat,_Vrindavan) |
| **ENV-GHT-02** | Terracotta Diya | Small oil lamp (emits dynamic point light). | 150 tris | [Diya 3D asset ref](https://sketchfab.com/3d-models/diya-lamp-f831201ab) |

---

## 3. Character Asset List

Characters require skeletal rigs supporting locomotion, jumps, slides, flips, and celebration animations.

1. **Gopala (Child Krishna):** Cute, chubby, adorned with flower ornaments, small crown, and peacock feather.
2. **Dwarkadhish (Adult Krishna):** Royal crown, majestic yellow pitambar drapery, armlets, carrying the Sudarshana symbol.
3. **Balarama (Sakha):** Energetic companion, holding a toy wooden plough, dressed in blue.
4. **Radha (Sakhi):** Graceful, wearing a flowy traditional ghagra-choli with colorful patterns.

---

## 4. UI/UX 2D Sprite Requirements
* **Color Palette:** Warm saffron gold (`#E28743`), rich peacock teal (`#063970`), lotus pink (`#E2725B`), and deep ivory (`#F4EBD0`).
* **Icons:**
  * **Makhan Pot:** Standard runner currency (golden pot overflowing with butter).
  * **Gyan Patra:** Knowledge collection item (rolled-up ancient scroll glowing blue).
  * **Karma Point:** Lotus icon.
  * **Sudarshana Shield:** Spinning golden disc (invincibility indicator).
* **Typography:** Primary font: *Rozha One* (for headings, elegant Serif), Secondary font: *Noto Sans Indic* (for legibility across multiple Indian languages).

---

## 5. Audio & Sound FX Requirements
* **Music Soundtrack:** Dynamic tempo matching the run speed. Composed using traditional instruments:
  * **Flute (Bansuri):** Melody guide (plays different tunes when speed-boosted or solving puzzles).
  * **Sitar & Veena:** High-energy string rhythms during races.
  * **Mridangam & Tabla:** Percussion basis, increasing beat frequency as runner speed scales.
* **Sound Effects (SFX):**
  * *Butter Pot Collection:* Light "pop" water splash sound.
  * *Obstacle Collision:* Soft wooden thump (avoiding harsh violent crash sounds).
  * *Puzzle Gate Unlock:* Celestial chime.
  * *Wrong Answer/Failure:* Low, brief sitar discordance string pull.
* **Audio Library Source:** [Freesound.org (CC Zero / CC Attribution)](https://freesound.org/) for raw animal recordings (peacocks, cows) and water ripples. Traditional music loops recorded in-house or via licensed libraries like [Sangeet Natak Akademi Archives](http://sangeetnatak.gov.in/).
