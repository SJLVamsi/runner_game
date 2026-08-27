import * as THREE from '../lib/three.module.js';

export class Track {
    constructor(scene) {
        this.scene = scene;

        // Track dimension constants
        this.segmentLength = 30; // Z-depth of each segment
        this.segmentCount = 5;   // Number of segments in the pool
        this.trackWidth = 6.0;   // Overall width (-3 to +3)
        this.segments = [];      // Active segments list

        // Theme properties
        this.currentTheme = 'mathura';
        
        // Materials pool for theme swapping
        this.materials = {
            mathuraGround: new THREE.MeshLambertMaterial({ color: 0x8B7355 }),  // Sandstone ground
            mathuraPillar: new THREE.MeshLambertMaterial({ color: 0x5C4033 }),  // Dark brown stone columns
            mathuraMarker: new THREE.MeshBasicMaterial({ color: 0xFFD700 }),    // Gold borders
            mathuraFlame: new THREE.MeshBasicMaterial({ color: 0xFF5722 }),     // Emissive orange flame
            
            gokulGround: new THREE.MeshLambertMaterial({ color: 0x7EAD52 }),    // Green grass lawn
            gokulPillar: new THREE.MeshLambertMaterial({ color: 0xD2B48C }),    // Light wood fence posts
            gokulMarker: new THREE.MeshBasicMaterial({ color: 0xF4A460 }),      // Sand markers
            gokulTrunk: new THREE.MeshLambertMaterial({ color: 0x5C4033 }),       // Brown wood trunk
            gokulLeaves: new THREE.MeshLambertMaterial({ color: 0x2E7D32 })       // Deep forest leaves
        };

        this.createTrackPool();
    }

    /**
     * Initializes and positions the pool of track segments.
     */
    createTrackPool() {
        for (let i = 0; i < this.segmentCount; i++) {
            const segment = this.buildSegmentMesh();
            
            // Stack segments consecutively along the negative Z-axis
            segment.position.z = -i * this.segmentLength;
            this.scene.add(segment);
            this.segments.push(segment);
        }
    }

    /**
     * Constructs a single track segment with overlapping planes and theme decorations.
     * @returns {THREE.Group} - The segment group.
     */
    buildSegmentMesh() {
        const segmentGroup = new THREE.Group();

        // 1. Ground plane (Overlap length by 0.3 units to resolve visual seams / Z-Fighting)
        const groundGeo = new THREE.PlaneGeometry(this.trackWidth, this.segmentLength + 0.3);
        const ground = new THREE.Mesh(groundGeo, this.materials.mathuraGround);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        ground.name = "ground";
        segmentGroup.add(ground);

        // 2. Lane markings (Borders separating the 3 lanes)
        const markerThickness = 0.05;

        // Left boundary of center lane (X = -1)
        const leftLineGeo = new THREE.PlaneGeometry(markerThickness, this.segmentLength);
        const leftLine = new THREE.Mesh(leftLineGeo, this.materials.mathuraMarker);
        leftLine.rotation.x = -Math.PI / 2;
        leftLine.position.set(-1.0, 0.015, 0); // Above ground to prevent z-fighting
        leftLine.name = "leftLine";
        segmentGroup.add(leftLine);

        // Right boundary of center lane (X = 1)
        const rightLineGeo = new THREE.PlaneGeometry(markerThickness, this.segmentLength);
        const rightLine = new THREE.Mesh(rightLineGeo, this.materials.mathuraMarker);
        rightLine.rotation.x = -Math.PI / 2;
        rightLine.position.set(1.0, 0.015, 0);
        rightLine.name = "rightLine";
        segmentGroup.add(rightLine);

        // 3. Side Pillars
        const pillarGeo = new THREE.CylinderGeometry(0.18, 0.22, 4.0, 8);
        const topCapGeo = new THREE.BoxGeometry(0.5, 0.3, 0.5);
        
        // Oil lamps geometries (Diyas)
        const lampBaseGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.1, 8);
        const flameGeo = new THREE.ConeGeometry(0.06, 0.16, 6);

        const zOffsets = [-this.segmentLength / 4, this.segmentLength / 4];
        
