// levels/level3.js
export const level3 = {
    platforms: [
        { x: 0, y: 500, width: 220, height: 40, color: "#1e1d3b" },
        { x: 220, y: 500, width: 520, height: 40, color: "#15142b" },
        { x: 740, y: 500, width: 220, height: 40, color: "#1e1d3b" },
        { x: 280, y: 410, width: 110, height: 20, color: "#2e2b5c" },
        { x: 570, y: 410, width: 110, height: 20, color: "#2e2b5c" }
    ],
    spikes: [
        { x: 240, y: 480, width: 20, height: 20 },
        { x: 460, y: 480, width: 20, height: 20 },
        { x: 480, y: 480, width: 20, height: 20 },
        { x: 700, y: 480, width: 20, height: 20 }
    ],
    collectibles: [
        { x: 250, y: 440, color: "#ffea00", size: 12 },
        { x: 480, y: 440, color: "#ffea00", size: 12 },
        { x: 710, y: 440, color: "#ffea00", size: 12 }
    ],
    goal: { x: 860, y: 450, width: 30, height: 50, color: "#ff007f" },
    switch: null,
    door: null
};
