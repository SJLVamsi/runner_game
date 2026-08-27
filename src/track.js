import * as THREE from '../lib/three.module.js';

export class Track {
    constructor(scene) {
        this.scene = scene;

        // Track dimension constants
        this.segmentLength = 30; // Z-depth of each segment
        this.segmentCount = 5;   // Number of segments in the pool
        this.trackWidth = 6.0;   // Overall width (-3 to +3)
        this.segments = [];      // Active segments list

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

        // 1. Sandstone ground plane
        const groundGeo = new THREE.PlaneGeometry(this.trackWidth, this.segmentLength);
        const groundMat = new THREE.MeshLambertMaterial({ color: 0xD2B48C }); // Sandstone color
        const ground = new THREE.Mesh(groundGeo, groundMat);
        
        // Plane geometry is created flat on the XY plane; rotate it to lie flat on XZ.
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        segmentGroup.add(ground);

        // 2. Lane markings (Golden borders separating the 3 lanes)
        const markerMat = new THREE.MeshBasicMaterial({ color: 0xFFD700 }); // Gold lines
        const markerThickness = 0.05;

        // Left boundary of center lane (X = -1)
        const leftLineGeo = new THREE.PlaneGeometry(markerThickness, this.segmentLength);
        const leftLine = new THREE.Mesh(leftLineGeo, markerMat);
        leftLine.rotation.x = -Math.PI / 2;
        leftLine.position.set(-1.0, 0.01, 0); // Position slightly above ground to prevent z-fighting
        segmentGroup.add(leftLine);

        // Right boundary of center lane (X = 1)
        const rightLineGeo = new THREE.PlaneGeometry(markerThickness, this.segmentLength);
        const rightLine = new THREE.Mesh(rightLineGeo, markerMat);
        rightLine.rotation.x = -Math.PI / 2;
        rightLine.position.set(1.0, 0.01, 0);
        segmentGroup.add(rightLine);

        // 3. Side Pillars (to create scale and sense of motion)
        const pillarMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Darker stone/wood
        const pillarGeo = new THREE.CylinderGeometry(0.2, 0.25, 4.0, 8);
        const topCapGeo = new THREE.BoxGeometry(0.6, 0.3, 0.6);

        // Place pillars every 15 meters along the segment edges (Z = -7.5 and Z = 7.5)
        const zOffsets = [-this.segmentLength / 4, this.segmentLength / 4];
        
        zOffsets.forEach(zOffset => {
            // Left Pillar
            const leftPillarGroup = new THREE.Group();
            const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
            leftPillar.position.y = 2.0; // Half height
            const leftCap = new THREE.Mesh(topCapGeo, pillarMat);
            leftCap.position.y = 4.15;
            leftPillarGroup.add(leftPillar);
            leftPillarGroup.add(leftCap);
            leftPillarGroup.position.set(-this.trackWidth / 2 - 0.3, 0, zOffset);
            segmentGroup.add(leftPillarGroup);

            // Right Pillar
            const rightPillarGroup = new THREE.Group();
            const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
            rightPillar.position.y = 2.0;
            const rightCap = new THREE.Mesh(topCapGeo, pillarMat);
            rightCap.position.y = 4.15;
            rightPillarGroup.add(rightPillar);
            rightPillarGroup.add(rightCap);
            rightPillarGroup.position.set(this.trackWidth / 2 + 0.3, 0, zOffset);
            segmentGroup.add(rightPillarGroup);
        });

        return segmentGroup;
    }

    /**
     * Resets segment positions to default setup.
     */
    reset() {
        for (let i = 0; i < this.segments.length; i++) {
            this.segments[i].position.z = -i * this.segmentLength;
        }
    }

    /**
     * Moves all segments towards the camera and recycles those that pass behind the threshold.
     * @param {number} speed - The current translation speed.
     * @param {number} deltaTime - Frame step time.
     */
    update(speed, deltaTime) {
        const movement = speed * deltaTime;
        const recycleThreshold = 15.0; // The threshold past the camera (positive Z)

        for (let i = 0; i < this.segments.length; i++) {
            const segment = this.segments[i];
            segment.position.z += movement;

            // If segment passes the camera plane, recycle it to the very front of the track
            if (segment.position.z > recycleThreshold) {
                // Shift the position to the end of the line
                segment.position.z -= this.segmentCount * this.segmentLength;
            }
        }
    }
}
