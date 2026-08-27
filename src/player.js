import * as THREE from '../lib/three.module.js';

export class Player {
    constructor(scene) {
        this.scene = scene;

        // Lane setup
        this.lanes = [-2.0, 0.0, 2.0];
        this.currentLane = 1;
        
        // Positional targets and smoothing
        this.targetX = this.lanes[this.currentLane];
        this.laneSwitchSpeed = 15.0;

        // Physics properties
        this.posY = 0.0;
        this.velY = 0.0;
        this.gravity = 32.0;
        this.jumpForce = 12.0;

        // States
        this.isJumping = false;
        this.isSliding = false;
        this.slideDuration = 0.6;
        this.slideTimer = 0.0;

        // Powerup States
        this.isShielded = false;
        this.shieldTimer = 0.0;
        
        this.isFlying = false;
        this.flyTimer = 0.0;

        // Avatar meshes
        this.meshGroup = new THREE.Group();
        this.shieldMesh = null;
        this.createAvatar();
        this.scene.add(this.meshGroup);
    }

    /**
     * Creates a stylized representation of Krishna using basic meshes.
     * Includes blue skin tone, yellow dhoti, and a gold crown with a peacock feather.
     * Also sets up a hidden Sudarshana Chakra ring mesh that activates during shields.
     */
    createAvatar() {
        const materialGold = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        const materialBlue = new THREE.MeshLambertMaterial({ color: 0x3A9EDB });
        const materialYellow = new THREE.MeshLambertMaterial({ color: 0xECC81A });
        const materialPeacock = new THREE.MeshLambertMaterial({ color: 0x076E78 });

        // 1. Torso/Dhoti
        const torsoGeo = new THREE.CylinderGeometry(0.4, 0.45, 1.0, 8);
        const torso = new THREE.Mesh(torsoGeo, materialYellow);
        torso.position.y = 0.5;
        torso.castShadow = true;
        this.meshGroup.add(torso);

        // 2. Chest (Blue skin)
        const chestGeo = new THREE.CylinderGeometry(0.38, 0.4, 0.5, 8);
        const chest = new THREE.Mesh(chestGeo, materialBlue);
        chest.position.y = 1.1;
        chest.castShadow = true;
        this.meshGroup.add(chest);

        // 3. Head
        const headGeo = new THREE.SphereGeometry(0.3, 16, 16);
        const head = new THREE.Mesh(headGeo, materialBlue);
        head.position.y = 1.6;
        head.castShadow = true;
        this.meshGroup.add(head);

        // 4. Crown (Mukut)
        const crownGeo = new THREE.ConeGeometry(0.2, 0.4, 8);
        const crown = new THREE.Mesh(crownGeo, materialGold);
        crown.position.y = 1.95;
        this.meshGroup.add(crown);

        // 5. Peacock Feather (Mayur Pankh)
        const featherGeo = new THREE.BoxGeometry(0.08, 0.35, 0.02);
        const feather = new THREE.Mesh(featherGeo, materialPeacock);
        feather.position.set(0.1, 2.1, -0.1);
        feather.rotation.z = -0.3;
        this.meshGroup.add(feather);

        // 6. Sudarshana Chakra Shield (Golden spinning torus orbiting player torso)
        const shieldGeo = new THREE.TorusGeometry(0.68, 0.04, 6, 16);
        this.shieldMesh = new THREE.Mesh(shieldGeo, materialGold);
        this.shieldMesh.position.y = 1.0;
        this.shieldMesh.rotation.x = Math.PI / 2; // Flat disc alignment
        this.shieldMesh.visible = false;           // Hidden by default
        this.meshGroup.add(this.shieldMesh);

        // Align starting position
        this.meshGroup.position.set(this.targetX, this.posY, 0.0);
    }

    /**
     * Trigger invincibility.
     */
    activateShield(duration) {
        this.isShielded = true;
        this.shieldTimer = duration;
        this.shieldMesh.visible = true;
        console.log(`[Player Powerup] Sudarshana Shield Activated: ${duration}s`);
    }

    /**
     * Trigger sky flight.
     */
    activateFlight(duration) {
        this.isFlying = true;
        this.flyTimer = duration;
        
        // Force break any active slides
        if (this.isSliding) {
            this.isSliding = false;
            this.meshGroup.scale.y = 1.0;
        }
        
        console.log(`[Player Powerup] Pushpak Flight Activated: ${duration}s`);
    }

