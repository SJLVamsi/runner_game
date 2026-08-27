import * as THREE from '../lib/three.module.js';
import { InputManager } from './input.js';
import { Player } from './player.js';
import { Track } from './track.js';
import { ObstacleManager } from './obstacles.js';

class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        
        // Game states: 'START', 'PLAYING', 'GAMEOVER'
        this.gameState = 'START';

        // Timing properties
        this.clock = new THREE.Clock();
        this.speed = 12.0;       // Starting speed
        this.baseSpeed = 12.0;   // Base speed reference
        this.maxSpeed = 28.0;    // Cap on game speed

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
        // 1. Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xF4EBD0); // Soft Ivory background
        this.scene.fog = new THREE.FogExp2(0xF4EBD0, 0.015); // Add atmosphere fog

        // 2. Camera setup
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
        
        // Classic runner perspective: behind and slightly above the player, looking down track
        this.camera.position.set(0, 3.5, 5.0);
        this.camera.lookAt(0, 1.2, -5.0);

        // 3. Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // 4. Lighting
        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.45);
        this.scene.add(ambientLight);

        this.sunLight = new THREE.DirectionalLight(0xFFFFFF, 0.7);
        this.sunLight.position.set(5, 12, 3);
        this.sunLight.castShadow = true;
        
        // Shadow configuration for optimal quality/performance
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
     * Instantiate player, scrolling tracks, and obstacles.
     */
    initGameObjects() {
        this.track = new Track(this.scene);
        this.player = new Player(this.scene);
        this.obstacleManager = new ObstacleManager(this.scene);

        // Bounding box for checking player collisions
        this.playerBox = new THREE.Box3();
    }

    /**
     * Map swipes and keyboard codes directly to player movement methods.
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
     * Bind DOM button events and resize listeners.
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
        
        // Reset timers and state variables
        this.score = 0;
        this.butter = 0;
        this.speed = this.baseSpeed;
        this.clock.getDelta(); // Clears clock baseline
        
        this.gameState = 'PLAYING';
    }

    /**
     * Transition from Game Over back to Active run.
     */
    restartGame() {
        this.gameoverScreen.classList.add('hidden');
        this.hud.classList.remove('hidden');
        
        // Reset objects
        this.player.reset();
        this.track.reset();
        this.obstacleManager.reset();

        this.score = 0;
        this.butter = 0;
        this.speed = this.baseSpeed;
        this.clock.getDelta();

        this.gameState = 'PLAYING';
    }

    /**
     * Triggers collision failure, updating high scores.
     */
    gameOver() {
        this.gameState = 'GAMEOVER';

        this.hud.classList.add('hidden');
        this.gameoverScreen.classList.remove('hidden');

        // Update statistics displays
        this.finalScore.innerText = Math.floor(this.score);
        this.finalButter.innerText = Math.floor(this.butter);

        // Attempt score push to live venue leaderboard (local WebSocket placeholder)
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

        const deltaTime = Math.min(this.clock.getDelta(), 0.1); // Cap delta to prevent clipping on tab switch

        if (this.gameState === 'PLAYING') {
            // 1. Gradually accelerate game speed
            this.speed = Math.min(this.speed + deltaTime * 0.12, this.maxSpeed);

            // 2. Update track scroll
            this.track.update(this.speed, deltaTime);

            // 3. Spawn, move, and recycle obstacles
            this.obstacleManager.update(this.speed, deltaTime);

            // 4. Update player physics and animations
            this.player.update(deltaTime);

            // 5. Update scoring & currency
            this.score += deltaTime * 18.0;
            this.butter += deltaTime * 2.2;
            this.updateHUD();

            // 6. Check for collisions
            this.playerBox.setFromObject(this.player.meshGroup);
            
            const collidedObstacleType = this.obstacleManager.checkCollision(this.playerBox);
            if (collidedObstacleType) {
                console.log(`Collided with: ${collidedObstacleType} obstacle!`);
                this.gameOver();
            }
        } else if (this.gameState === 'START') {
            // Idle background animation (gently oscillate lights / rotate camera slightly)
            this.camera.position.x = Math.sin(Date.now() * 0.0005) * 0.6;
            this.camera.lookAt(0, 1.2, -5.0);
        }

        // Render Frame
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Updates screen HUD indicators.
     */
    updateHUD() {
        this.scoreVal.innerText = Math.floor(this.score);
        this.butterVal.innerText = Math.floor(this.butter);
    }

    /**
     * Sends local score to the projected scoreboard server (Socket.io hook).
     */
    pushScoreToEventLeaderboard() {
        const nickname = this.nicknameInput.value.trim() || 'Pilgrim';
        const finalScoreVal = Math.floor(this.score);
        console.log(`[Event Leaderboard] Score pushed for ${nickname}: ${finalScoreVal}`);
        
        // Note: Socket.io connection instance will be integrated in Sprint 6.
    }
}

// Boot the game
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
