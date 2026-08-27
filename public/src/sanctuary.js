import * as THREE from '../lib/three.module.js';

export class Sanctuary {
    constructor(scene) {
        this.scene = scene;
        
        // Sanctuary coordinate center (off-track to prevent collision overlap)
        this.center = new THREE.Vector3(15.0, 0.0, -10.0);
        this.meshGroup = new THREE.Group();
        this.meshGroup.position.copy(this.center);
        this.scene.add(this.meshGroup);

        // Monuments data
        this.monuments = {
            gokul_hut: {
                name: "Gokul Cowherd Hut",
                cost: 5,
                restored: false,
                mesh: null,
                ruins: null,
                story: {
                    title: "The Childhood of Gopala",
                    text: "In the pastoral village of Gokul, Krishna spent his early years raised by Yashoda and Nanda. Known playfully as 'Makhan Chor' (Butter Thief), he would steal butter pots hung high by the cowherds, distributing them to his friends and monkeys. This represents the sweetness of divine play (Leela) in daily life.",
                    moral: "True devotion is found in simplicity and shared joy, not in rigid rituals."
                }
            },
            kesi_ghat: {
                name: "Kesi Ghat Steps",
                cost: 12,
                restored: false,
                mesh: null,
                ruins: null,
                story: {
                    title: "Taming the Storm: Kesi Ghat",
                    text: "Kesi Ghat is the famous ghat on the banks of the Yamuna in Vrindavan where Krishna defeated the wild horse demon Kesi, sent by Kansa. After taming the storm, Krishna bathed in the river to pacify the waters, leaving a sanctuary of peace for pilgrims.",
                    moral: "Facing adversity with inner calm and righteousness neutralizes even the wildest storms."
                }
            },
            dwarka_gate: {
                name: "Dwarka Golden Gate",
                cost: 20,
                restored: false,
                mesh: null,
                ruins: null,
                story: {
                    title: "The Gates of the Golden City",
                    text: "Dwarka was built by Krishna on the western coast of Gujarat to protect the Yadavas from constant wars. Constructed out of gold, crystal, and silver by the divine architect Vishwakarma, the city eventually submerged into the sea, leaving marine ruins that remain a beacon of archeological discovery today.",
                    moral: "All earthly kingdoms, no matter how grand, follow the cycles of time; focus on the eternal."
                }
            }
        };

        this.initSanctuaryGarden();
        this.loadProgress();
        this.buildMonuments();
    }

    /**
     * Build the garden floor terrain and decorative foliage surrounding the monuments.
     */
    initSanctuaryGarden() {
        const materialGrass = new THREE.MeshLambertMaterial({ color: 0x5C8B3E }); // Green garden
        const grassGeo = new THREE.CylinderGeometry(8.0, 8.0, 0.5, 24);
        const grass = new THREE.Mesh(grassGeo, materialGrass);
        grass.position.y = -0.25; // Sunk slightly
        grass.receiveShadow = true;
        this.meshGroup.add(grass);

        // Decorative stone path ring
        const pathMat = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        const pathGeo = new THREE.RingGeometry(4.5, 5.0, 24);
        const path = new THREE.Mesh(pathGeo, pathMat);
        path.rotation.x = -Math.PI / 2;
        path.position.y = 0.01;
        this.meshGroup.add(path);
    }

    /**
     * Reads saved states from browser memory.
     */
    loadProgress() {
        Object.keys(this.monuments).forEach(key => {
            const savedState = localStorage.getItem(`leela_monument_${key}`);
            this.monuments[key].restored = (savedState === 'true');
        });
    }

    /**
     * Builds the 3D meshes for Gokul Hut, Kesi Steps, and Dwarka Arch.
     */
    buildMonuments() {
        // Position offsets around the path ring
        const offsets = {
            gokul_hut: new THREE.Vector3(-3.5, 0.0, -1.0),
            kesi_ghat: new THREE.Vector3(3.5, 0.0, -1.0),
            dwarka_gate: new THREE.Vector3(0.0, 0.0, 3.5)
        };

        Object.keys(this.monuments).forEach(key => {
            const data = this.monuments[key];
            const pos = offsets[key];

            // 1. Build Rubble Ruins (Visible when NOT restored)
            const ruinsGroup = new THREE.Group();
            ruinsGroup.position.copy(pos);
            
            const matRubble = new THREE.MeshLambertMaterial({ color: 0x555555 }); // Dull gray ruins
            const stoneGeo = new THREE.BoxGeometry(0.3, 0.15, 0.3);
            for (let i = 0; i < 4; i++) {
                const stone = new THREE.Mesh(stoneGeo, matRubble);
                stone.position.set(
                    (Math.random() - 0.5) * 0.4,
                    0.075 + (i * 0.05),
                    (Math.random() - 0.5) * 0.4
                );
                stone.rotation.set(Math.random(), Math.random(), 0);
                ruinsGroup.add(stone);
            }
            this.meshGroup.add(ruinsGroup);
            data.ruins = ruinsGroup;

            // 2. Build Restored Structure (Visible when restored)
            const restoredGroup = new THREE.Group();
            restoredGroup.position.copy(pos);
            
            if (key === 'gokul_hut') {
                this.buildHutMesh(restoredGroup);
            } else if (key === 'kesi_ghat') {
                this.buildGhatMesh(restoredGroup);
            } else if (key === 'dwarka_gate') {
                this.buildGateMesh(restoredGroup);
            }

            this.meshGroup.add(restoredGroup);
            data.mesh = restoredGroup;

            // Set visibility according to progress state
            if (data.restored) {
                data.mesh.visible = true;
                data.ruins.visible = false;
            } else {
                data.mesh.visible = false;
                data.ruins.visible = true;
                
                // Shrink restored mesh to prep for animate unlocks
                data.mesh.scale.set(0.01, 0.01, 0.01);
            }
        });
    }