        zOffsets.forEach((zOffset, index) => {
            // --- Left Pillar Group ---
            const leftPillarGroup = new THREE.Group();
            leftPillarGroup.name = `leftPillarGroup_${index}`;
            
            const leftPillar = new THREE.Mesh(pillarGeo, this.materials.mathuraPillar);
            leftPillar.position.y = 2.0;
            leftPillar.castShadow = true;
            leftPillar.name = "pillar";
            
            const leftCap = new THREE.Mesh(topCapGeo, this.materials.mathuraPillar);
            leftCap.position.y = 4.15;
            leftCap.name = "cap";

            // Golden Diya Base
            const leftLamp = new THREE.Mesh(lampBaseGeo, this.materials.mathuraMarker);
            leftLamp.position.y = 4.35;
            leftLamp.name = "diya";

            // Glowing Flame
            const leftFlame = new THREE.Mesh(flameGeo, this.materials.mathuraFlame);
            leftFlame.position.y = 4.48;
            leftFlame.name = "flame";
            
            leftPillarGroup.add(leftPillar);
            leftPillarGroup.add(leftCap);
            leftPillarGroup.add(leftLamp);
            leftPillarGroup.add(leftFlame);
            leftPillarGroup.position.set(-this.trackWidth / 2 - 0.4, 0, zOffset);
            segmentGroup.add(leftPillarGroup);

            // --- Right Pillar Group ---
            const rightPillarGroup = new THREE.Group();
            rightPillarGroup.name = `rightPillarGroup_${index}`;
            
            const rightPillar = new THREE.Mesh(pillarGeo, this.materials.mathuraPillar);
            rightPillar.position.y = 2.0;
            rightPillar.castShadow = true;
            rightPillar.name = "pillar";
            
            const rightCap = new THREE.Mesh(topCapGeo, this.materials.mathuraPillar);
            rightCap.position.y = 4.15;
            rightCap.name = "cap";

            // Golden Diya Base
            const rightLamp = new THREE.Mesh(lampBaseGeo, this.materials.mathuraMarker);
            rightLamp.position.y = 4.35;
            rightLamp.name = "diya";

            // Glowing Flame
            const rightFlame = new THREE.Mesh(flameGeo, this.materials.mathuraFlame);
            rightFlame.position.y = 4.48;
            rightFlame.name = "flame";
            
            rightPillarGroup.add(rightPillar);
            rightPillarGroup.add(rightCap);
            rightPillarGroup.add(rightLamp);
            rightPillarGroup.add(rightFlame);
            rightPillarGroup.position.set(this.trackWidth / 2 + 0.4, 0, zOffset);
            segmentGroup.add(rightPillarGroup);
        });

        // 4. Gokul Theme Pasture Fence Rails (Connecting pillars along the track)
        // Two rails per side: Top (Y = 1.8) and Bottom (Y = 0.9)
        const railGeo = new THREE.BoxGeometry(0.08, 0.12, this.segmentLength);
        
        const leftRailTop = new THREE.Mesh(railGeo, this.materials.gokulPillar);
        leftRailTop.position.set(-this.trackWidth / 2 - 0.4, 1.8, 0);
        leftRailTop.name = "leftRailTop";
        leftRailTop.visible = false;
        segmentGroup.add(leftRailTop);

        const leftRailBot = new THREE.Mesh(railGeo, this.materials.gokulPillar);
        leftRailBot.position.set(-this.trackWidth / 2 - 0.4, 0.9, 0);
        leftRailBot.name = "leftRailBot";
        leftRailBot.visible = false;
        segmentGroup.add(leftRailBot);

        const rightRailTop = new THREE.Mesh(railGeo, this.materials.gokulPillar);
        rightRailTop.position.set(this.trackWidth / 2 + 0.4, 1.8, 0);
        rightRailTop.name = "rightRailTop";
        rightRailTop.visible = false;
        segmentGroup.add(rightRailTop);

        const rightRailBot = new THREE.Mesh(railGeo, this.materials.gokulPillar);
        rightRailBot.position.set(this.trackWidth / 2 + 0.4, 0.9, 0);
        rightRailBot.name = "rightRailBot";
        rightRailBot.visible = false;
        segmentGroup.add(rightRailBot);

        // 5. Outside Forests (Low-poly trees sitting on outer grassy banks)
        // Tree Left: X = -5.0, Z = -6
        const treeLeft = this.buildForestTreeMesh();
        treeLeft.position.set(-5.5, 0, -6.0);
        treeLeft.name = "treeLeft";
        treeLeft.visible = false;
        segmentGroup.add(treeLeft);