    /**
     * Shifts lane left.
     */
    moveLeft() {
        if (this.currentLane > 0) {
            this.currentLane--;
            this.targetX = this.lanes[this.currentLane];
        }
    }

    /**
     * Shifts lane right.
     */
    moveRight() {
        if (this.currentLane < 2) {
            this.currentLane++;
            this.targetX = this.lanes[this.currentLane];
        }
    }

    /**
     * Triggers jump.
     */
    jump() {
        // Cannot jump while already in the air or sliding
        if (!this.isJumping && !this.isSliding && !this.isFlying) {
            this.isJumping = true;
            this.velY = this.jumpForce;
        }
    }

    /**
     * Triggers slide.
     */
    slide() {
        // Cannot slide while jumping or flying
        if (!this.isJumping && !this.isSliding && !this.isFlying) {
            this.isSliding = true;
            this.slideTimer = this.slideDuration;
            this.meshGroup.scale.y = 0.5;
            this.meshGroup.position.y = this.posY - 0.25;
        }
    }

    /**
     * Complete reset.
     */
    reset() {
        this.currentLane = 1;
        this.targetX = this.lanes[this.currentLane];
        this.posY = 0.0;
        this.velY = 0.0;
        
        this.isJumping = false;
        this.isSliding = false;
        
        this.isShielded = false;
        this.shieldTimer = 0.0;
        this.shieldMesh.visible = false;
        
        this.isFlying = false;
        this.flyTimer = 0.0;

        this.meshGroup.scale.y = 1.0;
        this.meshGroup.position.set(this.targetX, this.posY, 0.0);
    }

    /**
     * Updates physics, lane switches, and powerup cooldown ticks.
     */
    update(deltaTime) {
        // 1. Smooth Lane Interpolation (X axis)
        this.meshGroup.position.x += (this.targetX - this.meshGroup.position.x) * this.laneSwitchSpeed * deltaTime;

        // 2. Power-Up state ticks
        if (this.isShielded) {
            this.shieldTimer -= deltaTime;
            
            // Spin the shield mesh
            this.shieldMesh.rotation.z += deltaTime * 8.0;

            if (this.shieldTimer <= 0.0) {
                this.isShielded = false;
                this.shieldMesh.visible = false;
                console.log(`[Player Powerup] Sudarshana Shield Expired`);
            }
        }

        if (this.isFlying) {
            this.flyTimer -= deltaTime;
            
            // Smoothly ascend to sky level (Y = 6.0)
            const targetY = 6.0;
            this.posY += (targetY - this.posY) * 4.0 * deltaTime;
            this.meshGroup.position.y = this.posY;

            if (this.flyTimer <= 0.0) {
                this.isFlying = false;
                console.log(`[Player Powerup] Pushpak Flight Expired`);
            }
        } else {
            // Standard Jump physics or ground running
            if (this.isJumping) {
                this.velY -= this.gravity * deltaTime;
                this.posY += this.velY * deltaTime;

                if (this.posY <= 0.0) {
                    this.posY = 0.0;
                    this.velY = 0.0;
                    this.isJumping = false;
                }
                this.meshGroup.position.y = this.posY;
            } else if (this.posY > 0.0) {
                // If exiting flight, drift back down gently to the ground
                this.posY += (0.0 - this.posY) * 5.0 * deltaTime;
                if (this.posY < 0.05) this.posY = 0.0;
                this.meshGroup.position.y = this.posY;
            }

            // Slide state tick
            if (this.isSliding) {
                this.slideTimer -= deltaTime;
                if (this.slideTimer <= 0.0) {
                    this.isSliding = false;
                    this.meshGroup.scale.y = 1.0;
                }
            }

            // Bounce run oscillation
            if (!this.isJumping && !this.isSliding && this.posY === 0.0) {
                const runningBounce = Math.sin(Date.now() * 0.015) * 0.03;
                this.meshGroup.position.y = runningBounce;
                
                this.meshGroup.rotation.y = Math.sin(Date.now() * 0.01) * 0.08;
                this.meshGroup.rotation.z = Math.sin(Date.now() * 0.01) * 0.04;
            } else {
                this.meshGroup.rotation.y = 0;
                this.meshGroup.rotation.z = 0;
            }
        }
    }
}
