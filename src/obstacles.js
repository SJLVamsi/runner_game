import * as THREE from '../lib/three.module.js';

export class Obstacle {
    /**
     * @param {THREE.Scene} scene - The WebGL scene.
     * @param {string} type - 'low', 'high', or 'sudarshan_gate'.
     * @param {number} lane - Lane index (-1 = Left, 0 = Middle, 1 = Right).
     * @param {number} startZ - Starting Z-coordinate.
     * @param {string} glyph - The Sanskrit text to print on the gate (only for 'sudarshan_gate').
     */
    constructor(scene, type, lane, startZ, glyph = "") {
        this.scene = scene;
        this.type = type;
        this.lane = lane;
        this.glyph = glyph;
        this.lanesX = [-2.0, 0.0, 2.0];
        
        this.mesh = new THREE.Group();
        this.crossbarMesh = null;
        
        this.buildMesh();
        
        // Position mesh in the correct lane
        this.mesh.position.set(this.lanesX[this.lane + 1], 0, startZ);
        this.scene.add(this.mesh);

        this.boundingBox = new THREE.Box3();
    }

    /**
     * Creates low-poly 3D models representing obstacles and gates.
     */
    buildMesh() {
        const materialWood = new THREE.MeshLambertMaterial({ color: 0x8B5A2B });
        const materialStone = new THREE.MeshLambertMaterial({ color: 0x6E6E6E });
        const materialFlower = new THREE.MeshLambertMaterial({ color: 0xFF69B4 }); // Pink garlands

        if (this.type === 'low') {
            const logGeo = new THREE.BoxGeometry(1.6, 0.5, 0.6);
            const log = new THREE.Mesh(logGeo, materialWood);
            log.position.y = 0.25;
            log.castShadow = true;
            this.mesh.add(log);
        } else if (this.type === 'high') {
            const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6);
            
            const leftPost = new THREE.Mesh(postGeo, materialWood);
            leftPost.position.set(-0.85, 1.1, 0);
            this.mesh.add(leftPost);

            const rightPost = new THREE.Mesh(postGeo, materialWood);
            rightPost.position.set(0.85, 1.1, 0);
            this.mesh.add(rightPost);

            const barGeo = new THREE.BoxGeometry(1.8, 0.3, 0.3);
            const bar = new THREE.Mesh(barGeo, materialFlower);
            bar.position.set(0, 2.1, 0);
            this.mesh.add(bar);
            
            this.crossbarMesh = bar;
        } else if (this.type === 'sudarshan_gate') {
            // Ornate stone temple gate (Player must pass through correct glyph)
            const postGeo = new THREE.CylinderGeometry(0.12, 0.15, 2.6, 8);
            
            const leftPost = new THREE.Mesh(postGeo, materialStone);
            leftPost.position.set(-0.9, 1.3, 0);
            this.mesh.add(leftPost);

            const rightPost = new THREE.Mesh(postGeo, materialStone);
            rightPost.position.set(0.9, 1.3, 0);
            this.mesh.add(rightPost);

            // Crossbar
            const barGeo = new THREE.BoxGeometry(2.0, 0.4, 0.4);
            const bar = new THREE.Mesh(barGeo, materialStone);
            bar.position.set(0, 2.6, 0);
            this.mesh.add(bar);
            this.crossbarMesh = bar; // Archway top

            // Canvas-based Sanskrit character sign
            const texture = this.createSignTexture(this.glyph);
            const signMat = new THREE.MeshBasicMaterial({ map: texture });
            const signGeo = new THREE.PlaneGeometry(1.2, 0.6);
            const sign = new THREE.Mesh(signGeo, signMat);
            sign.position.set(0, 3.1, 0.05); // Placed above the crossbar, facing player
            this.mesh.add(sign);
        }
    }

    /**
     * Renders a golden Sanskrit glyph on a blue background canvas, loaded as a texture.
     */
    createSignTexture(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Deep blue background
        ctx.fillStyle = '#063970';
        ctx.fillRect(0, 0, 256, 128);
        
        // Saffron border
        ctx.strokeStyle = '#E28743';
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, 248, 120);

        // Gold text
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 128, 64);

        return new THREE.CanvasTexture(canvas);
    }

    /**
     * Updates collision bounding box.
     */
    updateBounds() {
        if ((this.type === 'high' || this.type === 'sudarshan_gate') && this.crossbarMesh) {
            this.boundingBox.setFromObject(this.crossbarMesh);
        } else {
            this.boundingBox.setFromObject(this.mesh);
        }
    }

    /**
     * Removes the mesh.
     */
    destroy() {
        this.scene.remove(this.mesh);
    }
}

