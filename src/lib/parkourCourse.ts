export interface CoursePlatform {
  id: string;
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  sz: number;
  color?: string;
  glowColor?: string;
  type?: 'normal' | 'jump_pad' | 'moving' | 'decaying' | 'ice' | 'bouncy';
  bounceStrength?: number;
  moveRange?: { axis: 'x' | 'y' | 'z'; dist: number; speed: number };
}

export interface CourseRing {
  id: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  boostVelocity: { x: number; y: number; z: number };
  color: string;
}

export interface CourseCheckpoint {
  id: number;
  name: string;
  subtitle: string;
  x: number;
  y: number;
  z: number;
  spawnX: number;
  spawnY: number;
  spawnZ: number;
  stage: number;
  color: string;
}

export interface ParkourStageDef {
  stage: number;
  name: string;
  description: string;
  color: string;
  checkpoints: CourseCheckpoint[];
  platforms: CoursePlatform[];
  rings: CourseRing[];
}

export const COURSE_CHECKPOINTS: CourseCheckpoint[] = [
  { id: 1, stage: 1, name: 'NEON ASCENT', subtitle: 'Ground Pad & Jump Training', x: -4, y: 1.2, z: 4, spawnX: 0, spawnY: 1.2, spawnZ: 0, color: '#00ffff' },
  { id: 2, stage: 2, name: 'SKY TEMPLE RUINS', subtitle: 'Floating Cyber Islands', x: -4, y: 18.2, z: -76, spawnX: 0, spawnY: 18.2, spawnZ: -80, color: '#00e5ff' },
  { id: 3, stage: 3, name: 'GOLDEN RINGS', subtitle: 'High-Altitude Aerial Boosts', x: 16, y: 36.2, z: -156, spawnX: 20, spawnY: 36.2, spawnZ: -160, color: '#ffd700' },
  { id: 4, stage: 4, name: 'LASER SKYWALK', subtitle: 'Moving Floating Platforms', x: -14, y: 55.2, z: -226, spawnX: -10, spawnY: 55.2, spawnZ: -230, color: '#ff007f' },
  { id: 5, stage: 5, name: 'BOUNCE LAUNCHERS', subtitle: 'Kinetic Vertical Thrusters', x: 26, y: 76.2, z: -296, spawnX: 30, spawnY: 76.2, spawnZ: -300, color: '#00ff88' },
  { id: 6, stage: 6, name: 'SPIRAL SPIRE', subtitle: 'Ascending Hexagon Helix', x: -4, y: 98.2, z: -366, spawnX: 0, spawnY: 98.2, spawnZ: -370, color: '#a855f7' },
  { id: 7, stage: 7, name: 'VOID CHASM', subtitle: 'Long Distance Air Dashing', x: -29, y: 120.2, z: -436, spawnX: -25, spawnY: 120.2, spawnZ: -440, color: '#38bdf8' },
  { id: 8, stage: 8, name: 'PRECISION PILLARS', subtitle: 'Micro-Target Stepping Stones', x: 11, y: 140.2, z: -506, spawnX: 15, spawnY: 140.2, spawnZ: -510, color: '#f59e0b' },
  { id: 9, stage: 9, name: 'REACTOR OVERLOAD', subtitle: 'Dynamic Kinetic Core', x: -14, y: 160.2, z: -576, spawnX: -10, spawnY: 160.2, spawnZ: -580, color: '#ef4444' },
  { id: 10, stage: 10, name: 'NEON CORE SUMMIT', subtitle: 'Stratosphere Final Beacon', x: -6, y: 184.2, z: -646, spawnX: 0, spawnY: 184.2, spawnZ: -650, color: '#e0e7ff' },
];

