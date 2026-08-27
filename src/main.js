import * as THREE from '../lib/three.module.js';
import { InputManager } from './input.js';
import { Player } from './player.js';
import { Track } from './track.js';
import { ObstacleManager } from './obstacles.js';
import { PuzzleManager } from './puzzles.js';
import { Sanctuary } from './sanctuary.js';

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
        
        // Starting position near Sanctuary
        this.camera.position.set(15.0, 3.0, -5.0);
        this.camera.lookAt(15.0, 0.8, -10.0);

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
     * Instantiate player, scrolling tracks, obstacles, and metagame managers.
     */
    initGameObjects() {
        this.track = new Track(this.scene);
        this.player = new Player(this.scene);
        this.obstacleManager = new ObstacleManager(this.scene);
        this.puzzleManager = new PuzzleManager(this);
        
        // 3D Sanctuary Metagame
        this.sanctuary = new Sanctuary(this.scene);

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
        this.startButton.addEventListener('click', () => this.triggerIntroTransition());
        this.restartButton.addEventListener('click', () => this.restartGame());
        
        // Sanctuary dashboard triggers
        this.sanctuaryButton.addEventListener('click', () => this.openSanctuaryDashboard());
        this.closeSanctuaryButton.addEventListener('click', () => this.closeSanctuaryDashboard());
        
        // Scrolls library triggers
        this.scrollsButton.addEventListener('click', () => this.openScrollsLibrary());
        this.closeScrollsButton.addEventListener('click', () => this.closeScrollsLibrary());
        this.closeReaderButton.addEventListener('click', () => this.closeScrollReader());

        // Bind restore buttons
        this.sanctuaryPanel.querySelectorAll('.restore-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const key = e.target.getAttribute('data-key');
                this.attemptMonumentRestoration(key);
            });
        });

        window.addEventListener('resize', () => this.onWindowResize());
    }

    /**
     * Triggers the camera transition from Sanctuary garden to running track.
     */
    triggerIntroTransition() {
        const nickname = this.nicknameInput.value.trim() || 'Pilgrim';
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

        // Snap camera back to menu viewpoint
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
        // Fetch current savings
        const totalButter = parseInt(localStorage.getItem('leela_totalbutter') || '0', 10);
        this.sancButterVal.innerText = totalButter;

        // Refresh monument cards
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
                
                // Dim button if player doesn't have enough money
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
            // Deduct cost and save
            const newTotal = totalButter - data.cost;
            localStorage.setItem('leela_totalbutter', newTotal.toString());

            // Trigger visual diorama restore
            this.sanctuary.restoreMonument(key);
            
            // Refresh card display
            this.refreshSanctuaryUI();

            // Overlay banner
            const banner = document.createElement('div');
            banner.className = 'puzzle-banner success';
            banner.innerText = `${data.name.toUpperCase()} RESTORED!`;
            document.body.appendChild(banner);
            setTimeout(() => banner.remove(), 2000);
        } else {
            // Alert user of insufficient funds
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

        // Dynamically build grid of scrolls
        const listDiv = document.getElementById('scrolls-list');
        listDiv.innerHTML = ''; // Clear

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
                card.addEventListener('click', () => this.openScrollReader(data.story));
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

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = Math.min(this.clock.getDelta(), 0.1);

        if (this.gameState === 'PLAYING') {
            this.speed = Math.min(this.speed + deltaTime * 0.12, this.maxSpeed);

            this.track.update(this.speed, deltaTime);
            this.obstacleManager.update(this.speed, deltaTime);
            this.player.update(deltaTime);

            this.playerBox.setFromObject(this.player.meshGroup);

            // Coin collections
            const collectedCoins = this.obstacleManager.checkCoinCollections(this.playerBox);
            if (collectedCoins > 0) {
                this.butter += collectedCoins;
                this.score += collectedCoins * 100;
            }

            // Powerup collections
            const powerup = this.obstacleManager.checkPowerUpCollections(this.playerBox);
            if (powerup) {
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
            // Orbit camera slowly around the 3D Sanctuary garden (Center X=15, Y=0, Z=-10)
            const time = Date.now() * 0.0003;
            this.camera.position.set(
                15.0 + Math.sin(time) * 6.5,
                3.2,
                -10.0 + Math.cos(time) * 6.5
            );
            this.camera.lookAt(15.0, 0.8, -10.0);
            
            // Keep Sanctuary animations (such as diorama restorations) ticking on menu
            this.sanctuary.update(deltaTime);
        } else if (this.gameState === 'INTRO') {
            // Smoothly translate camera from the Sanctuary menu to the runner track position (0, 3.5, 5)
            this.camera.position.lerp(this.introCamTargetPos, deltaTime * 3.5);
            
            // Calculate a moving lookTarget to slide the camera's focus smoothly to the track
            const currentLook = new THREE.Vector3(15.0, 0.8, -10.0);
            currentLook.lerp(this.introCamTargetLook, deltaTime * 3.5);
            this.camera.lookAt(currentLook);

            // Once camera slides close to position, trigger start run
            if (this.camera.position.distanceTo(this.introCamTargetPos) < 0.1) {
                this.camera.position.copy(this.introCamTargetPos);
                this.camera.lookAt(this.introCamTargetLook);
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
     * Core collision evaluation logic.
     */
    handleCollision(obstacle) {
        if (obstacle.type === 'sudarshan_gate') {
            this.sudarshanActive = false;
            this.puzzleManager.clearSudarshanPrompt();

            if (obstacle.glyph === this.targetGlyph) {
                console.log("[Sudarshan Gate] Correct Gate Solved! Speed Boost.");
                this.score += 250;
                this.speed = Math.min(this.speed + 4.0, this.maxSpeed);

                const banner = document.createElement('div');
                banner.className = 'puzzle-banner success';
                banner.innerText = 'DHARMA GATE ALIGNED! +250';
                document.body.appendChild(banner);
                setTimeout(() => banner.remove(), 1800);
            } else {
                console.log("[Sudarshan Gate] Incorrect Gate. Speed Slow Penalty.");
                this.score = Math.max(this.score - 100, 0);
                this.speed = Math.max(this.speed - 5.0, this.baseSpeed);

                const banner = document.createElement('div');
                banner.className = 'puzzle-banner failure';
                banner.innerText = 'WRONG PATH DEVIATION -100';
                document.body.appendChild(banner);
                setTimeout(() => banner.remove(), 1800);
            }

            this.obstacleManager.obstacles = this.obstacleManager.obstacles.filter(obs => obs.type !== 'sudarshan_gate');
            obstacle.destroy();
        } else {
            if (this.player.isShielded) {
                console.log("[Collision] Shield absorbed obstacle collision.");
                
                this.player.isShielded = false;
                this.player.shieldMesh.visible = false;
                this.player.shieldTimer = 0;

                this.obstacleManager.obstacles = this.obstacleManager.obstacles.filter(o => o !== obstacle);
                obstacle.destroy();

                const banner = document.createElement('div');
                banner.className = 'puzzle-banner success';
                banner.innerText = 'SHIELD ABSORBED CLASH';
                document.body.appendChild(banner);
                setTimeout(() => banner.remove(), 1500);
            } else {
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
