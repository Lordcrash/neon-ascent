import { PHYSICS, checkOverlap } from './physics.js';
import { spawnBurst } from './particles.js';

export class Player {
    constructor() {
        this.x = 100;
        this.y = 400;
        this.width = 20;
        this.height = 32;
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.coyoteTime = 0;
        this.jumpBuffer = 0;
        this.color = "#00ffcc";
        this.trail = [];
        this.facingLeft = false;
        this.shootCooldown = 0;
        this.jumpReleased = true;
    }

    reset(x, y) {
        this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.onGround = false; this.coyoteTime = 0; this.jumpBuffer = 0; this.trail = [];
        this.facingLeft = false; this.shootCooldown = 0; this.jumpReleased = true;
    }

    update(ui, platforms, spikes, particles, gameState, onDie) {
        const moveLeft = ui.keys["KeyA"] || ui.keys["ArrowLeft"], 
              moveRight = ui.keys["KeyD"] || ui.keys["ArrowRight"], 
              jumpPressed = ui.keys["KeyW"] || ui.keys["Space"] || ui.keys["ArrowUp"];

        if (moveLeft) this.facingLeft = true;
        if (moveRight) this.facingLeft = false;

        this.vx = moveLeft ? this.vx - PHYSICS.ACCELERATION : (moveRight ? this.vx + PHYSICS.ACCELERATION : this.vx * PHYSICS.FRICTION);
        if (Math.abs(this.vx) < 0.1) this.vx = 0;
        const maxSpeed = 4.2;
        this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));

        this.vy += PHYSICS.GRAVITY;
        if (this.vy > PHYSICS.MAX_FALL_SPEED) this.vy = PHYSICS.MAX_FALL_SPEED;

        this.coyoteTime = this.onGround ? PHYSICS.COYOTE_TIME_MAX : Math.max(0, this.coyoteTime - 1);
        
        if (!jumpPressed) {
            this.jumpReleased = true;
        }
        
        this.jumpBuffer = (jumpPressed && this.jumpReleased) ? PHYSICS.JUMP_BUFFER_MAX : Math.max(0, this.jumpBuffer - 1);

        if (this.jumpBuffer > 0 && this.coyoteTime > 0) {
            this.vy = PHYSICS.JUMP_FORCE; this.onGround = false; this.coyoteTime = 0; this.jumpBuffer = 0;
            this.jumpReleased = false;
            spawnBurst(particles, this.x + this.width/2, this.y + this.height, "#00ffcc", 8, 4, 20);
        }
        if (!jumpPressed && this.vy < PHYSICS.MINI_JUMP_FORCE) this.vy = PHYSICS.MINI_JUMP_FORCE;

        if (this.shootCooldown > 0) this.shootCooldown--;
        if (gameState.hasPistol && ui.keys["KeyF"] && this.shootCooldown === 0) {
            this.shootCooldown = 25;
            gameState.bullets.push({
                x: this.facingLeft ? this.x - 5 : this.x + this.width + 5,
                y: this.y + this.height / 2,
                vx: this.facingLeft ? -8 : 8,
                width: 8,
                height: 4
            });
            spawnBurst(particles, this.facingLeft ? this.x - 5 : this.x + this.width + 5, this.y + this.height / 2, "#ffea00", 4, 2, 10);
        }

        this.x += this.vx;
        this.handleCollisions(platforms, "horizontal");

        this.y += this.vy; this.onGround = false;
        
        for (const spike of spikes) {
            if (checkOverlap(this, spike, 4)) { onDie(); return; }
        }

        this.handleCollisions(platforms, "vertical");
        if (this.y > 540 + 100) { onDie(); return; }

        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 5) this.trail.shift();
    }

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
    }

    draw(c, gameState) {
        this.trail.forEach((pos, idx) => {
            c.save(); c.globalAlpha = (idx / this.trail.length) * 0.15; c.fillStyle = this.color;
            c.fillRect(pos.x, pos.y, this.width, this.height); c.restore();
        });
        
        c.save(); 
        c.translate(this.x + this.width/2, this.y + this.height/2);
        
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

        c.shadowBlur = 10; 
        c.shadowColor = this.color;

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

        c.fillStyle = "#2e2b5c";
        c.strokeStyle = this.color;
        c.lineWidth = 2;
        
        c.beginPath();
        c.roundRect(-halfW, -halfH + 4, w, h - 8, 4);
        c.fill();
        c.stroke();

        c.fillStyle = "#0c0a1f";
        c.beginPath();
        c.roundRect(-halfW + 3, -halfH + 8, w - 6, 12, 3);
        c.fill();

        c.fillStyle = this.color;
        const eyeOffset = this.vx > 0.5 ? 2 : (this.vx < -0.5 ? -2 : 0);
        c.beginPath();
        c.arc(-4 + eyeOffset, -halfH + 14, 2.5, 0, Math.PI * 2);
        c.arc(4 + eyeOffset, -halfH + 14, 2.5, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = "#1e1d3b";
        c.beginPath();
        c.roundRect(-halfW + 2, halfH - 4, 6, 4, 1);
        c.roundRect(halfW - 8, halfH - 4, 6, 4, 1);
        c.fill();

        if (gameState.hasPistol) {
            c.shadowColor = "#ffea00";
            c.fillStyle = "#ffea00";
            const gunDirection = this.facingLeft ? -1 : 1;
            c.fillRect(gunDirection * 8, 2, gunDirection * 10, 4);
            c.fillRect(gunDirection * 8, 6, gunDirection * 3, 6);
        }

        c.restore();
    }
}