export const COURSE_PLATFORMS: CoursePlatform[] = [
  // ================= STAGE 1: NEON ASCENT (z: 0 to -70, y: 0 to 16) =================
  // Spawn Platform
  { id: 's1-spawn', x: 0, y: 0, z: 0, sx: 14, sy: 1.5, sz: 14, color: '#0f172a', glowColor: '#00ffff' },
  { id: 's1-step1', x: 0, y: 2.5, z: -14, sx: 6, sy: 1.2, sz: 6, color: '#111e38', glowColor: '#00ffff' },
  { id: 's1-step2', x: -5, y: 5.5, z: -26, sx: 5, sy: 1.2, sz: 5, color: '#111e38', glowColor: '#00ffff' },
  { id: 's1-step3', x: 5, y: 8.5, z: -38, sx: 5, sy: 1.2, sz: 5, color: '#111e38', glowColor: '#00ffff' },
  { id: 's1-step4', x: 0, y: 11.5, z: -50, sx: 6, sy: 1.2, sz: 6, color: '#111e38', glowColor: '#00ffff' },
  // Launch Pad to Stage 2
  { id: 's1-jump-pad', x: 0, y: 13.5, z: -64, sx: 5, sy: 1.2, sz: 5, color: '#064e3b', glowColor: '#00ff88', type: 'jump_pad', bounceStrength: 22 },

  // ================= STAGE 2: SKY TEMPLE RUINS (z: -75 to -150, y: 17 to 34) =================
  // Stage 2 Checkpoint Island
  { id: 's2-check', x: 0, y: 17, z: -80, sx: 12, sy: 1.5, sz: 12, color: '#1e293b', glowColor: '#00e5ff' },
  { id: 's2-ruin1', x: -8, y: 20, z: -94, sx: 5, sy: 1.2, sz: 5, color: '#1e293b', glowColor: '#00e5ff' },
  { id: 's2-ruin2', x: -14, y: 23, z: -108, sx: 4.5, sy: 1.2, sz: 4.5, color: '#1e293b', glowColor: '#00e5ff' },
  { id: 's2-ruin3', x: -4, y: 26, z: -122, sx: 5, sy: 1.2, sz: 5, color: '#1e293b', glowColor: '#00e5ff' },
  { id: 's2-ruin4', x: 8, y: 29, z: -134, sx: 5, sy: 1.2, sz: 5, color: '#1e293b', glowColor: '#00e5ff' },
  { id: 's2-ruin5', x: 15, y: 32, z: -146, sx: 5.5, sy: 1.2, sz: 5.5, color: '#1e293b', glowColor: '#00e5ff' },

  // ================= STAGE 3: GOLDEN RINGS (z: -155 to -220, y: 35 to 52) =================
  // Stage 3 Checkpoint Island
  { id: 's3-check', x: 20, y: 35, z: -160, sx: 12, sy: 1.5, sz: 12, color: '#272010', glowColor: '#ffd700' },
  { id: 's3-runway', x: 20, y: 35.5, z: -174, sx: 4, sy: 1.2, sz: 12, color: '#272010', glowColor: '#ffd700' },
  // Launch pad right through ring 1
  { id: 's3-ring-pad', x: 20, y: 36, z: -184, sx: 4.5, sy: 1.2, sz: 4.5, color: '#78350f', glowColor: '#ffd700', type: 'jump_pad', bounceStrength: 24 },
  { id: 's3-landing1', x: 10, y: 44, z: -200, sx: 6, sy: 1.2, sz: 6, color: '#272010', glowColor: '#ffd700' },
  { id: 's3-landing2', x: -2, y: 48, z: -214, sx: 5.5, sy: 1.2, sz: 5.5, color: '#272010', glowColor: '#ffd700' },

  // ================= STAGE 4: LASER SKYWALK (z: -225 to -290, y: 54 to 73) =================
  // Stage 4 Checkpoint Island
  { id: 's4-check', x: -10, y: 54, z: -230, sx: 12, sy: 1.5, sz: 12, color: '#2a081a', glowColor: '#ff007f' },
  { id: 's4-move1', x: -10, y: 57, z: -244, sx: 5.5, sy: 1.2, sz: 5.5, color: '#380c25', glowColor: '#ff007f', type: 'moving', moveRange: { axis: 'x', dist: 7, speed: 1.8 } },
  { id: 's4-mid1', x: 0, y: 61, z: -258, sx: 5, sy: 1.2, sz: 5, color: '#2a081a', glowColor: '#ff007f' },
  { id: 's4-move2', x: 12, y: 65, z: -272, sx: 5.5, sy: 1.2, sz: 5.5, color: '#380c25', glowColor: '#ff007f', type: 'moving', moveRange: { axis: 'x', dist: 8, speed: 2.2 } },
  { id: 's4-mid2', x: 22, y: 69, z: -286, sx: 6, sy: 1.2, sz: 6, color: '#2a081a', glowColor: '#ff007f' },

  // ================= STAGE 5: BOUNCE LAUNCHERS (z: -295 to -360, y: 75 to 95) =================
  // Stage 5 Checkpoint Island
  { id: 's5-check', x: 30, y: 75, z: -300, sx: 12, sy: 1.5, sz: 12, color: '#064e3b', glowColor: '#00ff88' },
  { id: 's5-superpad1', x: 30, y: 75.5, z: -312, sx: 5, sy: 1.2, sz: 5, color: '#047857', glowColor: '#00ff88', type: 'jump_pad', bounceStrength: 28 },
  { id: 's5-high1', x: 20, y: 86, z: -328, sx: 5, sy: 1.2, sz: 5, color: '#064e3b', glowColor: '#00ff88' },
  { id: 's5-superpad2', x: 10, y: 88, z: -342, sx: 4.5, sy: 1.2, sz: 4.5, color: '#047857', glowColor: '#00ff88', type: 'jump_pad', bounceStrength: 26 },
  { id: 's5-landing', x: 0, y: 96, z: -356, sx: 7, sy: 1.2, sz: 7, color: '#064e3b', glowColor: '#00ff88' },

  // ================= STAGE 6: SPIRAL SPIRE (z: -365 to -430, y: 97 to 118) =================
  // Stage 6 Checkpoint Spire Base
  { id: 's6-check', x: 0, y: 97, z: -370, sx: 12, sy: 1.5, sz: 12, color: '#2e1065', glowColor: '#a855f7' },
  // Central column
  { id: 's6-spire-pillar', x: 0, y: 110, z: -390, sx: 6, sy: 32, sz: 6, color: '#1e1b4b', glowColor: '#a855f7' },
  // Spiral steps around pillar
  { id: 's6-step1', x: -8, y: 101, z: -385, sx: 4.2, sy: 1.2, sz: 4.2, color: '#3b0764', glowColor: '#c084fc' },
  { id: 's6-step2', x: -10, y: 105, z: -393, sx: 4.2, sy: 1.2, sz: 4.2, color: '#3b0764', glowColor: '#c084fc' },
  { id: 's6-step3', x: -4, y: 109, z: -401, sx: 4.2, sy: 1.2, sz: 4.2, color: '#3b0764', glowColor: '#c084fc' },
  { id: 's6-step4', x: 6, y: 113, z: -399, sx: 4.2, sy: 1.2, sz: 4.2, color: '#3b0764', glowColor: '#c084fc' },
  { id: 's6-step5', x: 10, y: 117, z: -391, sx: 4.2, sy: 1.2, sz: 4.2, color: '#3b0764', glowColor: '#c084fc' },
  { id: 's6-step6', x: 2, y: 121, z: -382, sx: 5, sy: 1.2, sz: 5, color: '#3b0764', glowColor: '#c084fc' },
  { id: 's6-top', x: -12, y: 122, z: -415, sx: 6, sy: 1.2, sz: 6, color: '#2e1065', glowColor: '#a855f7' },

  // ================= STAGE 7: VOID CHASM (z: -435 to -500, y: 119 to 138) =================
  // Stage 7 Checkpoint Island
  { id: 's7-check', x: -25, y: 119, z: -440, sx: 12, sy: 1.5, sz: 12, color: '#0c4a6e', glowColor: '#38bdf8' },
  // Long gap requiring Dash
  { id: 's7-dashpad', x: -25, y: 120, z: -452, sx: 4, sy: 1.2, sz: 8, color: '#0369a1', glowColor: '#38bdf8' },
  { id: 's7-gap1', x: -16, y: 124, z: -468, sx: 4.5, sy: 1.2, sz: 4.5, color: '#0c4a6e', glowColor: '#38bdf8' },
  { id: 's7-gap2', x: -5, y: 129, z: -482, sx: 4.5, sy: 1.2, sz: 4.5, color: '#0c4a6e', glowColor: '#38bdf8' },
  { id: 's7-gap3', x: 6, y: 134, z: -496, sx: 5, sy: 1.2, sz: 5, color: '#0c4a6e', glowColor: '#38bdf8' },

  // ================= STAGE 8: PRECISION PILLARS (z: -505 to -570, y: 139 to 158) =================
  // Stage 8 Checkpoint Island
  { id: 's8-check', x: 15, y: 139, z: -510, sx: 12, sy: 1.5, sz: 12, color: '#451a03', glowColor: '#f59e0b' },
  { id: 's8-pillar1', x: 10, y: 143, z: -522, sx: 3.5, sy: 1.2, sz: 3.5, color: '#78350f', glowColor: '#f59e0b' },
  { id: 's8-pillar2', x: 2, y: 147, z: -534, sx: 3.2, sy: 1.2, sz: 3.2, color: '#78350f', glowColor: '#f59e0b' },
  { id: 's8-pillar3', x: -6, y: 151, z: -546, sx: 3.2, sy: 1.2, sz: 3.2, color: '#78350f', glowColor: '#f59e0b' },
  { id: 's8-pillar4', x: 2, y: 155, z: -558, sx: 3.5, sy: 1.2, sz: 3.5, color: '#78350f', glowColor: '#f59e0b' },
  { id: 's8-end', x: -4, y: 158, z: -568, sx: 6, sy: 1.2, sz: 6, color: '#451a03', glowColor: '#f59e0b' },

  // ================= STAGE 9: REACTOR OVERLOAD (z: -575 to -640, y: 159 to 180) =================
  // Stage 9 Checkpoint Island
  { id: 's9-check', x: -10, y: 159, z: -580, sx: 12, sy: 1.5, sz: 12, color: '#450a0a', glowColor: '#ef4444' },
  { id: 's9-move1', x: -10, y: 163, z: -594, sx: 5, sy: 1.2, sz: 5, color: '#7f1d1d', glowColor: '#ef4444', type: 'moving', moveRange: { axis: 'x', dist: 9, speed: 2.5 } },
  { id: 's9-mid', x: 5, y: 168, z: -608, sx: 5.5, sy: 1.2, sz: 5.5, color: '#450a0a', glowColor: '#ef4444' },
  { id: 's9-pad', x: 5, y: 169, z: -618, sx: 4.5, sy: 1.2, sz: 4.5, color: '#991b1b', glowColor: '#ef4444', type: 'jump_pad', bounceStrength: 26 },
  { id: 's9-high', x: -2, y: 178, z: -634, sx: 6, sy: 1.2, sz: 6, color: '#450a0a', glowColor: '#ef4444' },

  // ================= STAGE 10: NEON CORE SUMMIT (z: -645 to -670, y: 182 to 186) =================
  // Final Summit Island
  { id: 's10-check', x: 0, y: 183, z: -650, sx: 18, sy: 2, sz: 18, color: '#1e1b4b', glowColor: '#818cf8' },
  // Victorious Throne / Core Beacon
  { id: 's10-beacon-base', x: 0, y: 185, z: -658, sx: 8, sy: 2.5, sz: 8, color: '#312e81', glowColor: '#c7d2fe' },
];

export const COURSE_RINGS: CourseRing[] = [
  // Stage 3 Golden Rings
  { id: 'ring-1', x: 20, y: 41, z: -190, radius: 3.2, boostVelocity: { x: -4, y: 8, z: -20 }, color: '#ffd700' },
  { id: 'ring-2', x: 10, y: 47, z: -206, radius: 3.2, boostVelocity: { x: -6, y: 7, z: -18 }, color: '#ffd700' },
  // Stage 5 Sky Ring
  { id: 'ring-3', x: 25, y: 84, z: -320, radius: 3.5, boostVelocity: { x: -5, y: 6, z: -18 }, color: '#00ff88' },
  // Stage 7 Void Ring
  { id: 'ring-4', x: -20, y: 123, z: -460, radius: 3.2, boostVelocity: { x: 5, y: 6, z: -20 }, color: '#38bdf8' },
  // Stage 9 Overload Ring
  { id: 'ring-5', x: 5, y: 175, z: -626, radius: 3.5, boostVelocity: { x: -4, y: 7, z: -20 }, color: '#ef4444' },
];
