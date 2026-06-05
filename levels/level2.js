// levels/level2.js
export const level2 = {
    platforms: [
        { x: 0, y: 500, width: 250, height: 40, color: "#1e1d3b" },
        { x: 320, y: 420, width: 80, height: 20, color: "#2e2b5c" },
        { x: 480, y: 340, width: 80, height: 20, color: "#2e2b5c" },
        { x: 320, y: 260, width: 80, height: 20, color: "#2e2b5c" },
        { x: 150, y: 180, width: 120, height: 20, color: "#2e2b5c" },
        { x: 0, y: 100, width: 80, height: 440, color: "#1e1d3b" },
        { x: 300, y: 100, width: 660, height: 30, color: "#1e1d3b" }
    ],
    spikes: [],
    collectibles: [
        { x: 360, y: 370, color: "#ffea00", size: 12 },
        { x: 520, y: 290, color: "#ffea00", size: 12 },
        { x: 210, y: 130, color: "#ffea00", size: 12 }
    ],
    goal: { x: 900, y: 50, width: 30, height: 50, color: "#ff007f" },
    switch: null,
    door: null
};
