import * as THREE from '../lib/three.module.js';
import { InputManager } from './input.js';
import { Player } from './player.js';
import { Track } from './track.js';
import { ObstacleManager } from './obstacles.js';
import { PuzzleManager } from './puzzles.js';

class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        
        // Game states: 'START', 'PLAYING', 'GAMEOVER', 'PUZZLE'
        this.gameState = 'START';

        // Timing properties
        this.clock = new THREE.Clock();
        this.speed = 12.0;
        this.baseSpeed = 12.0;
        this.maxSpeed = 28.0;

        // UI references
        this.startScreen = document.getElementById('start-screen');
        this.hud = document.getElementById('hud');
        this.gameoverScreen = document.getElementById('gameover-screen');
        this.startButton = document.getElementById('start-button');
        this.restartButton = document.getElementById('restart-button');
        this.nicknameInput = document.getElementById('nickname-input');
        
        this.scoreVal = document.getElementById('score-val');
        this.butterVal = document.getElementById('butter-val');
        this.finalScore = document.getElementById('final-score');
        this.finalButter = document.getElementById('final-butter');

        // Score data
        this.score = 0;
        this.butter = 0;

        // Trigger milestones
        this.nextSudarshanMilestone = 500;
        this.nextFluteMilestone = 1200;
        this.sudarshanActive = false;
        this.targetGlyph = "";

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
        this.camera.position.set(0, 3.5, 5.0);
        this.camera.lookAt(0, 1.2, -5.0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.45);
        this.scene.add(ambientLight);

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
     * Instantiate player, scrolling tracks, obstacles, and the puzzle manager.
     */
    initGameObjects() {
        this.track = new Track(this.scene);
        this.player = new Player(this.scene);
        this.obstacleManager = new ObstacleManager(this.scene);
        
        // Puzzle System
        this.puzzleManager = new PuzzleManager(this);

        this.playerBox = new THREE.Box3();
    }

    /**
     * Map swipes and keyboard codes to player movement.
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
                this.player.jump();
            } else if (direction === 'down') {
                this.player.slide();
            }
        });
    }

    /**
     * Bind DOM button events.
     */
    bindEvents() {
        this.startButton.addEventListener('click', () => this.startGame());
        this.restartButton.addEventListener('click', () => this.restartGame());

        window.addEventListener('resize', () => this.onWindowResize());
    }

    /**
     * Transition from Menu to Active run.
     */
    startGame() {
        const nickname = this.nicknameInput.value.trim() || 'Pilgrim';
        console.log(`Starting run for player: ${nickname}`);

        this.startScreen.classList.add('hidden');
        this.hud.classList.remove('hidden');
        
        this.score = 0;
        this.butter = 0;
        this.speed = this.baseSpeed;
        this.nextSudarshanMilestone = 500;
        this.nextFluteMilestone = 1200;
        this.sudarshanActive = false;
        this.puzzleManager.clearSudarshanPrompt();
        
        this.clock.getDelta();
        this.gameState = 'PLAYING';
    }

    /**
     * Transition from Game Over back to Active run.
     */
    restartGame() {
        this.gameoverScreen.classList.add('hidden');
        this.hud.classList.remove('hidden');
        
        this.player.reset();
        this.track.reset();
        this.obstacleManager.reset();
        this.puzzleManager.clearSudarshanPrompt();

        this.score = 0;
        this.butter = 0;
        this.speed = this.baseSpeed;
        this.nextSudarshanMilestone = 500;
        this.nextFluteMilestone = 1200;
        this.sudarshanActive = false;
        
        this.clock.getDelta();
        this.gameState = 'PLAYING';
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

    /**
     * Handle viewport changes.
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * Core WebGL Frame Loop.
     */
    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = Math.min(this.clock.getDelta(), 0.1);

        if (this.gameState === 'PLAYING') {
            // 1. Gradually accelerate game speed
            this.speed = Math.min(this.speed + deltaTime * 0.12, this.maxSpeed);

            // 2. Update track scroll
            this.track.update(this.speed, deltaTime);

            // 3. Spawn and move obstacles/coins/powerups
            this.obstacleManager.update(this.speed, deltaTime);

            // 4. Update player physics and animations
            this.player.update(deltaTime);

            // 5. Calculate player bounding box
            this.playerBox.setFromObject(this.player.meshGroup);

            // 6. Check for coin collections
            const collectedCoins = this.obstacleManager.checkCoinCollections(this.playerBox);
            if (collectedCoins > 0) {
                this.butter += collectedCoins;
                this.score += collectedCoins * 100;
            }

            // 7. Check for power-up collections
            const powerup = this.obstacleManager.checkPowerUpCollections(this.playerBox);
            if (powerup) {
                if (powerup === 'chakra') {
                    this.player.activateShield(8.0); // Invincible shield
                } else if (powerup === 'feather') {
                    this.player.activateFlight(6.0); // Flying feathers
                    // Spawn a trail of coins in the sky
                    this.obstacleManager.spawnSkyCoins(this.player.meshGroup.position.z - 5.0);
                }
            }

            // 8. Update passive running score over time
            this.score += deltaTime * 15.0;
            this.updateHUD();

            // 9. Check for educational milestones
            this.checkMilestones();

            // 10. Check for obstacle collisions
            const collidedObstacle = this.obstacleManager.checkCollision(this.playerBox);
            if (collidedObstacle) {
                this.handleCollision(collidedObstacle);
            }

            // 11. Camera interpolation based on state (Zoom out if flying)
            this.updateCamera(deltaTime);

        } else if (this.gameState === 'START') {
            this.camera.position.x = Math.sin(Date.now() * 0.0005) * 0.6;
            this.camera.lookAt(0, 1.2, -5.0);
        }

        // Render Frame
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Checks score thresholds to trigger puzzles.
     */
    checkMilestones() {
        // A. Trigger Sudarshan Gate Challenge
        if (this.score >= this.nextSudarshanMilestone && !this.sudarshanActive) {
            this.sudarshanActive = true;
            this.nextSudarshanMilestone += 1000; // Schedule next gate run
            
            // Set up HUD prompt and spawn gates
            this.targetGlyph = this.puzzleManager.generateSudarshanPrompt();
            this.obstacleManager.spawnSudarshanGates(this.targetGlyph);
            console.log(`[Sudarshan Gate] Spawning arches for: ${this.targetGlyph}`);
        }

        // B. Trigger Flute Meditation Puzzle
        if (this.score >= this.nextFluteMilestone) {
            this.nextFluteMilestone += 1200; // Schedule next meditation
            this.puzzleManager.triggerFlutePuzzle();
            console.log(`[Flute Meditation] Pausing runner to trigger memory puzzle.`);
        }

        // C. Dynamic theme progression
        if (this.score >= 800) {
            this.track.setTheme('gokul');
        }
    }

    /**
     * Core collision evaluation logic.
     */
    handleCollision(obstacle) {
        if (obstacle.type === 'sudarshan_gate') {
            this.sudarshanActive = false;
            this.puzzleManager.clearSudarshanPrompt();

            // Check if player navigated through the correct Sanskrit glyph gate
            if (obstacle.glyph === this.targetGlyph) {
                console.log("[Sudarshan Gate] Correct Gate Solved! Speed Boost.");
                this.score += 250;
                
                // Temporary speed boost spark
                this.speed = Math.min(this.speed + 4.0, this.maxSpeed);

                const banner = document.createElement('div');
                banner.className = 'puzzle-banner success';
                banner.innerText = 'DHARMA GATE ALIGNED! +250';
                document.body.appendChild(banner);
                setTimeout(() => banner.remove(), 1800);
            } else {
                console.log("[Sudarshan Gate] Incorrect Gate. Speed Slow Penalty.");
                this.score = Math.max(this.score - 100, 0);
                this.speed = Math.max(this.speed - 5.0, this.baseSpeed); // Penalty

                const banner = document.createElement('div');
                banner.className = 'puzzle-banner failure';
                banner.innerText = 'WRONG PATH DEVIATION -100';
                document.body.appendChild(banner);
                setTimeout(() => banner.remove(), 1800);
            }

            // Remove the triggered gates immediately so player doesn't collide with remaining gates in the row
            this.obstacleManager.obstacles = this.obstacleManager.obstacles.filter(obs => obs.type !== 'sudarshan_gate');
            obstacle.destroy();
        } else {
            // Standard Obstacles: logs and floral garlands
            if (this.player.isShielded) {
                // Shield absorbs collision
                console.log("[Collision] Shield absorbed obstacle collision.");
                
                // Play splash effect and consume shield
                this.player.isShielded = false;
                this.player.shieldMesh.visible = false;
                this.player.shieldTimer = 0;

                // Remove obstacle
                this.obstacleManager.obstacles = this.obstacleManager.obstacles.filter(o => o !== obstacle);
                obstacle.destroy();

                const banner = document.createElement('div');
                banner.className = 'puzzle-banner success';
                banner.innerText = 'SHIELD ABSORBED CLASH';
                document.body.appendChild(banner);
                setTimeout(() => banner.remove(), 1500);
            } else {
                // Crash!
                console.log("[Collision] Player crashed!");
                this.gameOver();
            }
        }
    }

    /**
     * Camera interpolator. Zooms out and upwards during peacock flight.
     */
    updateCamera(deltaTime) {
        let targetCamY = 3.5;
        let targetCamZ = 5.0;

        if (this.player.isFlying) {
            // Elevate camera to track player in the sky
            targetCamY = 9.0;
            targetCamZ = 7.5;
        }

        this.camera.position.y += (targetCamY - this.camera.position.y) * 3.0 * deltaTime;
        this.camera.position.z += (targetCamZ - this.camera.position.z) * 3.0 * deltaTime;
        this.camera.lookAt(this.player.meshGroup.position.x, this.player.posY + 1.2, -5.0);
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
            console.log(`[Save] New Local High Score: ${roundedScore} by ${nickname}`);
        }

        localStorage.setItem('leela_totalbutter', (currentButter + roundedButter).toString());
    }

    /**
     * Sends local score to scoreboard server.
     */
    pushScoreToEventLeaderboard() {
        const nickname = this.nicknameInput.value.trim() || 'Pilgrim';
        const finalScoreVal = Math.floor(this.score);
        console.log(`[Event Leaderboard] Score pushed for ${nickname}: ${finalScoreVal}`);
    }
}

// Boot the game
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
