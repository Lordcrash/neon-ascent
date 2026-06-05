// particles.js - Particle rendering module
export class Particle {
    constructor(x, y, color, vx, vy, life) {
        this.x = x; this.y = y; this.color = color; this.vx = vx; this.vy = vy; this.life = life; this.maxLife = life; this.size = Math.random() * 3 + 2;
    }
    update() {
        this.x += this.vx; this.y += this.vy; this.vy += 0.05; this.life--;
    }
    draw(c) {
        c.save();
        c.globalAlpha = this.life / this.maxLife;
        c.fillStyle = this.color;
        c.shadowBlur = 8; c.shadowColor = this.color;
        c.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        c.restore();
    }
}

export function spawnBurst(particles, x, y, color, count, speed, lifeRange) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(
            x, y, color, 
            (Math.random() - 0.5) * speed, 
            (Math.random() - 0.5) * speed - (color === "#00ffcc" ? 1 : 0), 
            lifeRange + Math.random() * 15
        ));
     }
}