        // Tree Right: X = 5.0, Z = 6
        const treeRight = this.buildForestTreeMesh();
        treeRight.position.set(5.5, 0, 6.0);
        treeRight.name = "treeRight";
        treeRight.visible = false;
        segmentGroup.add(treeRight);

        return segmentGroup;
    }

    /**
     * Helper to construct a stylized low-poly tree mesh.
     */
    buildForestTreeMesh() {
        const treeGroup = new THREE.Group();

        // Brown trunk cylinder
        const trunkGeo = new THREE.CylinderGeometry(0.12, 0.2, 1.8, 6);
        const trunk = new THREE.Mesh(trunkGeo, this.materials.gokulTrunk);
        trunk.position.y = 0.9;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        // Leaves canopies (Stacked green spheres)
        const leafGeo1 = new THREE.SphereGeometry(0.7, 6, 6);
        const leaves1 = new THREE.Mesh(leafGeo1, this.materials.gokulLeaves);
        leaves1.position.y = 1.9;
        leaves1.castShadow = true;
        treeGroup.add(leaves1);

        const leafGeo2 = new THREE.SphereGeometry(0.5, 6, 6);
        const leaves2 = new THREE.Mesh(leafGeo2, this.materials.gokulLeaves);
        leaves2.position.set(0.1, 2.4, -0.1);
        leaves2.castShadow = true;
        treeGroup.add(leaves2);

        // Randomize leaf scale/rotation slightly to look organic
        const scaleVal = 0.85 + Math.random() * 0.3;
        treeGroup.scale.set(scaleVal, scaleVal, scaleVal);

        return treeGroup;
    }

    /**
     * Swaps materials and updates visibility toggles based on active theme.
     * @param {string} theme - 'mathura' or 'gokul'.
     */
    setTheme(theme) {
        if (this.currentTheme === theme) return;
        this.currentTheme = theme;

        const groundMat = theme === 'gokul' ? this.materials.gokulGround : this.materials.mathuraGround;
        const markerMat = theme === 'gokul' ? this.materials.gokulMarker : this.materials.mathuraMarker;
        const pillarMat = theme === 'gokul' ? this.materials.gokulPillar : this.materials.mathuraPillar;

        this.segments.forEach(segment => {
            // 1. Swap rails & trees visibility
            segment.children.forEach(child => {
                if (child.name === "ground") {
                    child.material = groundMat;
                } else if (child.name === "leftLine" || child.name === "rightLine") {
                    child.material = markerMat;
                } else if (child.name === "leftRailTop" || child.name === "leftRailBot" ||
                           child.name === "rightRailTop" || child.name === "rightRailBot") {
                    child.visible = (theme === 'gokul');
                    child.material = pillarMat;
                } else if (child.name === "treeLeft" || child.name === "treeRight") {
                    child.visible = (theme === 'gokul');
                } else if (child.name.startsWith("leftPillarGroup") || child.name.startsWith("rightPillarGroup")) {
                    child.children.forEach(subChild => {
                        if (subChild.name === "pillar" || subChild.name === "cap") {
                            subChild.material = pillarMat;
                        }
                        
                        // Hide Diya components in Gokul (pastoral theme) and show/glow in Mathura (temple cell)
                        if (subChild.name === "diya" || subChild.name === "flame") {
                            subChild.visible = (theme === 'mathura');
                        }
                    });
                }
            });
        });

        // 2. Adjust fog environment coloring
        const fogColor = theme === 'gokul' ? 0xE8F5E9 : 0xF4EBD0;
        this.scene.background.set(fogColor);
        this.scene.fog.color.set(fogColor);
        console.log(`[Track Theme] Swapped environment theme to: ${theme.toUpperCase()}`);
    }

    /**
     * Resets segment positions and sets default theme.
     */
    reset() {
        this.setTheme('mathura');
        for (let i = 0; i < this.segments.length; i++) {
            this.segments[i].position.z = -i * this.segmentLength;
        }
    }

    /**
     * Moves all segments towards the camera and recycles those that pass behind the threshold.
     */
    update(speed, deltaTime) {
        const movement = speed * deltaTime;
        const recycleThreshold = 15.0; // The threshold past the camera

        for (let i = 0; i < this.segments.length; i++) {
            const segment = this.segments[i];
            segment.position.z += movement;

            // If segment passes the camera plane, recycle it to the very front
            if (segment.position.z > recycleThreshold) {
                segment.position.z -= this.segmentCount * this.segmentLength;
            }
        }
    }
}
