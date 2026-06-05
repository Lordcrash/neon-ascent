// levels/level5.js
export const level5 = {
    platforms: [
        // Ground and walls
        { x: 0, y: 500, width: 960, height: 40, color: "#1e1d3b" },
        // Mid platform for pistol
        { x: 100, y: 420, width: 150, height: 20, color: "#2e2b5c" },
        // Platform for enemy enclosure
        { x: 400, y: 350, width: 250, height: 20, color: "#2e2b5c" },
        // Platform for goal
        { x: 800, y: 400, width: 160, height: 100, color: "#1e1d3b" }
    ],
    spikes: [],
    collectibles: [
        { x: 50, y: 460, color: "#ffea00", size: 12 }
    ],
    // Pistol object
    pistol: { x: 170, y: 390, width: 20, height: 15, collected: false },
    // Enemy Human (already active now)
    enemy: { x: 500, y: 300, width: 20, height: 35, vx: 1.5, vy: 0, hp: 1, active: true, dead: false },
    // Goal
    goal: { x: 880, y: 350, width: 30, height: 50, color: "#ff007f" }
};
