// ui.js - Handles Pause Menu, key events, and UI overlay updates
import { PHYSICS } from './physics.js';

export class UIHandler {
    constructor(callbacks) {
        this.callbacks = callbacks; // { onResume, onRestartLevel, onRestartGame }
        this.isPaused = false;
        this.activeMenuIndex = 0;
        this.keys = {};

        // DOM elements
        this.scoreEl = document.getElementById("score");
        this.levelEl = document.getElementById("level");
        this.pauseMenu = document.getElementById("pause-menu");
        this.resumeBtn = document.getElementById("resume-btn");
        this.restartLevelBtn = document.getElementById("restart-level-btn");
        this.restartGameBtn = document.getElementById("restart-game-btn");
        this.menuButtons = [this.resumeBtn, this.restartLevelBtn, this.restartGameBtn];

        this.initEvents();
    }

    updateScore(score) {
        this.scoreEl.textContent = score;
    }

    updateLevel(level) {
        this.levelEl.textContent = level;
    }

    updateActiveButton() {
        this.menuButtons.forEach((btn, idx) => {
            if (idx === this.activeMenuIndex) {
                btn.classList.add("selected");
            } else {
                btn.classList.remove("selected");
            }
        });
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.pauseMenu.classList.remove("hidden");
            this.keys = {}; // Clear inputs
            this.activeMenuIndex = 0;
            this.updateActiveButton();
        } else {
            this.pauseMenu.classList.add("hidden");
        }
    }

    initEvents() {
        this.resumeBtn.addEventListener("click", () => {
            if (this.isPaused) this.togglePause();
            if (this.callbacks.onResume) this.callbacks.onResume();
        });

        this.restartLevelBtn.addEventListener("click", () => {
            this.callbacks.onRestartLevel();
            if (this.isPaused) this.togglePause();
        });

        this.restartGameBtn.addEventListener("click", () => {
            this.callbacks.onRestartGame();
            if (this.isPaused) this.togglePause();
        });

        this.menuButtons.forEach((btn, idx) => {
            btn.addEventListener("mouseenter", () => {
                if (this.isPaused) {
                    this.activeMenuIndex = idx;
                    this.updateActiveButton();
                }
            });
        });

        window.addEventListener("keydown", (e) => {
            const titleScreen = document.getElementById("title-screen");
            if (titleScreen && !titleScreen.classList.contains("hidden")) {
                if (e.code === "Enter" || e.code === "Space") {
                    e.preventDefault();
                    document.getElementById("play-btn").click();
                }
                return; // Ignore all other keys
            }
            const victoryScreen = document.getElementById("victory-screen");
            if (victoryScreen && !victoryScreen.classList.contains("hidden")) {
                if (e.code === "Enter" || e.code === "Space") {
                    e.preventDefault();
                    document.getElementById("restart-all-btn").click();
                }
                return; // Ignore keys
            }
            if (e.code === "Escape") {
                e.preventDefault();
                this.togglePause();
                return;
            }
            if (this.isPaused) {
                if (e.code === "KeyW" || e.code === "ArrowUp") {
                    e.preventDefault();
                    this.activeMenuIndex = (this.activeMenuIndex - 1 + this.menuButtons.length) % this.menuButtons.length;
                    this.updateActiveButton();
                } else if (e.code === "KeyS" || e.code === "ArrowDown") {
                    e.preventDefault();
                    this.activeMenuIndex = (this.activeMenuIndex + 1) % this.menuButtons.length;
                    this.updateActiveButton();
                } else if (e.code === "Enter" || e.code === "Space") {
                    e.preventDefault();
                    this.menuButtons[this.activeMenuIndex].click();
                }
                return;
            }
            this.keys[e.code] = true;
            if (e.code === "KeyR") {
                this.callbacks.onRestartLevel();
            }
        });

        window.addEventListener("keyup", (e) => {
            if (this.isPaused) return;
            this.keys[e.code] = false;
        });
    }
}
