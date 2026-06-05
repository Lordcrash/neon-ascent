// game.js - Main Loop and game flow coordinator
import { levels } from './levels.js';
import { Particle } from './particles.js';
import { PHYSICS, checkOverlap } from './physics.js';
import { UIHandler } from './ui.js';

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// State globals
let score = 0, currentLevel = 1, particles = [], platforms = [], collectibles = [], spikes = [], goal = null, levelSwitch = null, levelDoor = null;
let levelPistol = null, levelGate = null, bullets = [], levelEnemy = null, hasPistol = false;

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
        currentLevel = 5;
        loadLevel(5);
    }
});

function spawnBurst(x, y, color, count, speed, lifeRange) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(
            x, y, color, 
            (Math.random() - 0.5) * speed, 
            (Math.random() - 0.5) * speed - (color === "#00ffcc" ? 1 : 0), 
            lifeRange + Math.random() * 15
        ));
     }
}

const player = {
    x: 100, y: 400, width: 20, height: 32, vx: 0, vy: 0, onGround: false, coyoteTime: 0, jumpBuffer: 0, color: "#00ffcc", trail: [],
    facingLeft: false, shootCooldown: 0,

    reset(x, y) {
        this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.onGround = false; this.coyoteTime = 0; this.jumpBuffer = 0; this.trail = [];
        this.facingLeft = false; this.shootCooldown = 0;
    },

    update(plats) {
        const moveLeft = ui.keys["KeyA"] || ui.keys["ArrowLeft"], moveRight = ui.keys["KeyD"] || ui.keys["ArrowRight"], jumpPressed = ui.keys["KeyW"] || ui.keys["Space"] || ui.keys["ArrowUp"];

        if (moveLeft) this.facingLeft = true;
        if (moveRight) this.facingLeft = false;

        this.vx = moveLeft ? this.vx - PHYSICS.ACCELERATION : (moveRight ? this.vx + PHYSICS.ACCELERATION : this.vx * PHYSICS.FRICTION);
        if (Math.abs(this.vx) < 0.1) this.vx = 0;
        const maxSpeed = 4.2;
        this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));

        this.vy += PHYSICS.GRAVITY;
        if (this.vy > PHYSICS.MAX_FALL_SPEED) this.vy = PHYSICS.MAX_FALL_SPEED;

        this.coyoteTime = this.onGround ? PHYSICS.COYOTE_TIME_MAX : Math.max(0, this.coyoteTime - 1);
        this.jumpBuffer = jumpPressed ? PHYSICS.JUMP_BUFFER_MAX : Math.max(0, this.jumpBuffer - 1);

        if (this.jumpBuffer > 0 && this.coyoteTime > 0) {
            this.vy = PHYSICS.JUMP_FORCE; this.onGround = false; this.coyoteTime = 0; this.jumpBuffer = 0;
            spawnBurst(this.x + this.width/2, this.y + this.height, "#00ffcc", 8, 4, 20);
        }
        if (!jumpPressed && this.vy < PHYSICS.MINI_JUMP_FORCE) this.vy = PHYSICS.MINI_JUMP_FORCE;

        if (this.shootCooldown > 0) this.shootCooldown--;
        if (hasPistol && ui.keys["KeyF"] && this.shootCooldown === 0) {
            this.shootCooldown = 25;
            bullets.push({
                x: this.facingLeft ? this.x - 5 : this.x + this.width + 5,
                y: this.y + this.height / 2,
                vx: this.facingLeft ? -8 : 8,
                width: 8,
                height: 4
            });
            spawnBurst(this.facingLeft ? this.x - 5 : this.x + this.width + 5, this.y + this.height / 2, "#ffea00", 4, 2, 10);
        }

        this.x += this.vx;
        this.handleCollisions(plats, "horizontal");

        this.y += this.vy; this.onGround = false;
        
        for (const spike of spikes) {
            if (checkOverlap(this, spike, 4)) { this.die(); return; }
        }

        this.handleCollisions(plats, "vertical");
        if (this.y > canvas.height + 100) this.die();

        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 5) this.trail.shift();
    },

    handleCollisions(plats, dir) {
        for (const plat of plats) {
            if (checkOverlap(this, plat)) {
                if (dir === "horizontal") {
                    this.x = this.vx > 0 ? plat.x - this.width : plat.x + plat.width;
                    this.vx = 0;
                } else {
                    if (this.vy > 0) { this.y = plat.y - this.height; this.onGround = true; } 
                    else if (this.vy < 0) this.y = plat.y + plat.height;
                    this.vy = 0;
                }
            }
        }
    },

    die() {
        spawnBurst(this.x + this.width/2, this.y + this.height/2, "#ff0055", 20, 8, 30);
        score = 0;
        ui.updateScore(score);
        loadLevel(currentLevel);
    },

    draw(c) {
        // Draw neon trail
        this.trail.forEach((pos, idx) => {
            c.save(); c.globalAlpha = (idx / this.trail.length) * 0.15; c.fillStyle = this.color;
            c.fillRect(pos.x, pos.y, this.width, this.height); c.restore();
        });
        
        c.save(); 
        c.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Squash and stretch effects
        let sx = 1, sy = 1;
        if (!this.onGround) { 
            sy = 1 + Math.abs(this.vy) * 0.015; 
            sx = 1 - Math.abs(this.vy) * 0.008; 
        } else if (Math.abs(this.vx) > 0.5) { 
            sx = 1.05; 
            sy = 0.95; 
        }
        c.scale(sx, sy);
        
        const w = this.width;
        const h = this.height;
        const halfW = w / 2;
        const halfH = h / 2;

        // Draw neon shadow/glow
        c.shadowBlur = 10; 
        c.shadowColor = this.color;

        // Antenna
        c.strokeStyle = "#ff007f";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(0, -halfH);
        c.lineTo(0, -halfH - 6);
        c.stroke();
        c.fillStyle = "#ff007f";
        c.beginPath();
        c.arc(0, -halfH - 8, 3, 0, Math.PI * 2);
        c.fill();

        // Main Body (rounded robot metal chassis)
        c.fillStyle = "#2e2b5c";
        c.strokeStyle = this.color;
        c.lineWidth = 2;
        
        // Draw round-rect body
        c.beginPath();
        c.roundRect(-halfW, -halfH + 4, w, h - 8, 4);
        c.fill();
        c.stroke();

        // Visor Screen
        c.fillStyle = "#0c0a1f";
        c.beginPath();
        c.roundRect(-halfW + 3, -halfH + 8, w - 6, 12, 3);
        c.fill();

        // Glowing Robot Eyes (wink/look direction based on speed)
        c.fillStyle = this.color;
        const eyeOffset = this.vx > 0.5 ? 2 : (this.vx < -0.5 ? -2 : 0);
        c.beginPath();
        c.arc(-4 + eyeOffset, -halfH + 14, 2.5, 0, Math.PI * 2);
        c.arc(4 + eyeOffset, -halfH + 14, 2.5, 0, Math.PI * 2);
        c.fill();

        // Little wheels/treads at the bottom
        c.fillStyle = "#1e1d3b";
        c.beginPath();
        c.roundRect(-halfW + 2, halfH - 4, 6, 4, 1);
        c.roundRect(halfW - 8, halfH - 4, 6, 4, 1);
        c.fill();

        // Draw pistol if player has it
        if (hasPistol) {
            c.shadowColor = "#ffea00";
            c.fillStyle = "#ffea00";
            const gunDirection = this.facingLeft ? -1 : 1;
            c.fillRect(gunDirection * 8, 2, gunDirection * 10, 4);
            c.fillRect(gunDirection * 8, 6, gunDirection * 3, 6);
        }

        c.restore();
    }
};

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
        levelEnemy = cfg.enemy ? { ...cfg.enemy } : null;
    } else {
        currentLevel = 1; loadLevel(1);
    }
    ui.updateLevel(currentLevel);
}