export class PowerUpItem {
    /**
     * @param {THREE.Scene} scene - The WebGL scene.
     * @param {string} type - 'chakra' (shield) or 'feather' (fly).
     * @param {number} lane - Lane index (-1 = Left, 0 = Middle, 1 = Right).
     * @param {number} startZ - Starting Z-coordinate.
     */
    constructor(scene, type, lane, startZ) {
        this.scene = scene;
        this.type = type;
        this.lane = lane;
        this.lanesX = [-2.0, 0.0, 2.0];
        
        this.mesh = new THREE.Group();
        this.buildMesh();
        
        this.mesh.position.set(this.lanesX[this.lane + 1], 0.6, startZ);
        this.scene.add(this.mesh);

        this.boundingBox = new THREE.Box3();
    }

    /**
     * Builds 3D power-up items.
     */
    buildMesh() {
        if (this.type === 'chakra') {
            // Spinning golden Sudarshana Chakra
            const materialGold = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
            const diskGeo = new THREE.TorusGeometry(0.25, 0.05, 8, 24);
            const disk = new THREE.Mesh(diskGeo, materialGold);
            disk.rotation.x = Math.PI / 2; // Flat disc
            disk.castShadow = true;
            this.mesh.add(disk);

            // Add inner spikes
            const spikeGeo = new THREE.BoxGeometry(0.04, 0.5, 0.02);
            for (let i = 0; i < 4; i++) {
                const spike = new THREE.Mesh(spikeGeo, materialGold);
                spike.rotation.y = (Math.PI / 4) * i;
                this.mesh.add(spike);
            }
        } else {
            // Levitating Peacock Feather (Pushpak Fly)
            const materialTeal = new THREE.MeshLambertMaterial({ color: 0x063970 });
            const materialGold = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
            
            const featherGeo = new THREE.BoxGeometry(0.12, 0.45, 0.03);
            const feather = new THREE.Mesh(featherGeo, materialTeal);
            this.mesh.add(feather);

            const coreGeo = new THREE.SphereGeometry(0.08, 8, 8);
            const core = new THREE.Mesh(coreGeo, materialGold);
            core.position.y = 0.1;
            this.mesh.add(core);
        }
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

export class MakhanPot {
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

    buildMesh() {
        const materialClay = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        const materialButter = new THREE.MeshBasicMaterial({ color: 0xFFFFF0 });

        const potGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.4, 8);
        const pot = new THREE.Mesh(potGeo, materialClay);
        pot.castShadow = true;
        this.mesh.add(pot);

        const rimGeo = new THREE.TorusGeometry(0.16, 0.04, 6, 12);
        const rim = new THREE.Mesh(rimGeo, materialClay);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = 0.2;
        this.mesh.add(rim);

        const butterGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.02, 8);
        const butter = new THREE.Mesh(butterGeo, materialButter);
        butter.position.y = 0.2;
        this.mesh.add(butter);
    }

    updateBounds() {
        this.boundingBox.setFromObject(this.mesh);
    }

    destroy() {
        this.scene.remove(this.mesh);
    }
}

export class ObstacleManager {
    constructor(scene) {
        this.scene = scene;
        
        this.obstacles = [];
        this.coins = [];
        this.powerups = []; // List of active chakra/feather items
        
        this.spawnTimer = 0.0;
        this.spawnInterval = 1.8;
        this.spawnZ = -95.0;      
    }

    /**
     * Resets the manager, destroying all active entities.
     */
    reset() {
        this.obstacles.forEach(obs => obs.destroy());
        this.coins.forEach(coin => coin.destroy());
        this.powerups.forEach(p => p.destroy());
        
        this.obstacles = [];
        this.coins = [];
        this.powerups = [];
        this.spawnTimer = 0.0;
    }

    /**
     * Checks if the player's bounding box intersects with any active obstacles.
     * @param {THREE.Box3} playerBox - Bounding box of the player.
     * @returns {Obstacle|null} - The obstacle entity intersected or null.
     */
    checkCollision(playerBox) {
        for (let i = 0; i < this.obstacles.length; i++) {
            const obs = this.obstacles[i];
            
            if (Math.abs(obs.mesh.position.z) < 1.5) {
                obs.updateBounds();
                if (playerBox.intersectsBox(obs.boundingBox)) {
                    return obs; // Return entity itself to inspect type & glyph
                }
            }
        }
        return null;
    }

