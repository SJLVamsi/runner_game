import * as THREE from '../lib/three.module.js';
import { InputManager } from './input.js';
import { Player } from './player.js';
import { Track } from './track.js';
import { ObstacleManager } from './obstacles.js';
import { PuzzleManager } from './puzzles.js';
import { Sanctuary } from './sanctuary.js';
import { ParticleSystem, SoundFXManager } from './effects.js';

class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        
        // Game states: 'START', 'INTRO', 'PLAYING', 'GAMEOVER', 'PUZZLE'
        this.gameState = 'START';

        // Timing properties
        this.clock = new THREE.Clock();
        this.speed = 12.0;
        this.baseSpeed = 12.0;
        this.maxSpeed = 28.0;

        // UI Panel references
        this.startScreen = document.getElementById('start-screen');
        this.hud = document.getElementById('hud');
        this.gameoverScreen = document.getElementById('gameover-screen');
        this.sanctuaryPanel = document.getElementById('sanctuary-panel');
        this.scrollsPanel = document.getElementById('scrolls-panel');
        this.scrollReader = document.getElementById('scroll-reader');

        // Buttons
        this.startButton = document.getElementById('start-button');
        this.restartButton = document.getElementById('restart-button');
        this.sanctuaryButton = document.getElementById('sanctuary-btn');
        this.scrollsButton = document.getElementById('scrolls-btn');
        this.closeSanctuaryButton = document.getElementById('close-sanctuary');
        this.closeScrollsButton = document.getElementById('close-scrolls');
        this.closeReaderButton = document.getElementById('close-reader');

        this.nicknameInput = document.getElementById('nickname-input');
        this.scoreVal = document.getElementById('score-val');
        this.butterVal = document.getElementById('butter-val');
        this.sancButterVal = document.getElementById('sanc-butter-val');
        this.finalScore = document.getElementById('final-score');
        this.finalButter = document.getElementById('final-butter');

        // Score data
        this.score = 0;
        this.butter = 0;

        // Milestones
        this.nextSudarshanMilestone = 500;
        this.nextFluteMilestone = 1200;
        this.sudarshanActive = false;
        this.targetGlyph = "";

        // Intro Camera properties
        this.introCamTargetPos = new THREE.Vector3(0, 3.5, 5.0);
        this.introCamTargetLook = new THREE.Vector3(0, 1.2, -5.0);

        // AAA Camera Shake Properties
        this.shakeIntensity = 0.0;
        this.shakeDecay = 4.0; // Decay rate per second

        // Establish single AudioContext (BUG-005 Fix)
        this.audioCtx = null;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        } catch (e) {
            console.warn("Web Audio Context not supported.");
        }

        // Establish Event WebSocket connection (with offline fallback)
        this.socket = null;
        if (typeof io !== 'undefined') {
            this.socket = io();
            this.socket.on('connect', () => console.log('[Socket] Synchronized with local scoreboard server.'));
            this.socket.on('submission_rejected', (data) => {
                console.warn(`[Socket] Submission rejected: ${data.reason}`);
                const banner = document.createElement('div');
                banner.className = 'puzzle-banner failure';
                banner.innerText = `INTEGRITY CHECK REJECTED`;
                document.body.appendChild(banner);
                setTimeout(() => banner.remove(), 2500);
            });
        } else {
            console.log('[Socket] Standalone Offline play active.');
        }

        this.initThreeJS();
        this.initGameObjects();
        this.initInput();
        this.bindEvents();

        // Start render loop
        this.animate();
    }

    /**
     * Set up scene, camera, lights, and shadow renderer.
     */
    initThreeJS() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xF4EBD0);
        this.scene.fog = new THREE.FogExp2(0xF4EBD0, 0.015);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(15.0, 3.0, -5.0);
        this.camera.lookAt(15.0, 0.8, -10.0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Soft sky lighting & warm orange ground bounce (AAA visual ambient glow)
        const hemiLight = new THREE.HemisphereLight(0xB1E1FF, 0xB97A20, 0.5);
        this.scene.add(hemiLight);

        this.sunLight = new THREE.DirectionalLight(0xFFFFFF, 0.7);
        this.sunLight.position.set(5, 12, 3);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 1024;
        this.sunLight.shadow.mapSize.height = 1024;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 25;
        this.sunLight.shadow.camera.left = -5;
        this.sunLight.shadow.camera.right = 5;
        this.sunLight.shadow.camera.top = 5;
        this.sunLight.shadow.camera.bottom = -5;
        this.scene.add(this.sunLight);
    }

    /**
     * Instantiate game objects and pass the shared AudioContext (BUG-005 Fix).
     */
    initGameObjects() {
        this.track = new Track(this.scene);
        this.player = new Player(this.scene);
        this.obstacleManager = new ObstacleManager(this.scene);
        
        this.puzzleManager = new PuzzleManager(this, this.audioCtx);
        this.sanctuary = new Sanctuary(this.scene);

        this.particles = new ParticleSystem(this.scene);
        this.sfx = new SoundFXManager(this.audioCtx);

        this.playerBox = new THREE.Box3();
    }

    /**
     * Map controls to player movement.
     */
    initInput() {
        this.inputManager = new InputManager();
        this.inputManager.registerAction((direction) => {
            if (this.gameState !== 'PLAYING') return;

            if (direction === 'left') {
                this.player.moveLeft();
            } else if (direction === 'right') {
                this.player.moveRight();
            } else if (direction === 'up') {
                if (!this.player.isJumping && !this.player.isSliding && !this.player.isFlying) {
                    this.sfx.playJump();
                    this.player.jump();
                }
            } else if (direction === 'down') {
                if (!this.player.isJumping && !this.player.isSliding && !this.player.isFlying) {
                    this.sfx.playSlide();
                    this.player.slide();
                }
            }
        });
    }

    /**
     * Bind DOM button events.
     */
    bindEvents() {
        this.startButton.addEventListener('click', () => this.triggerIntroTransition());
        this.restartButton.addEventListener('click', () => this.restartGame());
        
        this.sanctuaryButton.addEventListener('click', () => this.openSanctuaryDashboard());
        this.closeSanctuaryButton.addEventListener('click', () => this.closeSanctuaryDashboard());
        
        this.scrollsButton.addEventListener('click', () => this.openScrollsLibrary());
        this.closeScrollsButton.addEventListener('click', () => this.closeScrollsLibrary());
        this.closeReaderButton.addEventListener('click', () => this.closeScrollReader());

        this.sanctuaryPanel.querySelectorAll('.restore-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const key = e.target.getAttribute('data-key');
                this.attemptMonumentRestoration(key);
            });
        });

        window.addEventListener('resize', () => this.onWindowResize());
    }

    /**
     * Helper to initiate high frequency camera shakes.
     * @param {number} intensity - Amplitude scaling factor.
     */
    triggerCameraShake(intensity) {
        this.shakeIntensity = intensity;
    }

    /**
     * Triggers camera intro transition.
     */
    triggerIntroTransition() {
        this.startScreen.classList.add('hidden');
        this.gameState = 'INTRO';
    }

    /**
     * Start the runner mechanics.
     */
    startGame() {
        this.hud.classList.remove('hidden');
        
        this.score = 0;
        this.butter = 0;
        this.speed = this.baseSpeed;
        this.nextSudarshanMilestone = 500;
        this.nextFluteMilestone = 1200;
        this.sudarshanActive = false;
        
        if (this.socket) {
            this.socket.emit('start_run');
            console.log('[Socket] start_run signal emitted to server.');
        }

        this.particles.reset();
        this.clock.getDelta();
        this.gameState = 'PLAYING';
    }

    /**
     * Transition from Game Over back to Menu.
     */
    restartGame() {
        this.gameoverScreen.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
        
        this.player.reset();
        this.track.reset();
        this.obstacleManager.reset();
        this.puzzleManager.clearSudarshanPrompt();
        this.particles.reset();

        // Restore default camera configuration
        this.camera.fov = 60;
        this.camera.updateProjectionMatrix();

        this.camera.position.set(15.0, 3.0, -5.0);
        this.camera.lookAt(15.0, 0.8, -10.0);

        this.gameState = 'START';
    }

    /**
     * Triggers collision failure.
     */
    gameOver() {
        this.gameState = 'GAMEOVER';

        this.hud.classList.add('hidden');
        this.gameoverScreen.classList.remove('hidden');
        this.puzzleManager.clearSudarshanPrompt();

        this.finalScore.innerText = Math.floor(this.score);
        this.finalButter.innerText = Math.floor(this.butter);

        this.saveStatsOffline();
        this.pushScoreToEventLeaderboard();
    }

    /* =========================================================================
       SANCTUARY METAGAME & PROGRESS FUNCTIONS
       ========================================================================= */

    openSanctuaryDashboard() {
        this.startScreen.classList.add('hidden');
        this.sanctuaryPanel.classList.remove('hidden');
        this.refreshSanctuaryUI();
    }

    closeSanctuaryDashboard() {
        this.sanctuaryPanel.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
    }

    refreshSanctuaryUI() {
        const totalButter = parseInt(localStorage.getItem('leela_totalbutter') || '0', 10);
        this.sancButterVal.innerText = totalButter;

        Object.keys(this.sanctuary.monuments).forEach(key => {
            const data = this.sanctuary.monuments[key];
            const card = document.getElementById(`card-${key}`);
            const statusSpan = card.querySelector('.mon-status');
            const restoreBtn = card.querySelector('.restore-btn');

            if (data.restored) {
                statusSpan.innerText = "RESTORED";
                statusSpan.className = "mon-status text-unlocked";
                restoreBtn.classList.add('hidden');
            } else {
                statusSpan.innerText = "RUINED";
                statusSpan.className = "mon-status text-locked";
                restoreBtn.classList.remove('hidden');
                
                if (totalButter < data.cost) {
                    restoreBtn.style.opacity = '0.5';
                } else {
                    restoreBtn.style.opacity = '1.0';
                }
            }
        });
    }

    attemptMonumentRestoration(key) {
        const data = this.sanctuary.monuments[key];
        if (!data || data.restored) return;

        const totalButter = parseInt(localStorage.getItem('leela_totalbutter') || '0', 10);
        
        if (totalButter >= data.cost) {
            const newTotal = totalButter - data.cost;
            localStorage.setItem('leela_totalbutter', newTotal.toString());

            this.sanctuary.restoreMonument(key);
            this.refreshSanctuaryUI();
            this.sfx.playCollect();

            const offsetPos = this.sanctuary.meshGroup.position.clone().add(
                this.sanctuary.monuments[key].mesh.position
            );
            this.particles.spawnBurst(offsetPos, 0xFFD700, 20);

            const banner = document.createElement('div');
            banner.className = 'puzzle-banner success';
            banner.innerText = `${data.name.toUpperCase()} RESTORED!`;
            document.body.appendChild(banner);
            setTimeout(() => banner.remove(), 2000);
        } else {
            this.sfx.playCrash();

            const banner = document.createElement('div');
            banner.className = 'puzzle-banner failure';
            banner.innerText = `REQUIRES ${data.cost} MAKHAN POTS!`;
            document.body.appendChild(banner);
            setTimeout(() => banner.remove(), 1800);
        }
    }

    /* =========================================================================
       SCROLLS LIBRARY & READER FUNCTIONS
       ========================================================================= */

    openScrollsLibrary() {
        this.startScreen.classList.add('hidden');
        this.scrollsPanel.classList.remove('hidden');

        const listDiv = document.getElementById('scrolls-list');
        listDiv.innerHTML = '';

        Object.keys(this.sanctuary.monuments).forEach(key => {
            const data = this.sanctuary.monuments[key];
            
            const card = document.createElement('div');
            card.className = data.restored ? 'scroll-card' : 'scroll-card locked';
            
            card.innerHTML = `
                <div class="scroll-icon">${data.restored ? '📜' : '🔒'}</div>
                <div class="scroll-title">${data.restored ? data.story.title : 'Locked Memory'}</div>
                <div class="scroll-subtitle" style="font-size:0.7rem;color:#888;">
                    ${data.restored ? 'Tap to read' : `Restore ${data.name}`}
                </div>
            `;

            if (data.restored) {
                card.addEventListener('click', () => {
                    this.sfx.playCollect();
                    this.openScrollReader(data.story);
                });
            }
            listDiv.appendChild(card);
        });
    }

    closeScrollsLibrary() {
        this.scrollsPanel.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
    }

    openScrollReader(storyData) {
        this.scrollsPanel.classList.add('hidden');
        this.scrollReader.classList.remove('hidden');

        document.getElementById('reader-title').innerText = storyData.title;
        document.getElementById('reader-text').innerText = storyData.text;
        document.getElementById('reader-moral').innerText = storyData.moral;
    }

    closeScrollReader() {
        this.scrollReader.classList.add('hidden');
        this.scrollsPanel.classList.remove('hidden');
    }

    /* =========================================================================
       CORE ENGINE GAME TICK UPDATES
       ========================================================================= */

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = Math.min(this.clock.getDelta(), 0.1);

        if (this.gameState === 'PLAYING') {
            this.speed = Math.min(this.speed + deltaTime * 0.12, this.maxSpeed);

            this.track.update(this.speed, deltaTime);
            this.obstacleManager.update(this.speed, deltaTime);
            this.player.update(deltaTime);
            this.particles.update(deltaTime);

            // Force world coordinate updates
            this.player.meshGroup.updateMatrixWorld(true);
            this.obstacleManager.obstacles.forEach(obs => obs.mesh.updateMatrixWorld(true));
            this.obstacleManager.coins.forEach(coin => coin.mesh.updateMatrixWorld(true));
            this.obstacleManager.powerups.forEach(p => p.mesh.updateMatrixWorld(true));

            // Compute player bounding box
            this.playerBox.setFromObject(this.player.meshGroup);

            // Coin collections
            const collectedCoins = this.obstacleManager.checkCoinCollections(this.playerBox);
            if (collectedCoins > 0) {
                this.butter += collectedCoins;
                this.score += collectedCoins * 100;
                
                this.sfx.playCollect();
                
                // Spawn golden sparkle particles
                const coinPos = this.player.meshGroup.position.clone();
                coinPos.y += 0.4;
                this.particles.spawnBurst(coinPos, 0xFFD700, 5);
            }

            // Powerup collections
            const powerup = this.obstacleManager.checkPowerUpCollections(this.playerBox);
            if (powerup) {
                this.sfx.playCollect();
                this.triggerCameraShake(0.15); // Collect shake
                
                const pupPos = this.player.meshGroup.position.clone();
                pupPos.y += 0.5;
                this.particles.spawnBurst(pupPos, 0x00FFFF, 12);

                if (powerup === 'chakra') {
                    this.player.activateShield(8.0);
                } else if (powerup === 'feather') {
                    this.player.activateFlight(6.0);
                    this.obstacleManager.spawnSkyCoins(this.player.meshGroup.position.z - 5.0);
                }
            }

            this.score += deltaTime * 15.0;
            this.updateHUD();

            this.checkMilestones();

            const collidedObstacle = this.obstacleManager.checkCollision(this.playerBox);
            if (collidedObstacle) {
                this.handleCollision(collidedObstacle);
            }

            this.updateCamera(deltaTime);

        } else if (this.gameState === 'START') {
            const time = Date.now() * 0.0003;
            this.camera.position.set(
                15.0 + Math.sin(time) * 6.5,
                3.2,
                -10.0 + Math.cos(time) * 6.5
            );
            this.camera.lookAt(15.0, 0.8, -10.0);
            
            this.sanctuary.update(deltaTime);
            this.particles.update(deltaTime);
        } else if (this.gameState === 'INTRO') {
            this.camera.position.lerp(this.introCamTargetPos, deltaTime * 3.5);
            
            const currentLook = new THREE.Vector3(15.0, 0.8, -10.0);
            currentLook.lerp(this.introCamTargetLook, deltaTime * 3.5);
            this.camera.lookAt(currentLook);

            if (this.camera.position.distanceTo(this.introCamTargetPos) < 0.1) {
                this.camera.position.copy(this.introCamTargetPos);
                this.camera.lookAt(this.introCamTargetLook);
                
                // Transition to gameplay
                this.startGame();
            }
        }

        // Render Frame
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Checks score thresholds to trigger puzzles.
     */
    checkMilestones() {
        if (this.score >= this.nextSudarshanMilestone && !this.sudarshanActive) {
            this.sudarshanActive = true;
            this.nextSudarshanMilestone += 1000;
            
            this.targetGlyph = this.puzzleManager.generateSudarshanPrompt();
            this.obstacleManager.spawnSudarshanGates(this.targetGlyph);
        }

        if (this.score >= this.nextFluteMilestone) {
            this.nextFluteMilestone += 1200;
            this.puzzleManager.triggerFlutePuzzle();
        }

        if (this.score >= 800) {
            this.track.setTheme('gokul');
        }
    }

    /**
     * Core collision evaluation logic with Camera Shake.
     */
    handleCollision(obstacle) {
        if (obstacle.type === 'sudarshan_gate') {
            this.sudarshanActive = false;
            this.puzzleManager.clearSudarshanPrompt();

            const gatePos = obstacle.mesh.position.clone();
            gatePos.y += 1.8;

            if (obstacle.glyph === this.targetGlyph) {
                console.log("[Sudarshan Gate] Correct Gate Solved! Speed Boost.");
                this.score += 250;
                this.speed = Math.min(this.speed + 4.0, this.maxSpeed);
                this.sfx.playCollect();

                this.triggerCameraShake(0.12); // Correct gate micro-shake
                this.particles.spawnBurst(gatePos, 0x4CAF50, 16);

                const banner = document.createElement('div');
                banner.className = 'puzzle-banner success';
                banner.innerText = 'DHARMA GATE ALIGNED! +250';
                document.body.appendChild(banner);
                setTimeout(() => banner.remove(), 1800);
            } else {
                console.log("[Sudarshan Gate] Incorrect Gate. Speed Slow Penalty.");
                this.score = Math.max(this.score - 100, 0);
                this.speed = Math.max(this.speed - 5.0, this.baseSpeed);
                this.sfx.playCrash();

                this.triggerCameraShake(0.25); // Wrong gate shake
                this.particles.spawnBurst(gatePos, 0xF44336, 12);

                const banner = document.createElement('div');
                banner.className = 'puzzle-banner failure';
                banner.innerText = 'WRONG PATH DEVIATION -100';
                document.body.appendChild(banner);
                setTimeout(() => banner.remove(), 1800);
            }

            this.obstacleManager.obstacles = this.obstacleManager.obstacles.filter(obs => obs.type !== 'sudarshan_gate');
            obstacle.destroy();
        } else {
            const crashPos = this.player.meshGroup.position.clone();
            crashPos.y += 0.8;

            if (this.player.isShielded) {
                console.log("[Collision] Shield absorbed obstacle collision.");
                
                this.player.isShielded = false;
                this.player.shieldMesh.visible = false;
                this.player.shieldTimer = 0;

                this.sfx.playCrash();
                this.triggerCameraShake(0.35); // Shield absorb vibration
                this.particles.spawnBurst(crashPos, 0xFFD700, 18);

                this.obstacleManager.obstacles = this.obstacleManager.obstacles.filter(o => o !== obstacle);
                obstacle.destroy();

                const banner = document.createElement('div');
                banner.className = 'puzzle-banner success';
                banner.innerText = 'SHIELD ABSORBED CLASH';
                document.body.appendChild(banner);
                setTimeout(() => banner.remove(), 1500);
            } else {
                console.log("[Collision] Player crashed!");
                this.sfx.playCrash();
                this.triggerCameraShake(0.65); // High impact crash shake

                this.particles.spawnBurst(crashPos, 0x3A9EDB, 20);
                this.particles.spawnBurst(crashPos, 0xECC81A, 15);
                
                this.gameOver();
            }
        }
    }

    /**
     * Camera interpolator with dynamic FOV speed tunnel and high frequency shake.
     */
    updateCamera(deltaTime) {
        let targetCamY = 3.5;
        let targetCamZ = 5.0;

        if (this.player.isFlying) {
            targetCamY = 9.0;
            targetCamZ = 7.5;
        }

        // 1. Interpolate position coordinates
        this.camera.position.y += (targetCamY - this.camera.position.y) * 3.0 * deltaTime;
        this.camera.position.z += (targetCamZ - this.camera.position.z) * 3.0 * deltaTime;
        this.camera.lookAt(this.player.meshGroup.position.x, this.player.posY + 1.2, -5.0);

        // 2. AAA speed trail Dynamic FOV (Widen from 60 to 75 degrees)
        const targetFOV = this.player.isFlying ? 72 : 60 + (this.speed - this.baseSpeed) * 0.8;
        this.camera.fov += (targetFOV - this.camera.fov) * 5.0 * deltaTime;
        this.camera.updateProjectionMatrix();

        // 3. Apply Camera Shake displacement
        if (this.shakeIntensity > 0.01) {
            const offsetX = (Math.random() - 0.5) * this.shakeIntensity;
            const offsetY = (Math.random() - 0.5) * this.shakeIntensity;
            
            this.camera.position.x += offsetX;
            this.camera.position.y += offsetY;
            
            // Decelerate shake
            this.shakeIntensity -= this.shakeDecay * deltaTime;
        } else {
            this.shakeIntensity = 0.0;
        }
    }

    /**
     * Updates screen HUD indicators.
     */
    updateHUD() {
        this.scoreVal.innerText = Math.floor(this.score);
        this.butterVal.innerText = Math.floor(this.butter);
    }

    /**
     * Stores high scores locally in browser memory.
     */
    saveStatsOffline() {
        const nickname = this.nicknameInput.value.trim() || 'Pilgrim';
        const roundedScore = Math.floor(this.score);
        const roundedButter = Math.floor(this.butter);

        const currentHigh = parseInt(localStorage.getItem('leela_highscore') || '0', 10);
        const currentButter = parseInt(localStorage.getItem('leela_totalbutter') || '0', 10);

        if (roundedScore > currentHigh) {
            localStorage.setItem('leela_highscore', roundedScore.toString());
            localStorage.setItem('leela_highname', nickname);
        }

        localStorage.setItem('leela_totalbutter', (currentButter + roundedButter).toString());
    }

    /**
     * Sends local score to the projected scoreboard server.
     */
    pushScoreToEventLeaderboard() {
        const nickname = this.nicknameInput.value.trim() || 'Pilgrim';
        const finalScoreVal = Math.floor(this.score);
        const finalButterVal = Math.floor(this.butter);

        console.log(`[Leaderboard API] Pushing score: ${finalScoreVal} for ${nickname}`);
        
        if (this.socket) {
            this.socket.emit('submit_score', {
                name: nickname,
                score: finalScoreVal,
                butter: finalButterVal
            });
        }
    }
}

// Boot the game
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
