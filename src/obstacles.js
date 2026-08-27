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
        this.crossbarMesh = null; // Used for high obstacle collision isolation
        
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
            
            // Store reference specifically to the top crossbar for isolated collisions
            this.crossbarMesh = bar;
        }
    }

    /**
     * Updates the bounding box coordinates based on mesh position.
     */
    updateBounds() {
        if (this.type === 'high' && this.crossbarMesh) {
            // If it's a high obstacle, calculate bounds only around the top crossbar
            // This prevents detecting collisions in the empty archway below it
            this.boundingBox.setFromObject(this.crossbarMesh);
        } else {
            this.boundingBox.setFromObject(this.mesh);
        }
    }

    /**
     * Removes the mesh from the scene.
     */
    destroy() {
        this.scene.remove(this.mesh);
    }
}

export class MakhanPot {
    /**
     * @param {THREE.Scene} scene - The WebGL scene.
     * @param {number} lane - Lane index (-1 = Left, 0 = Middle, 1 = Right).
     * @param {number} startZ - Starting Z-coordinate.
     * @param {number} heightY - Y height offset (for jump arcs).
     */
    constructor(scene, lane, startZ, heightY = 0.4) {
        this.scene = scene;
        this.lane = lane;
        this.lanesX = [-2.0, 0.0, 2.0];
        
        this.mesh = new THREE.Group();
        this.buildMesh();
        
        this.mesh.position.set(this.lanesX[this.lane + 1], heightY, startZ);
        this.scene.add(this.mesh);

        this.boundingBox = new THREE.Box3();
    }

    /**
     * Builds a 3D clay pot filled with butter.
     */
    buildMesh() {
        const materialClay = new THREE.MeshLambertMaterial({ color: 0xCD853F }); // Terracotta
        const materialButter = new THREE.MeshBasicMaterial({ color: 0xFFFFF0 }); // Ivory white butter

        // Pot body
        const potGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.4, 8);
        const pot = new THREE.Mesh(potGeo, materialClay);
        pot.castShadow = true;
        this.mesh.add(pot);

        // Pot rim (torus shape)
        const rimGeo = new THREE.TorusGeometry(0.16, 0.04, 6, 12);
        const rim = new THREE.Mesh(rimGeo, materialClay);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = 0.2;
        this.mesh.add(rim);

        // Butter top fill
        const butterGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.02, 8);
        const butter = new THREE.Mesh(butterGeo, materialButter);
        butter.position.y = 0.2;
        this.mesh.add(butter);
    }

    /**
     * Updates bounding box.
     */
    updateBounds() {
        this.boundingBox.setFromObject(this.mesh);
    }

    /**
     * Removes the mesh.
     */
    destroy() {
        this.scene.remove(this.mesh);
    }
}

export class ObstacleManager {
    constructor(scene) {
        this.scene = scene;
        
        this.obstacles = [];
        this.coins = []; // List of active collectible pots
        
        this.spawnTimer = 0.0;
        this.spawnInterval = 1.8; // Ramped frequency
        this.spawnZ = -95.0;      
    }

    /**
     * Resets the manager, destroying all active obstacles and coins.
     */
    reset() {
        this.obstacles.forEach(obs => obs.destroy());
        this.coins.forEach(coin => coin.destroy());
        this.obstacles = [];
        this.coins = [];
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
            
            // Only check objects close to the player zone (Z between -1.5 and 1.5)
            if (Math.abs(obs.mesh.position.z) < 1.5) {
                obs.updateBounds();
                if (playerBox.intersectsBox(obs.boundingBox)) {
                    return obs.type;
                }
            }
        }
        return null;
    }

    /**
     * Checks for coin collections.
     * @param {THREE.Box3} playerBox - Bounding box of the player.
     * @returns {number} - Number of coins collected in this tick.
     */
    checkCoinCollections(playerBox) {
        let collectedCount = 0;

        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            
            if (Math.abs(coin.mesh.position.z) < 1.5) {
                coin.updateBounds();
                if (playerBox.intersectsBox(coin.boundingBox)) {
                    coin.destroy();
                    this.coins.splice(i, 1);
                    collectedCount++;
                }
            }
        }

        return collectedCount;
    }

    /**
     * Spawns obstacles and coins randomly, translates active ones, and cleans up old ones.
     * @param {number} speed - Game movement speed.
     * @param {number} deltaTime - Frame time step.
     */
    update(speed, deltaTime) {
        // 1. Spawning Timers
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0.0;
            this.spawnLevelElements();
        }

        const movement = speed * deltaTime;
        const cleanupThreshold = 10.0; // Past the camera plane

        // 2. Translate Obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.mesh.position.z += movement;

            if (obs.mesh.position.z > cleanupThreshold) {
                obs.destroy();
                this.obstacles.splice(i, 1);
            }
        }

        // 3. Translate and Rotate Coins
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            coin.mesh.position.z += movement;
            
            // Spin animation
            coin.mesh.rotation.y += deltaTime * 2.5;

            if (coin.mesh.position.z > cleanupThreshold) {
                coin.destroy();
                this.coins.splice(i, 1);
            }
        }
    }

    /**
     * Spawns a structured combination of obstacles and coins to ensure playable tracks.
     */
    spawnLevelElements() {
        const lanes = [-1, 0, 1];
        const randomLane = lanes[Math.floor(Math.random() * lanes.length)];
        
        // 70% chance to spawn an obstacle, otherwise spawn a coin strip
        if (Math.random() < 0.7) {
            const types = ['low', 'high'];
            const randomType = types[Math.floor(Math.random() * types.length)];
            
            // Spawn obstacle in chosen lane
            const obstacle = new Obstacle(this.scene, randomType, randomLane, this.spawnZ);
            this.obstacles.push(obstacle);

            // Spawn coins in the other lanes to reward players who dodge
            lanes.forEach(lane => {
                if (lane !== randomLane && Math.random() < 0.5) {
                    const coin = new MakhanPot(this.scene, lane, this.spawnZ + 5.0, 0.4);
                    this.coins.push(coin);
                }
            });
        } else {
            // Spawn a structured coin pattern (e.g. a jump arc or straight line of 3 pots)
            const pattern = Math.random() < 0.5 ? 'line' : 'arc';
            
            for (let i = 0; i < 3; i++) {
                const zOffset = this.spawnZ - (i * 4.0); // Space them out
                let yOffset = 0.4; // Ground height
                
                if (pattern === 'arc') {
                    // Arc heights: 0.4 -> 1.5 (apex) -> 0.4
                    if (i === 1) yOffset = 1.5;
                }
                
                const coin = new MakhanPot(this.scene, randomLane, zOffset, yOffset);
                this.coins.push(coin);
            }
        }
    }
}
