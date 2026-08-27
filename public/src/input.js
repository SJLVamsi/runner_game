/**
 * InputManager Module
 * Handles keyboard controls (PC) and swipe controls (Mobile browsers).
 */
export class InputManager {
    constructor() {
        this.onActionCallback = null;
        
        // Touch Swipe properties
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.minSwipeDistance = 30; // Min pixels to register a swipe

        this.init();
    }

    /**
     * Registers the action callback.
     * @param {Function} callback - Function called with "left", "right", "up", or "down"
     */
    registerAction(callback) {
        this.onActionCallback = callback;
    }

    /**
     * Initializes listeners.
     */
    init() {
        // Keyboard Listeners
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Touch Listeners
        window.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        window.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
    }

    /**
     * Process keyboard triggers.
     */
    handleKeyDown(e) {
        if (!this.onActionCallback) return;

        switch (e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.onActionCallback('left');
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.onActionCallback('right');
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.onActionCallback('up');
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                this.onActionCallback('down');
                break;
        }
    }

    /**
     * Process initial touch coordinates.
     */
    handleTouchStart(e) {
        if (e.touches.length === 0) return;
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
    }

    /**
     * Process final touch coordinates and compute swipe vector.
     */
    handleTouchEnd(e) {
        if (!this.onActionCallback || e.changedTouches.length === 0) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const deltaX = touchEndX - this.touchStartX;
        const deltaY = touchEndY - this.touchStartY;

        // Determine if horizontal or vertical swipe
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (Math.abs(deltaX) > this.minSwipeDistance) {
                if (deltaX > 0) {
                    this.onActionCallback('right');
                } else {
                    this.onActionCallback('left');
                }
            }
        } else {
            // Vertical swipe
            if (Math.abs(deltaY) > this.minSwipeDistance) {
                if (deltaY > 0) {
                    this.onActionCallback('down');
                } else {
                    this.onActionCallback('up');
                }
            }
        }
    }
}
