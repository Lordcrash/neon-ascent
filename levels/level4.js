// levels/level4.js
export const level4 = {
    platforms: [
        { x: 0, y: 500, width: 550, height: 40, color: "#1e1d3b" },
        { x: 550, y: 500, width: 410, height: 40, color: "#1e1d3b" },
        { x: 120, y: 410, width: 120, height: 20, color: "#2e2b5c" },
        { x: 680, y: 380, width: 20, height: 120, color: "#00ffcc" }
    ],
    spikes: Array.from({ length: 6 }, (_, i) => ({ x: 350 + i * 20, y: 480, width: 20, height: 20 })),
    collectibles: [
        { x: 180, y: 350, color: "#ffea00", size: 12 },
        { x: 450, y: 380, color: "#ffea00", size: 12 }
    ],
    switch: { x: 160, y: 395, width: 40, height: 15 },
    door: { x: 680, y: 380, width: 20, height: 120, platIndex: 3 },
    goal: { x: 880, y: 450, width: 30, height: 50, color: "#ff007f" }
};
