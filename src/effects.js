import * as THREE from '../lib/three.module.js';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        
        // Single shared geometry for performance
        this.particleGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    }

    /**
     * Spawns a burst of fading 3D particles at the target coordinates.
     * @param {THREE.Vector3|object} pos - Origin coordinate.
     * @param {number} hexColor - Hex color value (e.g. 0xFFD700).
     * @param {number} count - Number of particles.
     */
    spawnBurst(pos, hexColor, count = 8) {
        const material = new THREE.MeshBasicMaterial({ 
            color: hexColor, 
            transparent: true,
            opacity: 1.0 
        });

        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(this.particleGeo, material.clone());
            mesh.position.set(pos.x, pos.y, pos.z);
            this.scene.add(mesh);

            // Random 3D velocity vectors
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 6.0,
                (Math.random() * 5.0) + 2.0, // Upward bias
                (Math.random() - 0.5) * 6.0
            );

            this.particles.push({
                mesh,
                velocity,
                life: 1.0,
                decay: (Math.random() * 1.5) + 1.5 // Decay rate per second
            });
        }
    }

    /**
     * Translates active particles, applies gravity, and fades opacity.
     */
    update(deltaTime) {
        const gravity = 9.8;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Apply physics
            p.velocity.y -= gravity * deltaTime;
            p.mesh.position.addScaledVector(p.velocity, deltaTime);
            
            // Spin particles
            p.mesh.rotation.x += deltaTime * 5;
            p.mesh.rotation.y += deltaTime * 5;

            // Decay life and fade opacity
            p.life -= p.decay * deltaTime;
            p.mesh.material.opacity = Math.max(p.life, 0);

            // Cleanup when dead
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * Clears all particles immediately.
     */
    reset() {
        this.particles.forEach(p => {
            this.scene.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
        });
        this.particles = [];
    }
}

export class SoundFXManager {
    constructor() {
        this.audioCtx = null;
        this.initContext();
    }

    initContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        } catch (e) {
            console.warn("Web Audio API not supported.");
        }
    }

    resume() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    /**
     * Short upward chime for pot collection.
     */
    playCollect() {
        if (!this.audioCtx) return;
        this.resume();

        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.type = 'sine';
        
        // Frequency sweep from C5 (523Hz) to E5 (659Hz)
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.start(now);
        osc.stop(now + 0.12);

        setTimeout(() => {
            osc.disconnect();
            gain.disconnect();
        }, 200);
    }

    /**
     * Upward pitch sweep for jumping.
     */
    playJump() {
        if (!this.audioCtx) return;
        this.resume();

        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.type = 'triangle'; // Warm sound

        // Sweep from C3 (130Hz) to G3 (196Hz)
        osc.frequency.setValueAtTime(130.81, now);
        osc.frequency.linearRampToValueAtTime(196.00, now + 0.15);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.start(now);
        osc.stop(now + 0.2);

        setTimeout(() => {
            osc.disconnect();
            gain.disconnect();
        }, 250);
    }

    /**
     * Downward pitch sweep for sliding.
     */
    playSlide() {
        if (!this.audioCtx) return;
        this.resume();

        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.type = 'sawtooth'; // Slight friction buzz

        // Low pass filter to make the sawtooth sound softer
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);
        
        osc.disconnect();
        osc.connect(filter);
        filter.connect(gain);

        // Sweep down from G3 (196Hz) to C3 (130Hz)
        osc.frequency.setValueAtTime(196.00, now);
        osc.frequency.linearRampToValueAtTime(110.00, now + 0.2);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.start(now);
        osc.stop(now + 0.28);

        setTimeout(() => {
            osc.disconnect();
            filter.disconnect();
            gain.disconnect();
        }, 350);
    }

    /**
     * Low frequency crash noise.
     */
    playCrash() {
        if (!this.audioCtx) return;
        this.resume();

        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.type = 'sawtooth';

        // Filter sweep
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.exponentialRampToValueAtTime(30, now + 0.35);

        osc.disconnect();
        osc.connect(filter);
        filter.connect(gain);

        osc.frequency.setValueAtTime(100.0, now);
        osc.frequency.linearRampToValueAtTime(40.0, now + 0.35);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.start(now);
        osc.stop(now + 0.42);

        setTimeout(() => {
            osc.disconnect();
            filter.disconnect();
            gain.disconnect();
        }, 500);
    }
}