    /**
     * Checks for coin collections.
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
     * Checks for powerup collection triggers.
     * @param {THREE.Box3} playerBox - Bounding box of the player.
     * @returns {string|null} - The type of powerup collected ('chakra'/'feather') or null.
     */
    checkPowerUpCollections(playerBox) {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            if (Math.abs(p.mesh.position.z) < 1.5) {
                p.updateBounds();
                if (playerBox.intersectsBox(p.boundingBox)) {
                    const type = p.type;
                    p.destroy();
                    this.powerups.splice(i, 1);
                    return type;
                }
            }
        }
        return null;
    }

    /**
     * Helper to spawn a row of sky coins for Pushpak Flight.
     * @param {number} startZ - Starting Z index.
     */
    spawnSkyCoins(startZ) {
        // Spawn a winding sinusoidal coin trail in the sky (Y = 6.0)
        let zi = startZ;
        const zf = startZ - 60.0;
        let c = 0;
        let activeLane = 0; // Middle lane

        while (zi >= zf) {
            if (c === 8) {
                c = 0;
                // Shift lanes: -1 -> 0 -> 1 -> -1
                activeLane = activeLane === 1 ? -1 : activeLane + 1;
            }
            
            const coin = new MakhanPot(this.scene, activeLane, zi, 6.0); // Y height is 6.0
            this.coins.push(coin);
            
            zi -= 2.5;
            c++;
        }
    }

    /**
     * Helper to spawn a triple Sudarshan Gate obstacle configuration across all 3 lanes.
     * @param {string} targetGlyph - The target glyph player must run through.
     */
    spawnSudarshanGates(targetGlyph) {
        const lanes = [-1, 0, 1];
        const glyphs = ["ॐ", "श्री", "हरि"];
        
        // Remove target glyph from copy list to prevent duplicates
        const remainingGlyphs = glyphs.filter(g => g !== targetGlyph);
        
        // Shuffle remaining glyphs
        remainingGlyphs.sort(() => Math.random() - 0.5);

        // Pick a random lane for the target glyph
        const targetLane = lanes[Math.floor(Math.random() * lanes.length)];

        lanes.forEach(lane => {
            const glyph = lane === targetLane ? targetGlyph : remainingGlyphs.pop();
            const gate = new Obstacle(this.scene, 'sudarshan_gate', lane, this.spawnZ, glyph);
            this.obstacles.push(gate);
        });
    }

    /**
     * Translates and rotates all active elements.
     */
    update(speed, deltaTime) {
        // 1. Timer check
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0.0;
            this.spawnLevelElements();
        }

        const movement = speed * deltaTime;
        const cleanupThreshold = 10.0;

        // 2. Move Obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.mesh.position.z += movement;
            if (obs.mesh.position.z > cleanupThreshold) {
                obs.destroy();
                this.obstacles.splice(i, 1);
            }
        }

        // 3. Move and Rotate Coins
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            coin.mesh.position.z += movement;
            coin.mesh.rotation.y += deltaTime * 2.5;
            if (coin.mesh.position.z > cleanupThreshold) {
                coin.destroy();
                this.coins.splice(i, 1);
            }
        }

        // 4. Move and Rotate Powerups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            p.mesh.position.z += movement;
            
            // Spin animation
            if (p.type === 'chakra') {
                p.mesh.rotation.y += deltaTime * 3.5;
            } else {
                p.mesh.rotation.z = Math.sin(Date.now() * 0.005) * 0.25;
            }
            
            // Levitating bounce
            p.mesh.position.y = 0.6 + Math.sin(Date.now() * 0.006) * 0.12;

            if (p.mesh.position.z > cleanupThreshold) {
                p.destroy();
                this.powerups.splice(i, 1);
            }
        }
    }

    /**
     * Standard random level spawner configuration.
     */
    spawnLevelElements() {
        const lanes = [-1, 0, 1];
        const randomLane = lanes[Math.floor(Math.random() * lanes.length)];
        
        const rand = Math.random();

        if (rand < 0.12) {
            // 12% chance to spawn a Power-Up!
            const type = Math.random() < 0.5 ? 'chakra' : 'feather';
            const powerup = new PowerUpItem(this.scene, type, randomLane, this.spawnZ);
            this.powerups.push(powerup);
        } else if (rand < 0.65) {
            // 53% chance to spawn standard obstacle
            const types = ['low', 'high'];
            const randomType = types[Math.floor(Math.random() * types.length)];
            
            const obstacle = new Obstacle(this.scene, randomType, randomLane, this.spawnZ);
            this.obstacles.push(obstacle);

            // Add side coins
            lanes.forEach(lane => {
                if (lane !== randomLane && Math.random() < 0.55) {
                    const coin = new MakhanPot(this.scene, lane, this.spawnZ + 4.0, 0.4);
                    this.coins.push(coin);
                }
            });
        } else {
            // 35% chance to spawn standard coin strip
            for (let i = 0; i < 3; i++) {
                const coin = new MakhanPot(this.scene, randomLane, this.spawnZ - (i * 4.0), 0.4);
                this.coins.push(coin);
            }
        }
    }
}
