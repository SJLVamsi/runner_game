import * as THREE from '../lib/three.module.js';

export class Obstacle {
    /**
     * @param {THREE.Scene} scene - The WebGL scene.
     * @param {string} type - 'low' (must jump) or 'high' (must slide).
     * @param {number} lane - Lane index (-1 = Left, 0 = Middle, 1 = Right).
     * @param {number} startZ - Starting Z-coordinate (far distance).
     */
    constructor(scene, type, lane, startZ) {
        this.scene = scene;
        this.type = type;
        this.lane = lane;
        this.lanesX = [-2.0, 0.0, 2.0];
        
        this.mesh = new THREE.Group();
        this.buildMesh();
        
        // Position mesh in the correct lane and start distance
        this.mesh.position.set(this.lanesX[this.lane + 1], 0, startZ);
        this.scene.add(this.mesh);

        // Bounding box for collisions
        this.boundingBox = new THREE.Box3();
    }

    /**
     * Creates simple, low-poly 3D models representing historical obstacles.
     */
    buildMesh() {
        const materialWood = new THREE.MeshLambertMaterial({ color: 0x8B5A2B });
        const materialFlower = new THREE.MeshLambertMaterial({ color: 0xFF69B4 }); // Pink garlands

        if (this.type === 'low') {
            // Low stone log / block (Player must JUMP)
            const logGeo = new THREE.BoxGeometry(1.6, 0.5, 0.6);
            const log = new THREE.Mesh(logGeo, materialWood);
            log.position.y = 0.25; // Sit on the ground
            log.castShadow = true;
            this.mesh.add(log);
        } else {
            // High hanging floral arch (Player must SLIDE)
            const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6);
            
            // Left pole
            const leftPost = new THREE.Mesh(postGeo, materialWood);
            leftPost.position.set(-0.85, 1.1, 0);
            this.mesh.add(leftPost);

            // Right pole
            const rightPost = new THREE.Mesh(postGeo, materialWood);
            rightPost.position.set(0.85, 1.1, 0);
            this.mesh.add(rightPost);

            // Top crossbar (Garland)
            const barGeo = new THREE.BoxGeometry(1.8, 0.3, 0.3);
            const bar = new THREE.Mesh(barGeo, materialFlower);
            bar.position.set(0, 2.1, 0);
            this.mesh.add(bar);
        }
    }

    /**
     * Updates the bounding box coordinates based on mesh position.
     */
    updateBounds() {
        this.boundingBox.setFromObject(this.mesh);
    }

    /**
     * Removes the mesh from the scene.
     */
    destroy() {
        this.scene.remove(this.mesh);
    }
}

export class ObstacleManager {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];
        this.spawnTimer = 0.0;
        this.spawnInterval = 2.0; // Seconds between obstacle spawns
        this.spawnZ = -90.0;     // Spawn obstacles far ahead
    }

    /**
     * Resets the manager, destroying all active obstacles.
     */
    reset() {
        this.obstacles.forEach(obs => obs.destroy());
        this.obstacles = [];
        this.spawnTimer = 0.0;
    }

    /**
     * Checks if the player's bounding box intersects with any active obstacles.
     * @param {THREE.Box3} playerBox - Bounding box of the player.
     * @returns {string|null} - The type of obstacle collided with ('low'/'high') or null.
     */
    checkCollision(playerBox) {
        for (let i = 0; i < this.obstacles.length; i++) {
            const obs = this.obstacles[i];
            
            // Only check objects that are in the player's immediate zone (Z between -2 and 2)
            if (Math.abs(obs.mesh.position.z) < 2.0) {
                obs.updateBounds();
                if (playerBox.intersectsBox(obs.boundingBox)) {
                    return obs.type;
                }
            }
        }
        return null;
    }

    /**
     * Spawns obstacles randomly, moves them, and removes past ones.
     * @param {number} speed - Game movement speed.
     * @param {number} deltaTime - Frame time step.
     */
    update(speed, deltaTime) {
        // 1. Spawning Logic
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0.0;
            this.spawnRandomObstacle();
        }

        // 2. Translation & Cleanup
        const movement = speed * deltaTime;
        const cleanupThreshold = 10.0; // Remove when passed behind camera

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.mesh.position.z += movement;

            if (obs.mesh.position.z > cleanupThreshold) {
                obs.destroy();
                this.obstacles.splice(i, 1);
            }
        }
    }

    /**
     * Pick a random lane and obstacle type, and instantiate.
     */
    spawnRandomObstacle() {
        const lanes = [-1, 0, 1];
        const types = ['low', 'high'];

        const randomLane = lanes[Math.floor(Math.random() * lanes.length)];
        const randomType = types[Math.floor(Math.random() * types.length)];

        const obstacle = new Obstacle(this.scene, randomType, randomLane, this.spawnZ);
        this.obstacles.push(obstacle);
    }
}