function update() {
    player.update(platforms);
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(); if (particles[i].life <= 0) particles.splice(i, 1);
    }

    if (levelSwitch && !levelSwitch.pressed && checkOverlap(player, levelSwitch)) {
        levelSwitch.pressed = true;
        if (levelDoor) {
            levelDoor.open = true;
            platforms[levelDoor.platIndex] = { x: 0, y: 0, width: 0, height: 0, color: "transparent" };
            spawnBurst(levelDoor.x + levelDoor.width/2, levelDoor.y + levelDoor.height/2, "#00ffcc", 15, 6, 25);
        }
    }

    // Level 5 Pistol mechanics
    if (levelPistol && !levelPistol.collected && checkOverlap(player, levelPistol)) {
        levelPistol.collected = true;
        hasPistol = true;
        score += 200; ui.updateScore(score);
        spawnBurst(levelPistol.x + levelPistol.width/2, levelPistol.y + levelPistol.height/2, "#ffea00", 15, 6, 20);
    }

    // Bullet physics & hit logic
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        
        // Collision with walls
        let hitWall = false;
        for (const plat of platforms) {
            if (plat.width > 0 && checkOverlap(b, plat)) {
                hitWall = true;
                break;
            }
        }

        // Collision with Enemy
        if (levelEnemy && levelEnemy.active && !levelEnemy.dead && checkOverlap(b, levelEnemy)) {
            levelEnemy.hp--;
            hitWall = true;
            spawnBurst(levelEnemy.x + levelEnemy.width/2, levelEnemy.y + levelEnemy.height/2, "#ff0055", 10, 4, 15);
            if (levelEnemy.hp <= 0) {
                levelEnemy.dead = true;
                score += 500; ui.updateScore(score);
                spawnBurst(levelEnemy.x + levelEnemy.width/2, levelEnemy.y + levelEnemy.height/2, "#ff007f", 25, 8, 30);
                
                // Open exit door
                if (levelDoor && !levelDoor.open) {
                    levelDoor.open = true;
                    platforms[levelDoor.platIndex] = { x: 0, y: 0, width: 0, height: 0, color: "transparent" };
                    spawnBurst(levelDoor.x + levelDoor.width/2, levelDoor.y + levelDoor.height/2, "#00ffcc", 20, 6, 25);
                }
            }
        }

        if (hitWall || b.x < 0 || b.x > canvas.width) {
            bullets.splice(i, 1);
        }
    }

    // Enemy Human Logic
    if (levelEnemy && levelEnemy.active && !levelEnemy.dead) {
        levelEnemy.vy += PHYSICS.GRAVITY;
        if (levelEnemy.vy > PHYSICS.MAX_FALL_SPEED) levelEnemy.vy = PHYSICS.MAX_FALL_SPEED;

        // Horiz movement
        levelEnemy.x += levelEnemy.vx;
        
        // Horiz walls collision or edge detection
        let hitHoriz = false;
        for (const plat of platforms) {
            if (plat.width > 0 && checkOverlap(levelEnemy, plat)) {
                levelEnemy.x = levelEnemy.vx > 0 ? plat.x - levelEnemy.width : plat.x + plat.width;
                hitHoriz = true;
            }
        }
        if (hitHoriz || levelEnemy.x <= 0 || levelEnemy.x + levelEnemy.width >= canvas.width) {
            levelEnemy.vx *= -1;
        }

        // Vert movement
        levelEnemy.y += levelEnemy.vy;
        for (const plat of platforms) {
            if (plat.width > 0 && checkOverlap(levelEnemy, plat)) {
                if (levelEnemy.vy > 0) {
                    levelEnemy.y = plat.y - levelEnemy.height;
                    levelEnemy.vy = 0;
                } else if (levelEnemy.vy < 0) {
                    levelEnemy.y = plat.y + plat.height;
                    levelEnemy.vy = 0;
                }
            }
        }

        // Check contact with Player
        if (checkOverlap(player, levelEnemy, 2)) {
            player.die();
            return;
        }
    }

    for (const item of collectibles) {
        if (!item.collected && Math.hypot((player.x + player.width/2) - item.x, (player.y + player.height/2) - item.y) < 26) {
            item.collected = true; score += 100; ui.updateScore(score);
            spawnBurst(item.x, item.y, "#ffea00", 12, 6, 20);
        }
    }

    if (checkOverlap(player, goal)) {
        if (!levelEnemy || levelEnemy.dead) {
            currentLevel++; loadLevel(currentLevel);
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



    // Draw Pistol pickable
    if (levelPistol && !levelPistol.collected) {
        ctx.save(); ctx.fillStyle = "#ffea00"; ctx.shadowBlur = 10; ctx.shadowColor = "#ffea00";
        const floatY = levelPistol.y + Math.sin(Date.now() * 0.007) * 4;
        ctx.fillRect(levelPistol.x, floatY, levelPistol.width, 4);
        ctx.fillRect(levelPistol.x, floatY + 4, 6, 8);
        ctx.restore();
    }

    // Draw Bullets
    for (const b of bullets) {
        ctx.save(); ctx.fillStyle = "#ffea00"; ctx.shadowBlur = 8; ctx.shadowColor = "#ffea00";
        ctx.fillRect(b.x, b.y - b.height/2, b.width, b.height);
        ctx.restore();
    }

    // Draw Enemy Human
    if (levelEnemy && levelEnemy.active && !levelEnemy.dead) {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ff0055";
        ctx.fillStyle = "#ff0055";
        ctx.strokeStyle = "#ff0055";
        ctx.lineWidth = 2;

        const ex = levelEnemy.x + levelEnemy.width / 2;
        const ey = levelEnemy.y;

        // Head (Neon circle)
        ctx.beginPath();
        ctx.arc(ex, ey + 6, 6, 0, Math.PI * 2);
        ctx.fill();

        // Torso / Neck
        ctx.beginPath();
        ctx.moveTo(ex, ey + 12);
        ctx.lineTo(ex, ey + 24);
        ctx.stroke();

        // Arms (swinging)
        const walkCycle = Math.sin(Date.now() * 0.01);
        ctx.beginPath();
        ctx.moveTo(ex - 8 * walkCycle, ey + 15);
        ctx.lineTo(ex, ey + 14);
        ctx.lineTo(ex + 8 * walkCycle, ey + 15);
        ctx.stroke();

        // Legs (walking)
        ctx.beginPath();
        ctx.moveTo(ex, ey + 24);
        ctx.lineTo(ex - 6 * walkCycle, ey + 35);
        ctx.moveTo(ex, ey + 24);
        ctx.lineTo(ex + 6 * walkCycle, ey + 35);
        ctx.stroke();

        ctx.restore();
    }

    for (const item of collectibles) {
        if (!item.collected) {
            ctx.save(); ctx.fillStyle = item.color; ctx.shadowBlur = 10; ctx.shadowColor = item.color;
            ctx.beginPath(); ctx.arc(item.x, item.y + Math.sin(Date.now() * 0.007) * 4, item.size, 0, Math.PI * 2);
            ctx.fill(); ctx.restore();
        }
    }

    // Draw goal door
    ctx.save();
    const isLocked = levelEnemy && !levelEnemy.dead;
    const doorColor = isLocked ? "#ff0055" : goal.color;
    
    ctx.strokeStyle = doorColor;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = doorColor;
    
    // Draw door frame outline
    ctx.beginPath();
    ctx.moveTo(goal.x, goal.y + goal.height);
    ctx.lineTo(goal.x, goal.y + 10);
    // Rounded arch top
    ctx.arcTo(goal.x, goal.y, goal.x + goal.width/2, goal.y, 10);
    ctx.arcTo(goal.x + goal.width, goal.y, goal.x + goal.width, goal.y + 10, 10);
    ctx.lineTo(goal.x + goal.width, goal.y + goal.height);
    ctx.stroke();

    // Inner glowing glass panel fill
    ctx.fillStyle = doorColor;
    if (isLocked) {
        // Closed/locked state looks solid and crossed out
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(goal.x + 2, goal.y + goal.height);
        ctx.lineTo(goal.x + 2, goal.y + 12);
        ctx.arcTo(goal.x + 2, goal.y + 2, goal.x + goal.width/2, goal.y + 2, 8);
        ctx.arcTo(goal.x + goal.width - 2, goal.y + 2, goal.x + goal.width - 2, goal.y + 12, 8);
        ctx.lineTo(goal.x + goal.width - 2, goal.y + goal.height);
        ctx.closePath();
        ctx.fill();

        // X symbol for lock
        ctx.strokeStyle = "#080710";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(goal.x + 5, goal.y + 10);
        ctx.lineTo(goal.x + goal.width - 5, goal.y + goal.height - 10);
        ctx.moveTo(goal.x + goal.width - 5, goal.y + 10);
        ctx.lineTo(goal.x + 5, goal.y + goal.height - 10);
        ctx.stroke();
    } else {
        // Open/active state pulsing
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
    player.draw(ctx);
}


function gameLoop() { if (!ui.isPaused) update(); draw(); requestAnimationFrame(gameLoop); }

loadLevel(5);
gameLoop();
