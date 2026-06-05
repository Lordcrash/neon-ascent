// game.js - Main Loop and game flow coordinator
import { levels } from './levels.js';
import { spawnBurst } from './particles.js';
import { PHYSICS, checkOverlap } from './physics.js';
import { UIHandler } from './ui.js';
import { Player } from './player.js';
import { Enemy } from './enemy.js';

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// State globals
let score = 0, currentLevel = 1, particles = [], platforms = [], collectibles = [], spikes = [], goal = null, levelSwitch = null, levelDoor = null;
let levelPistol = null, levelGate = null, bullets = [], levelEnemy = null, hasPistol = false;
let inTitleScreen = true;

const titleScreenEl = document.getElementById("title-screen");
const playBtn = document.getElementById("play-btn");
const victoryScreenEl = document.getElementById("victory-screen");
const finalScoreEl = document.getElementById("final-score");
const restartAllBtn = document.getElementById("restart-all-btn");

const player = new Player();

const gameState = {
    get hasPistol() { return hasPistol; },
    set hasPistol(val) { hasPistol = val; },
    get bullets() { return bullets; }
};

playBtn.addEventListener("click", () => {
    inTitleScreen = false;
    titleScreenEl.classList.add("hidden");
    loadLevel(1);
});

restartAllBtn.addEventListener("click", () => {
    victoryScreenEl.classList.add("hidden");
    score = 0;
    ui.updateScore(score);
    currentLevel = 1;
    loadLevel(1);
});

const ui = new UIHandler({
    onResume: () => {},
    onRestartLevel: () => {
        score = 0;
        ui.updateScore(score);
        loadLevel(currentLevel);
    },
    onRestartGame: () => {
        score = 0;
        ui.updateScore(score);
        currentLevel = 1;
        loadLevel(1);
    }
});

function loadLevel(num) {
    particles = []; spikes = []; levelSwitch = null; levelDoor = null;
    levelPistol = null; levelGate = null; bullets = []; levelEnemy = null; hasPistol = false;
    player.reset(100, 400);

    const cfg = levels[num];
    if (cfg) {
        platforms = JSON.parse(JSON.stringify(cfg.platforms));
        spikes = JSON.parse(JSON.stringify(cfg.spikes));
        collectibles = cfg.collectibles.map(c => ({ ...c, collected: false }));
        goal = { ...cfg.goal };
        levelSwitch = cfg.switch ? { ...cfg.switch, pressed: false } : null;
        levelDoor = cfg.door ? { ...cfg.door, open: false } : null;
        levelPistol = cfg.pistol ? { ...cfg.pistol, collected: false } : null;
        levelGate = cfg.gate ? { ...cfg.gate, open: false } : null;
        levelEnemy = cfg.enemy ? new Enemy(cfg.enemy) : null;
    } else {
        currentLevel = 1; loadLevel(1);
    }
    ui.updateLevel(currentLevel);
}

function openDoor() {
    if (levelDoor && !levelDoor.open) {
        levelDoor.open = true;
        platforms[levelDoor.platIndex] = { x: 0, y: 0, width: 0, height: 0, color: "transparent" };
        spawnBurst(particles, levelDoor.x + levelDoor.width/2, levelDoor.y + levelDoor.height/2, "#00ffcc", 15, 6, 25);
    }
}

