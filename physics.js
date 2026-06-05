// physics.js - Common calculations and collisions helper
export function checkOverlap(a, b, tol = 0) {
    return a.x + tol < b.x + (b.width || 0) &&
           a.x + (a.width || 0) - tol > b.x &&
           a.y + tol < b.y + (b.height || 0) &&
           a.y + (a.height || 0) > b.y;
}
export const PHYSICS = {
    GRAVITY: 0.38,
    MAX_FALL_SPEED: 9,
    ACCELERATION: 0.45,
    FRICTION: 0.76,
    JUMP_FORCE: -8.8,
    MINI_JUMP_FORCE: -2.8,
    COYOTE_TIME_MAX: 6,
    JUMP_BUFFER_MAX: 5
};
