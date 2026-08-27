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
     * Initializes simple Web Audio API Oscillator to play note frequencies.
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
     * Plays a pure sine wave pitch corresponding to Indian Sargam notes.
     * @param {string} note - "Sa", "Re", "Ga"
     */
    playNote(note) {
        if (!this.audioCtx) return;
        
        // Resume context if suspended (browser security policy)
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        
        // Set note frequency
        const frequencies = {
            "Sa": 261.63, // C4
            "Re": 293.66, // D4
            "Ga": 329.63  // E4
        };
        
        osc.frequency.setValueAtTime(frequencies[note] || 260, this.audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
        
        // Fade out
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.45);
        
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.5);
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
     * @returns {string} - The chosen target Sanskrit glyph.
     */
    generateSudarshanPrompt() {
        const glyphs = ["ॐ", "श्री", "हरि"];
        this.currentPrompt = glyphs[Math.floor(Math.random() * glyphs.length)];
        
        // Display prompt on HUD
        let promptHUD = document.getElementById('sudarshan-prompt');
        if (!promptHUD) {
            promptHUD = document.createElement('div');
            promptHUD.id = 'sudarshan-prompt';
            document.getElementById('ui-layer').appendChild(promptHUD);
        }
        
        promptHUD.innerHTML = `RUN THROUGH GATE: <span class="target-glyph">${this.currentPrompt}</span>`;
        promptHUD.className = ''; // Remove hidden/slide styles to show
        
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

        // Disable buttons during playback
        this.toggleButtons(false);

        // Play sequence
        setTimeout(() => this.playSequence(0), 800);
    }

    /**
     * Playback sequence index by index.
     * @param {number} index - Index of note to play.
     */
    playSequence(index) {
        if (index >= this.fluteSequence.length) {
            // Done playing, let player interact
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
            setTimeout(() => this.playSequence(index + 1), 250);
        }, 500);
    }

    /**
     * Capture player clicks.
     */
    handlePlayerInput(note, buttonElement) {
        this.playNote(note);
        this.playerSequence.push(note);

        // Visual flash on button
        buttonElement.classList.add('flash-active');
        setTimeout(() => buttonElement.classList.remove('flash-active'), 200);

        // Validate choice
        const currentIndex = this.playerSequence.length - 1;
        if (this.playerSequence[currentIndex] !== this.fluteSequence[currentIndex]) {
            // Mistake made! Fail puzzle.
            this.endFlutePuzzle(false);
            return;
        }

        if (this.playerSequence.length === this.fluteSequence.length) {
            // Sequence completed successfully! Solve puzzle.
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
        
        // Visual indicator text overlay
        const banner = document.createElement('div');
        banner.className = solved ? 'puzzle-banner success' : 'puzzle-banner failure';
        banner.innerText = solved ? 'DEVOTION SHIELD ACQUIRED!' : 'MEDITATION INTERRUPTED';
        document.body.appendChild(banner);
        setTimeout(() => banner.remove(), 2000);

        if (solved) {
            this.game.score += 300;
            this.game.player.activateShield(6.0); // 6 seconds shield
        } else {
            this.game.speed = Math.max(this.game.speed - 4.0, this.game.baseSpeed); // Speed slow down penalty
        }

        // Resume running
        this.game.gameState = 'PLAYING';
        this.game.clock.getDelta(); // Reset clock delta
    }
}
