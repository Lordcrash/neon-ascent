import { PHYSICS, checkOverlap } from './physics.js';
import { spawnBurst } from './particles.js';

export class Enemy {
    constructor(cfg) {
        this.x = cfg.x;
        this.y = cfg.y;
        this.width = cfg.width;
        this.height = cfg.height;
        this.vx = cfg.vx;
        this.vy = cfg.vy || 0;
        this.hp = cfg.hp;
        this.active = cfg.active;
        this.dead = cfg.dead || false;
    }

    update(platforms, player, particles, onPlayerDie) {
        if (!this.active || this.dead) return;

        this.vy += PHYSICS.GRAVITY;
        if (this.vy > PHYSICS.MAX_FALL_SPEED) this.vy = PHYSICS.MAX_FALL_SPEED;

        this.x += this.vx;
        
        let hitHoriz = false;
        for (const plat of platforms) {
            if (plat.width > 0 && checkOverlap(this, plat)) {
                this.x = this.vx > 0 ? plat.x - this.width : plat.x + plat.width;
                hitHoriz = true;
            }
        }
        if (hitHoriz || this.x <= 0 || this.x + this.width >= 960) {
            this.vx *= -1;
        }

        this.y += this.vy;
        for (const plat of platforms) {
            if (plat.width > 0 && checkOverlap(this, plat)) {
                if (this.vy > 0) {
                    this.y = plat.y - this.height;
                    this.vy = 0;
                } else if (this.vy < 0) {
                    this.y = plat.y + plat.height;
                    this.vy = 0;
                }
            }
        }

        if (checkOverlap(player, this, 2)) {
            onPlayerDie();
        }
    }

    hit(particles, onOpenDoor, onEnemyKill) {
        this.hp--;
        spawnBurst(particles, this.x + this.width/2, this.y + this.height/2, "#ff0055", 10, 4, 15);
        if (this.hp <= 0) {
            this.dead = true;
            spawnBurst(particles, this.x + this.width/2, this.y + this.height/2, "#ff007f", 25, 8, 30);
            onEnemyKill();
            onOpenDoor();
        }
    }

    draw(ctx, currentLevel) {
        if (!this.active || this.dead) return;

        ctx.save();
        
        const isMilitary = currentLevel === 5;
        const mainColor = isMilitary ? "#00ff66" : "#ff0055";
        const shadowColor = isMilitary ? "#00ff66" : "#ff0055";
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = shadowColor;
        ctx.fillStyle = mainColor;
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 2;

        const ex = this.x + this.width / 2;
        const ey = this.y;

        ctx.beginPath();
        ctx.arc(ex, ey + 6, 6, 0, Math.PI * 2);
        ctx.fill();

        if (isMilitary) {
            ctx.fillStyle = "#1b4d22";
            ctx.beginPath();
            ctx.arc(ex, ey + 6, 7, Math.PI, 0);
            ctx.fill();

            ctx.strokeStyle = "#ff0033";
            ctx.lineWidth = 2;
            ctx.shadowColor = "#ff0033";
            ctx.beginPath();
            const facingDir = this.vx > 0 ? 1 : -1;
            ctx.moveTo(ex, ey + 6);
            ctx.lineTo(ex + 6 * facingDir, ey + 6);
            ctx.stroke();
            
            ctx.strokeStyle = mainColor;
            ctx.shadowColor = shadowColor;
            ctx.lineWidth = 2;
        }

        if (isMilitary) {
            ctx.fillStyle = "#1b4d22";
            ctx.fillRect(ex - 4, ey + 12, 8, 12);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(ex - 4, ey + 12);
            ctx.lineTo(ex + 4, ey + 24);
            ctx.stroke();
            ctx.strokeStyle = mainColor;
            ctx.lineWidth = 2;
        } else {
            ctx.beginPath();
            ctx.moveTo(ex, ey + 12);
            ctx.lineTo(ex, ey + 24);
            ctx.stroke();
        }

        const walkCycle = Math.sin(Date.now() * 0.01);
        const facingDir = this.vx > 0 ? 1 : -1;

        if (isMilitary) {
            ctx.beginPath();
            ctx.moveTo(ex, ey + 14);
            ctx.lineTo(ex + 10 * facingDir, ey + 16 + 2 * walkCycle);
            ctx.stroke();

            ctx.save();
            ctx.shadowColor = "#00ff66";
            ctx.translate(ex + 10 * facingDir, ey + 16 + 2 * walkCycle);
            
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#00ff66";
            ctx.lineWidth = 1;
            ctx.beginPath();
            if (facingDir > 0) {
                ctx.moveTo(0, 0);
                ctx.lineTo(8, -2);
                ctx.lineTo(11, 1);
                ctx.lineTo(0, 2);
            } else {
                ctx.moveTo(0, 0);
                ctx.lineTo(-8, -2);
                ctx.lineTo(-11, 1);
                ctx.lineTo(0, 2);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#1a1a1a";
            ctx.strokeStyle = "#333333";
            if (facingDir > 0) {
                ctx.fillRect(-3, -1, 3, 4);
                ctx.fillRect(-1, -3, 1.5, 8);
            } else {
                ctx.fillRect(0, -1, 3, 4);
                ctx.fillRect(-0.5, -3, 1.5, 8);
            }

            ctx.restore();
        } else {
            ctx.beginPath();
            ctx.moveTo(ex - 8 * walkCycle, ey + 15);
            ctx.lineTo(ex, ey + 14);
            ctx.lineTo(ex + 8 * walkCycle, ey + 15);
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(ex, ey + 24);
        ctx.lineTo(ex - 6 * walkCycle, ey + 35);
        ctx.moveTo(ex, ey + 24);
        ctx.lineTo(ex + 6 * walkCycle, ey + 35);
        ctx.stroke();

        ctx.restore();
    }
}