function update() {
    player.update(ui, platforms, spikes, particles, gameState, () => {
        spawnBurst(particles, player.x + player.width/2, player.y + player.height/2, "#ff0055", 20, 8, 30);
        score = 0;
        ui.updateScore(score);
        loadLevel(currentLevel);
    });

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(); if (particles[i].life <= 0) particles.splice(i, 1);
    }

    if (levelSwitch && !levelSwitch.pressed && checkOverlap(player, levelSwitch)) {
        levelSwitch.pressed = true;
        openDoor();
    }

    // Level 5 Pistol mechanics
    if (levelPistol && !levelPistol.collected && checkOverlap(player, levelPistol)) {
        levelPistol.collected = true;
        hasPistol = true;
        score += 200; ui.updateScore(score);
        spawnBurst(particles, levelPistol.x + levelPistol.width/2, levelPistol.y + levelPistol.height/2, "#ffea00", 15, 6, 20);
    }

    // Bullet physics & hit logic
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        
        let hitWall = false;
        for (const plat of platforms) {
            if (plat.width > 0 && checkOverlap(b, plat)) {
                hitWall = true;
                break;
            }
        }

        if (levelEnemy && levelEnemy.active && !levelEnemy.dead && checkOverlap(b, levelEnemy)) {
            hitWall = true;
            levelEnemy.hit(particles, openDoor, () => {
                score += 500;
                ui.updateScore(score);
            });
        }

        if (hitWall || b.x < 0 || b.x > canvas.width) {
            bullets.splice(i, 1);
        }
    }

    // Enemy Logic
    if (levelEnemy) {
        levelEnemy.update(platforms, player, particles, () => {
            spawnBurst(particles, player.x + player.width/2, player.y + player.height/2, "#ff0055", 20, 8, 30);
            score = 0;
            ui.updateScore(score);
            loadLevel(currentLevel);
        });
    }

    for (const item of collectibles) {
        if (!item.collected && Math.hypot((player.x + player.width/2) - item.x, (player.y + player.height/2) - item.y) < 26) {
            item.collected = true; score += 100; ui.updateScore(score);
            spawnBurst(particles, item.x, item.y, "#ffea00", 12, 6, 20);
        }
    }

    if (checkOverlap(player, goal)) {
        if (!levelEnemy || levelEnemy.dead) {
            currentLevel++;
            if (currentLevel > 5) {
                finalScoreEl.textContent = score;
                victoryScreenEl.classList.remove("hidden");
            } else {
                loadLevel(currentLevel);
            }
        }
    }
}

