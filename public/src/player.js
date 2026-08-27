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

        // Limb mesh references for running animations
        this.leftLeg = null;
        this.rightLeg = null;
        this.leftArm = null;
        this.rightArm = null;

        // Avatar meshes
        this.meshGroup = new THREE.Group();
        this.shieldMesh = null;
        this.createAvatar();
        this.scene.add(this.meshGroup);
    }

    /**
     * Creates a stylized, cute "chibi" Krishna.
     * Overhauls the tall "pencil" look into a chubby cowherd boy with arms and legs.
     */
    createAvatar() {
        const materialGold = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        const materialBlue = new THREE.MeshLambertMaterial({ color: 0x3A9EDB });
        const materialYellow = new THREE.MeshLambertMaterial({ color: 0xECC81A });
        const materialPeacock = new THREE.MeshLambertMaterial({ color: 0x076E78 });

        // 1. Chubby Torso/Dhoti (Shorter and wider to avoid pencil-look)
        const torsoGeo = new THREE.CylinderGeometry(0.55, 0.6, 0.7, 10);
        const torso = new THREE.Mesh(torsoGeo, materialYellow);
        torso.position.y = 0.65; // Lifted slightly to fit legs underneath
        torso.castShadow = true;
        this.meshGroup.add(torso);

        // 2. Chest (Chubby blue skin chest)
        const chestGeo = new THREE.CylinderGeometry(0.5, 0.55, 0.4, 10);
        const chest = new THREE.Mesh(chestGeo, materialBlue);
        chest.position.y = 1.1;
        chest.castShadow = true;
        this.meshGroup.add(chest);

        // 3. Head (Large, cute Chibi head)
        const headGeo = new THREE.SphereGeometry(0.42, 16, 16);
        const head = new THREE.Mesh(headGeo, materialBlue);
        head.position.y = 1.62;
        head.castShadow = true;
        this.meshGroup.add(head);

        // 4. Crown (Mukut)
        const crownGeo = new THREE.ConeGeometry(0.24, 0.45, 8);
        const crown = new THREE.Mesh(crownGeo, materialGold);
        crown.position.y = 2.05;
        this.meshGroup.add(crown);

        // 5. Peacock Feather
        const featherGeo = new THREE.BoxGeometry(0.1, 0.4, 0.02);
        const feather = new THREE.Mesh(featherGeo, materialPeacock);
        feather.position.set(0.12, 2.2, -0.1);
        feather.rotation.z = -0.3;
        this.meshGroup.add(feather);

        // 6. Limbs setup (Pivoted for smooth rotation animations)
        const limbMat = new THREE.MeshLambertMaterial({ color: 0x3A9EDB });
        const legMat = new THREE.MeshLambertMaterial({ color: 0xECC81A }); // Yellow dhoti bottoms
        const limbGeo = new THREE.CylinderGeometry(0.13, 0.11, 0.5, 8);

        // Left Leg
        this.leftLeg = new THREE.Mesh(limbGeo, legMat);
        this.leftLeg.position.set(-0.25, 0.25, 0);
        this.leftLeg.castShadow = true;
        this.meshGroup.add(this.leftLeg);

        // Right Leg
        this.rightLeg = new THREE.Mesh(limbGeo, legMat);
        this.rightLeg.position.set(0.25, 0.25, 0);
        this.rightLeg.castShadow = true;
        this.meshGroup.add(this.rightLeg);

        // Left Arm
        this.leftArm = new THREE.Mesh(limbGeo, limbMat);
        this.leftArm.position.set(-0.68, 1.0, 0);
        this.leftArm.rotation.z = 0.2; // Tilt out slightly
        this.leftArm.castShadow = true;
        this.meshGroup.add(this.leftArm);

        // Right Arm
        this.rightArm = new THREE.Mesh(limbGeo, limbMat);
        this.rightArm.position.set(0.68, 1.0, 0);
        this.rightArm.rotation.z = -0.2; // Tilt out
        this.rightArm.castShadow = true;
        this.meshGroup.add(this.rightArm);

        // 7. Sudarshana Chakra Shield (Golden spinning torus)
        const shieldGeo = new THREE.TorusGeometry(0.85, 0.05, 6, 16);
        this.shieldMesh = new THREE.Mesh(shieldGeo, materialGold);
        this.shieldMesh.position.y = 1.0;
        this.shieldMesh.rotation.x = Math.PI / 2;
        this.shieldMesh.visible = false;
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
        
        // Break active slides
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
        if (!this.isJumping && !this.isSliding && !this.isFlying) {
            this.isJumping = true;
            this.velY = this.jumpForce;
        }
    }

    /**
     * Triggers slide.
     */
    slide() {
        if (!this.isJumping && !this.isSliding && !this.isFlying) {
            this.isSliding = true;
            this.slideTimer = this.slideDuration;
            
            // Slide scale adjustments (squish down but widen slightly to keep volume)
            this.meshGroup.scale.y = 0.55;
            this.meshGroup.scale.x = 1.15;
            this.meshGroup.position.y = this.posY - 0.22;
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

        this.meshGroup.scale.set(1.0, 1.0, 1.0);
        this.meshGroup.position.set(this.targetX, this.posY, 0.0);
    }

    /**
     * Updates physics, lane shifts, and running animations.
     */
    update(deltaTime) {
        // 1. Smooth Lane Interpolation (X axis)
        this.meshGroup.position.x += (this.targetX - this.meshGroup.position.x) * this.laneSwitchSpeed * deltaTime;

        // 2. Power-Up state ticks
        if (this.isShielded) {
            this.shieldTimer -= deltaTime;
            this.shieldMesh.rotation.z += deltaTime * 8.0;

            if (this.shieldTimer <= 0.0) {
                this.isShielded = false;
                this.shieldMesh.visible = false;
            }
        }

        if (this.isFlying) {
            this.flyTimer -= deltaTime;
            
            const targetY = 6.0;
            this.posY += (targetY - this.posY) * 4.0 * deltaTime;
            this.meshGroup.position.y = this.posY;

            // Flying pose: arms open, legs straight
            this.leftArm.rotation.set(0, 0, 1.1);
            this.rightArm.rotation.set(0, 0, -1.1);
            this.leftLeg.rotation.set(0.1, 0, 0);
            this.rightLeg.rotation.set(0.1, 0, 0);

            if (this.flyTimer <= 0.0) {
                this.isFlying = false;
            }
        } else {
            // Standard Jump physics
            if (this.isJumping) {
                this.velY -= this.gravity * deltaTime;
                this.posY += this.velY * deltaTime;

                if (this.posY <= 0.0) {
                    this.posY = 0.0;
                    this.velY = 0.0;
                    this.isJumping = false;
                }
                this.meshGroup.position.y = this.posY;

                // Jumping pose: arms bent up, legs tucked slightly
                this.leftArm.rotation.set(-0.5, 0, 0.2);
                this.rightArm.rotation.set(-0.5, 0, -0.2);
                this.leftLeg.rotation.set(0.4, 0, 0);
                this.rightLeg.rotation.set(0.4, 0, 0);
            } else {
                // Return to ground
                if (this.posY > 0.0) {
                    this.posY += (0.0 - this.posY) * 5.0 * deltaTime;
                    if (this.posY < 0.05) this.posY = 0.0;
                    this.meshGroup.position.y = this.posY;
                }

                // Slide state tick
                if (this.isSliding) {
                    this.slideTimer -= deltaTime;
                    
                    // Sliding pose: arms tucked, legs extended
                    this.leftArm.rotation.set(0.8, 0, 0.4);
                    this.rightArm.rotation.set(0.8, 0, -0.4);
                    this.leftLeg.rotation.set(-0.5, 0, 0);
                    this.rightLeg.rotation.set(-0.5, 0, 0);

                    if (this.slideTimer <= 0.0) {
                        this.isSliding = false;
                        this.meshGroup.scale.set(1.0, 1.0, 1.0); // Reset scale
                    }
                }
            }

            // 3. Dynamic Running Oscillation (Only on ground)
            if (!this.isJumping && !this.isSliding && this.posY === 0.0) {
                const bounce = Math.sin(Date.now() * 0.015) * 0.03;
                this.meshGroup.position.y = bounce;
                
                this.meshGroup.rotation.y = Math.sin(Date.now() * 0.01) * 0.08;
                this.meshGroup.rotation.z = Math.sin(Date.now() * 0.01) * 0.04;

                // Alternate limb swings (running cycle)
                const runCycle = Date.now() * 0.015;
                const swingAngle = Math.sin(runCycle) * 0.8; // Leg swing amplitude
                
                this.leftLeg.rotation.x = swingAngle;
                this.rightLeg.rotation.x = -swingAngle;

                // Opposing arm swings
                this.leftArm.rotation.x = -swingAngle * 0.6;
                this.rightArm.rotation.x = swingAngle * 0.6;
                
                // Keep arm default side rotations
                this.leftArm.rotation.z = 0.2;
                this.rightArm.rotation.z = -0.2;
            }
        }
    }
}
