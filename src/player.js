import * as THREE from '../lib/three.module.js';

export class Player {
    constructor(scene) {
        this.scene = scene;

        // Lane setup
        this.lanes = [-2.0, 0.0, 2.0]; // Left, Middle, Right positions
        this.currentLane = 1; // Start in middle lane (index 1)
        
        // Positional targets and smoothing
        this.targetX = this.lanes[this.currentLane];
        this.laneSwitchSpeed = 15.0; // Interpolation constant

        // Physics properties
        this.posY = 0.0;
        this.velY = 0.0;
        this.gravity = 32.0;
        this.jumpForce = 12.0;

        // States
        this.isJumping = false;
        this.isSliding = false;
        this.slideDuration = 0.6; // Seconds
        this.slideTimer = 0.0;

        // Avatar mesh references
        this.meshGroup = new THREE.Group();
        this.createAvatar();
        this.scene.add(this.meshGroup);
    }

    /**
     * Creates a stylized representation of Krishna using basic meshes.
     * Includes blue skin tone, yellow dhoti, and a gold crown with a peacock feather.
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

        // Align starting position (on ground, in lane)
        this.meshGroup.position.set(this.targetX, this.posY, 0.0);
    }

    /**
     * Initiates a lane change to the left.
     */
    moveLeft() {
        if (this.currentLane > 0) {
            this.currentLane--;
            this.targetX = this.lanes[this.currentLane];
        }
    }

    /**
     * Initiates a lane change to the right.
     */
    moveRight() {
        if (this.currentLane < 2) {
            this.currentLane++;
            this.targetX = this.lanes[this.currentLane];
        }
    }

    /**
     * Triggers a jump action if eligible.
     */
    jump() {
        if (!this.isJumping && !this.isSliding) {
            this.isJumping = true;
            this.velY = this.jumpForce;
        }
    }

    /**
     * Triggers a slide action if eligible.
     */
    slide() {
        if (!this.isJumping && !this.isSliding) {
            this.isSliding = true;
            this.slideTimer = this.slideDuration;

            // Visual feedback: Shrink avatar vertically for sliding animation
            this.meshGroup.scale.y = 0.5;
            // Adjust position so it doesn't float when scaling around center
            this.meshGroup.position.y = this.posY - 0.25;
        }
    }

    /**
     * Reset character back to initial state.
     */
    reset() {
        this.currentLane = 1;
        this.targetX = this.lanes[this.currentLane];
        this.posY = 0.0;
        this.velY = 0.0;
        this.isJumping = false;
        this.isSliding = false;
        this.meshGroup.scale.y = 1.0;
        this.meshGroup.position.set(this.targetX, this.posY, 0.0);
    }

    /**
     * Updates physics, lane shifts, and animation ticks.
     * @param {number} deltaTime - Frame time delta.
     */
    update(deltaTime) {
        // 1. Smooth Lane Interpolation (Lerp along X axis)
        this.meshGroup.position.x += (this.targetX - this.meshGroup.position.x) * this.laneSwitchSpeed * deltaTime;

        // 2. Jump Physics (Y axis calculation)
        if (this.isJumping) {
            this.velY -= this.gravity * deltaTime;
            this.posY += this.velY * deltaTime;

            // Check ground collision
            if (this.posY <= 0.0) {
                this.posY = 0.0;
                this.velY = 0.0;
                this.isJumping = false;
            }
            this.meshGroup.position.y = this.posY;
        }

        // 3. Slide Timer Updates
        if (this.isSliding) {
            this.slideTimer -= deltaTime;
            if (this.slideTimer <= 0.0) {
                this.isSliding = false;
                this.meshGroup.scale.y = 1.0; // Restore standard scale
            }
        }

        // 4. Running Animation (Oscillate height slightly when on the ground)
        if (!this.isJumping && !this.isSliding) {
            const runningBounce = Math.sin(Date.now() * 0.015) * 0.03;
            this.meshGroup.position.y = runningBounce;
            
            // Add a slight running tilt rotation
            this.meshGroup.rotation.y = Math.sin(Date.now() * 0.01) * 0.08;
            this.meshGroup.rotation.z = Math.sin(Date.now() * 0.01) * 0.04;
        } else {
            this.meshGroup.rotation.y = 0;
            this.meshGroup.rotation.z = 0;
        }
    }
}
