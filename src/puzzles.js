import * as THREE from '../lib/three.module.js';

export class PuzzleManager {
    constructor(game) {
        this.game = game;
        this.synth = null;
        this.initAudioSynth();
        
        // Puzzle state
        this.currentPrompt = "";
        this.fluteSequence = [];
        this.playerSequence = [];
        this.fluteSymbols = ["Sa", "Re", "Ga"];
        
        // DOM Elements
        this.overlay = null;
        this.createDOMOverlay();
    }

    /**
     * Initializes simple Web Audio API Context.
     */
    initAudioSynth() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        } catch (e) {
            console.warn("Web Audio API not supported in this browser.");
        }
    }

    /**
     * Plays a smooth, warm flute-like sargam note using pure Web Audio oscillator scheduling.
     * Implements Attack-Decay-Release envelope ramps to prevent glitchy clicks/pops,
     * and schedules clean node disconnects.
     * @param {string} note - "Sa", "Re", "Ga"
     */
    playNote(note) {
        if (!this.audioCtx) return;
        
        // Resume context if suspended (browser security policies)
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        
        // Use a Sine wave to represent a clean, soft flute timbre
        osc.type = 'sine';

        // Sargam frequencies (C4, D4, E4)
        const frequencies = {
            "Sa": 261.63, 
            "Re": 293.66, 
            "Ga": 329.63  
        };
        
        const freq = frequencies[note] || 260.0;
        const now = this.audioCtx.currentTime;

        osc.frequency.setValueAtTime(freq, now);

        // Smooth volume envelope: Attack (0.05s) -> Decay/Release (0.4s) to zero
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.linearRampToValueAtTime(0.25, now + 0.05); // Attack ramp up (removes starting click)
        
        // Exponential decay to a near-zero amplitude (removes ending pop)
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
        
        osc.start(now);
        osc.stop(now + 0.5);

        // Garbage collection: Disconnect nodes from memory after stop schedule
        setTimeout(() => {
            osc.disconnect();
            gainNode.disconnect();
        }, 600);
    }

    /**
     * Create the Flute Meditation overlay interface.
     */
    createDOMOverlay() {
        const uiLayer = document.getElementById('ui-layer');
        
        const overlayDiv = document.createElement('div');
        overlayDiv.id = 'flute-puzzle';
        overlayDiv.className = 'overlay-panel hidden';
        overlayDiv.innerHTML = `
            <h2 class="puzzle-title">BANSURI MEDITATION</h2>
            <p class="puzzle-desc">Repeat the flute melody sequence!</p>
            <div id="melody-display" class="melody-lights">
                <span class="light" id="light-0"></span>
                <span class="light" id="light-1"></span>
                <span class="light" id="light-2"></span>
            </div>
            <div class="flute-buttons">
                <button class="flute-btn btn-sa" data-note="Sa">Sa</button>
                <button class="flute-btn btn-re" data-note="Re">Re</button>
                <button class="flute-btn btn-ga" data-note="Ga">Ga</button>
            </div>
        `;
        
        uiLayer.appendChild(overlayDiv);
        this.overlay = overlayDiv;
        
        // Bind button actions
        const buttons = this.overlay.querySelectorAll('.flute-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const note = e.target.getAttribute('data-note');
                this.handlePlayerInput(note, e.target);
            });
        });
    }

    /**
     * Triggers the Sudarshan Gate visual prompt overlay on HUD.
     */
    generateSudarshanPrompt() {
        const glyphs = ["ॐ", "श्री", "हरि"];
        this.currentPrompt = glyphs[Math.floor(Math.random() * glyphs.length)];
        
        let promptHUD = document.getElementById('sudarshan-prompt');
        if (!promptHUD) {
            promptHUD = document.createElement('div');
            promptHUD.id = 'sudarshan-prompt';
            document.getElementById('ui-layer').appendChild(promptHUD);
        }
        
        promptHUD.innerHTML = `RUN THROUGH GATE: <span class="target-glyph">${this.currentPrompt}</span>`;
        promptHUD.className = '';
        
        return this.currentPrompt;
    }

    /**
     * Clears the Sudarshan prompt display.
     */
    clearSudarshanPrompt() {
        const promptHUD = document.getElementById('sudarshan-prompt');
        if (promptHUD) {
            promptHUD.className = 'hidden';
        }
        this.currentPrompt = "";
    }

    /**
     * Starts the Flute Melody memory test, pausing the game.
     */
    triggerFlutePuzzle() {
        this.game.gameState = 'PUZZLE';
        this.overlay.classList.remove('hidden');
        
        // Build sequence: 3 random notes
        this.fluteSequence = [];
        this.playerSequence = [];
        for (let i = 0; i < 3; i++) {
            const randomNote = this.fluteSymbols[Math.floor(Math.random() * this.fluteSymbols.length)];
            this.fluteSequence.push(randomNote);
        }

        this.toggleButtons(false);

        // Play sequence after a short breather
        setTimeout(() => this.playSequence(0), 800);
    }

    /**
     * Playback sequence index by index.
     * @param {number} index - Index of note to play.
     */
    playSequence(index) {
        if (index >= this.fluteSequence.length) {
            this.toggleButtons(true);
            return;
        }

        const note = this.fluteSequence[index];
        this.playNote(note);

        // Flash corresponding indicator light
        const light = document.getElementById(`light-${index}`);
        const colors = { "Sa": "#063970", "Re": "#FFD700", "Ga": "#E2725B" };
        
        light.style.backgroundColor = colors[note];
        light.classList.add('active');

        setTimeout(() => {
            light.classList.remove('active');
            light.style.backgroundColor = '#444';
            setTimeout(() => this.playSequence(index + 1), 350); // Generous gap to avoid overlap
        }, 500);
    }

    /**
     * Capture player clicks.
     */
    handlePlayerInput(note, buttonElement) {
        this.playNote(note);
        this.playerSequence.push(note);

        buttonElement.classList.add('flash-active');
        setTimeout(() => buttonElement.classList.remove('flash-active'), 200);

        const currentIndex = this.playerSequence.length - 1;
        if (this.playerSequence[currentIndex] !== this.fluteSequence[currentIndex]) {
            this.endFlutePuzzle(false);
            return;
        }

        if (this.playerSequence.length === this.fluteSequence.length) {
            this.endFlutePuzzle(true);
        }
    }

    /**
     * Enable/disable button clicks during playback.
     */
    toggleButtons(enabled) {
        const buttons = this.overlay.querySelectorAll('.flute-btn');
        buttons.forEach(btn => {
            btn.style.pointerEvents = enabled ? 'auto' : 'none';
            btn.style.opacity = enabled ? '1.0' : '0.5';
        });
    }

    /**
     * Close puzzle overlay, resume game loop and apply rewards/penalties.
     */
    endFlutePuzzle(solved) {
        this.overlay.classList.add('hidden');
        
        const banner = document.createElement('div');
        banner.className = solved ? 'puzzle-banner success' : 'puzzle-banner failure';
        banner.innerText = solved ? 'DEVOTION SHIELD ACQUIRED!' : 'MEDITATION INTERRUPTED';
        document.body.appendChild(banner);
        setTimeout(() => banner.remove(), 2000);

        if (solved) {
            this.game.score += 300;
            this.game.player.activateShield(6.0);
        } else {
            this.game.speed = Math.max(this.game.speed - 4.0, this.game.baseSpeed);
        }

        // Resume running
        this.game.gameState = 'PLAYING';
        this.game.clock.getDelta();
    }
}