    /**
     * Builds Gokul Clay Hut.
     */
    buildHutMesh(group) {
        const matClay = new THREE.MeshLambertMaterial({ color: 0x8B5A2B });
        const matThatch = new THREE.MeshLambertMaterial({ color: 0xDAA520 });

        // Cylindrical walls
        const wallGeo = new THREE.CylinderGeometry(0.8, 0.8, 1.0, 10);
        const wall = new THREE.Mesh(wallGeo, matClay);
        wall.position.y = 0.5;
        wall.castShadow = true;
        group.add(wall);

        // Conical straw roof
        const roofGeo = new THREE.ConeGeometry(1.0, 0.6, 10);
        const roof = new THREE.Mesh(roofGeo, matThatch);
        roof.position.y = 1.3;
        group.add(roof);
    }

    /**
     * Builds Kesi Ghat steps.
     */
    buildGhatMesh(group) {
        const matStone = new THREE.MeshLambertMaterial({ color: 0xCD9B9B }); // Pink sandstone
        
        // Nested boxes representing steps
        for (let i = 0; i < 3; i++) {
            const stepGeo = new THREE.BoxGeometry(1.5, 0.25, 0.45 - (i * 0.1));
            const step = new THREE.Mesh(stepGeo, matStone);
            step.position.set(0, 0.125 + (i * 0.25), -i * 0.15);
            step.castShadow = true;
            group.add(step);
        }
    }

    /**
     * Builds Dwarka Golden Gate.
     */
    buildGateMesh(group) {
        const matGold = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        
        // Left Column
        const colGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.6, 8);
        const leftCol = new THREE.Mesh(colGeo, matGold);
        leftCol.position.set(-0.7, 0.8, 0);
        group.add(leftCol);

        // Right Column
        const rightCol = new THREE.Mesh(colGeo, matGold);
        rightCol.position.set(0.7, 0.8, 0);
        group.add(rightCol);

        // Lintel crossbar
        const lintelGeo = new THREE.BoxGeometry(1.8, 0.25, 0.25);
        const lintel = new THREE.Mesh(lintelGeo, matGold);
        lintel.position.set(0, 1.7, 0);
        group.add(lintel);
    }

    /**
     * Restores a monument, updating state cache and triggering scale animation.
     * @param {string} key - 'gokul_hut', 'kesi_ghat', or 'dwarka_gate'
     * @returns {boolean} - True if successfully restored.
     */
    restoreMonument(key) {
        const data = this.monuments[key];
        if (!data || data.restored) return false;

        // Mark as restored and save in localStorage
        data.restored = true;
        localStorage.setItem(`leela_monument_${key}`, 'true');

        // Hide rubble, show restored mesh structure
        data.ruins.visible = false;
        data.mesh.visible = true;

        // Set flag to animate scale-up during update loop
        data.animating = true;
        data.animScale = 0.01;

        console.log(`[Sanctuary Progress] Successfully restored monument: ${data.name}`);
        return true;
    }

    /**
     * Ticks animations. Handles smooth scale-ups on monument restoration.
     */
    update(deltaTime) {
        Object.keys(this.monuments).forEach(key => {
            const data = this.monuments[key];
            
            // Rebuild scale-up animation
            if (data.animating) {
                data.animScale += deltaTime * 2.5; // Scale up speed
                if (data.animScale >= 1.0) {
                    data.animScale = 1.0;
                    data.animating = false;
                }
                data.mesh.scale.set(data.animScale, data.animScale, data.animScale);
                
                // Add a playful landing wiggle
                if (!data.animating) {
                    data.mesh.scale.set(1.05, 1.05, 1.05);
                    setTimeout(() => {
                        data.mesh.scale.set(1.0, 1.0, 1.0);
                    }, 150);
                }
            }

            // Spin restored models very gently on the main menu to showcase details
            if (data.restored && data.mesh) {
                data.mesh.rotation.y = Math.sin(Date.now() * 0.0003 + (key === 'kesi_ghat' ? 1 : 2)) * 0.15;
            }
        });
    }
}
