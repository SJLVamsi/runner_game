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
            mathuraGround: new THREE.MeshLambertMaterial({ color: 0x8B7355 }),  // Darker sandstone
            mathuraPillar: new THREE.MeshLambertMaterial({ color: 0x5C4033 }),  // Dark brown stone
            mathuraMarker: new THREE.MeshBasicMaterial({ color: 0xFFD700 }),    // Gold borders
            
            gokulGround: new THREE.MeshLambertMaterial({ color: 0x7EAD52 }),    // Pastel green grass
            gokulPillar: new THREE.MeshLambertMaterial({ color: 0xD2B48C }),    // Light wood fence
            gokulMarker: new THREE.MeshBasicMaterial({ color: 0xF4A460 })       // Sand lane markers
        };

        this.createTrackPool();
    }

    /**
     * Initializes and positions the pool of track segments.
     */
    createTrackPool() {
        for (let i = 0; i < this.segmentCount; i++) {
            const segment = this.buildSegmentMesh();
            
            // Stack segments consecutively along the negative Z-axis (ahead of the camera)
            segment.position.z = -i * this.segmentLength;
            this.scene.add(segment);
            this.segments.push(segment);
        }
    }

    /**
     * Constructs a single track segment including the ground lanes and side pillars.
     * @returns {THREE.Group} - The segment group.
     */
    buildSegmentMesh() {
        const segmentGroup = new THREE.Group();

        // 1. Ground plane
        const groundGeo = new THREE.PlaneGeometry(this.trackWidth, this.segmentLength);
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
        const zOffsets = [-this.segmentLength / 4, this.segmentLength / 4];
        
        zOffsets.forEach((zOffset, index) => {
            // Left Pillar
            const leftPillarGroup = new THREE.Group();
            leftPillarGroup.name = `leftPillarGroup_${index}`;
            
            const leftPillar = new THREE.Mesh(pillarGeo, this.materials.mathuraPillar);
            leftPillar.position.y = 2.0;
            leftPillar.castShadow = true;
            leftPillar.name = "pillar";
            
            const leftCap = new THREE.Mesh(topCapGeo, this.materials.mathuraPillar);
            leftCap.position.y = 4.15;
            leftCap.name = "cap";
            
            leftPillarGroup.add(leftPillar);
            leftPillarGroup.add(leftCap);
            leftPillarGroup.position.set(-this.trackWidth / 2 - 0.4, 0, zOffset);
            segmentGroup.add(leftPillarGroup);

            // Right Pillar
            const rightPillarGroup = new THREE.Group();
            rightPillarGroup.name = `rightPillarGroup_${index}`;
            
            const rightPillar = new THREE.Mesh(pillarGeo, this.materials.mathuraPillar);
            rightPillar.position.y = 2.0;
            rightPillar.castShadow = true;
            rightPillar.name = "pillar";
            
            const rightCap = new THREE.Mesh(topCapGeo, this.materials.mathuraPillar);
            rightCap.position.y = 4.15;
            rightCap.name = "cap";
            
            rightPillarGroup.add(rightPillar);
            rightPillarGroup.add(rightCap);
            rightPillarGroup.position.set(this.trackWidth / 2 + 0.4, 0, zOffset);
            segmentGroup.add(rightPillarGroup);
        });

        return segmentGroup;
    }

    /**
     * Swaps the rendering materials for all child segments.
     * @param {string} theme - 'mathura' or 'gokul'.
     */
    setTheme(theme) {
        if (this.currentTheme === theme) return;
        this.currentTheme = theme;

        const groundMat = theme === 'gokul' ? this.materials.gokulGround : this.materials.mathuraGround;
        const markerMat = theme === 'gokul' ? this.materials.gokulMarker : this.materials.mathuraMarker;
        const pillarMat = theme === 'gokul' ? this.materials.gokulPillar : this.materials.mathuraPillar;

        this.segments.forEach(segment => {
            // Traverse segment and update child meshes
            segment.children.forEach(child => {
                if (child.name === "ground") {
                    child.material = groundMat;
                } else if (child.name === "leftLine" || child.name === "rightLine") {
                    child.material = markerMat;
                } else if (child.name.startsWith("leftPillarGroup") || child.name.startsWith("rightPillarGroup")) {
                    child.children.forEach(subChild => {
                        if (subChild.name === "pillar" || subChild.name === "cap") {
                            subChild.material = pillarMat;
                        }
                    });
                }
            });
        });

        // Set matching scene fog color
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