function draw() {
    ctx.fillStyle = "rgba(8, 7, 16, 0.35)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.02)"; ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    for (const plat of platforms) {
        if (plat.width <= 0) continue;
        ctx.fillStyle = plat.color; ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        ctx.strokeStyle = "#8a2be2"; ctx.lineWidth = 2; ctx.shadowBlur = 8; ctx.shadowColor = "#8a2be2";
        ctx.beginPath(); ctx.moveTo(plat.x, plat.y); ctx.lineTo(plat.x + plat.width, plat.y); ctx.stroke();
        ctx.shadowBlur = 0;
    }

    for (const spike of spikes) {
        ctx.save(); ctx.fillStyle = "#ff0055"; ctx.shadowBlur = 8; ctx.shadowColor = "#ff0055";
        ctx.beginPath(); ctx.moveTo(spike.x, spike.y + spike.height);
        ctx.lineTo(spike.x + spike.width/2, spike.y); ctx.lineTo(spike.x + spike.width, spike.y + spike.height);
        ctx.closePath(); ctx.fill(); ctx.restore();
    }

    if (levelSwitch) {
        ctx.save();
        const swCol = levelSwitch.pressed ? "#00ffcc" : "#ff9900";
        ctx.fillStyle = swCol; ctx.shadowBlur = 8; ctx.shadowColor = swCol;
        const off = levelSwitch.pressed ? 8 : 0;
        ctx.fillRect(levelSwitch.x, levelSwitch.y + off, levelSwitch.width, levelSwitch.height - off);
        ctx.restore();
    }

    if (levelDoor && !levelDoor.open) {
        ctx.save();
        ctx.fillStyle = levelDoor.color || "#00ffcc";
        ctx.shadowBlur = 12;
        ctx.shadowColor = levelDoor.color || "#00ffcc";
        ctx.fillRect(levelDoor.x, levelDoor.y, levelDoor.width, levelDoor.height);
        
        ctx.strokeStyle = "#080710";
        ctx.lineWidth = 3;
        for (let dy = levelDoor.y + 15; dy < levelDoor.y + levelDoor.height; dy += 20) {
            ctx.beginPath();
            ctx.moveTo(levelDoor.x, dy);
            ctx.lineTo(levelDoor.x + levelDoor.width, dy);
            ctx.stroke();
        }
        ctx.restore();
    }

    if (levelPistol && !levelPistol.collected) {
        ctx.save(); ctx.fillStyle = "#ffea00"; ctx.shadowBlur = 10; ctx.shadowColor = "#ffea00";
        const floatY = levelPistol.y + Math.sin(Date.now() * 0.007) * 4;
        ctx.fillRect(levelPistol.x, floatY, levelPistol.width, 4);
        ctx.fillRect(levelPistol.x, floatY + 4, 6, 8);
        ctx.restore();
    }

    for (const b of bullets) {
        ctx.save(); ctx.fillStyle = "#ffea00"; ctx.shadowBlur = 8; ctx.shadowColor = "#ffea00";
        ctx.fillRect(b.x, b.y - b.height/2, b.width, b.height);
        ctx.restore();
    }

    if (levelEnemy) {
        levelEnemy.draw(ctx, currentLevel);
    }

    for (const item of collectibles) {
        if (!item.collected) {
            ctx.save(); ctx.fillStyle = item.color; ctx.shadowBlur = 10; ctx.shadowColor = item.color;
            ctx.beginPath(); ctx.arc(item.x, item.y + Math.sin(Date.now() * 0.007) * 4, item.size, 0, Math.PI * 2);
            ctx.fill(); ctx.restore();
        }
    }

    ctx.save();
    const isLocked = levelEnemy && !levelEnemy.dead;
    const doorColor = isLocked ? "#ff0055" : goal.color;
    
    ctx.strokeStyle = doorColor;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = doorColor;
    
    ctx.beginPath();
    ctx.moveTo(goal.x, goal.y + goal.height);
    ctx.lineTo(goal.x, goal.y + 10);
    ctx.arcTo(goal.x, goal.y, goal.x + goal.width/2, goal.y, 10);
    ctx.arcTo(goal.x + goal.width, goal.y, goal.x + goal.width, goal.y + 10, 10);
    ctx.lineTo(goal.x + goal.width, goal.y + goal.height);
    ctx.stroke();

    ctx.fillStyle = doorColor;
    if (isLocked) {
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(goal.x + 2, goal.y + goal.height);
        ctx.lineTo(goal.x + 2, goal.y + 12);
        ctx.arcTo(goal.x + 2, goal.y + 2, goal.x + goal.width/2, goal.y + 2, 8);
        ctx.arcTo(goal.x + goal.width - 2, goal.y + 2, goal.x + goal.width - 2, goal.y + 12, 8);
        ctx.lineTo(goal.x + goal.width - 2, goal.y + goal.height);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = "#080710";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(goal.x + 5, goal.y + 10);
        ctx.lineTo(goal.x + goal.width - 5, goal.y + goal.height - 10);
        ctx.moveTo(goal.x + goal.width - 5, goal.y + 10);
        ctx.lineTo(goal.x + 5, goal.y + goal.height - 10);
        ctx.stroke();
    } else {
        ctx.globalAlpha = 0.15 + Math.sin(Date.now() * 0.005) * 0.05;
        ctx.beginPath();
        ctx.moveTo(goal.x + 2, goal.y + goal.height);
        ctx.lineTo(goal.x + 2, goal.y + 12);
        ctx.arcTo(goal.x + 2, goal.y + 2, goal.x + goal.width/2, goal.y + 2, 8);
        ctx.arcTo(goal.x + goal.width - 2, goal.y + 2, goal.x + goal.width - 2, goal.y + 12, 8);
        ctx.lineTo(goal.x + goal.width - 2, goal.y + goal.height);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();

    for (const p of particles) p.draw(ctx);
    player.draw(ctx, gameState);
}

function gameLoop() { 
    if (!inTitleScreen && !ui.isPaused) update(); 
    draw(); 
    requestAnimationFrame(gameLoop); 
}

loadLevel(1);
gameLoop();
