// levels/level1.js
export const level1 = {
    platforms: [
        { x: 0, y: 500, width: 960, height: 40, color: "#1e1d3b" },
        { x: 250, y: 400, width: 120, height: 20, color: "#2e2b5c" },
        { x: 450, y: 320, width: 140, height: 20, color: "#2e2b5c" },
        { x: 700, y: 250, width: 120, height: 20, color: "#2e2b5c" },
        { x: 820, y: 150, width: 140, height: 400, color: "#1e1d3b" }
    ],
    spikes: [],
    collectibles: [
        { x: 310, y: 350, color: "#ffea00", size: 12 },
        { x: 520, y: 270, color: "#ffea00", size: 12 },
        { x: 760, y: 200, color: "#ffea00", size: 12 }
    ],
    goal: { x: 880, y: 100, width: 30, height: 50, color: "#ff007f" },
    switch: null,
    door: null
};
