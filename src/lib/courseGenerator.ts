import {
  CourseDifficulty,
  PlatformType,
  ItemType,
  DIFFICULTY_CONFIGS,
} from './parkourDifficulties';
import { CoursePlatform, CourseRing, CourseCheckpoint, CourseItem, ParkourCourseData } from './parkourCourse';

// Structural Archetype Names
type Archetype =
  | 'zigzag_catwalk'
  | 'spiral_helix'
  | 'archipelago_cluster'
  | 'moving_skywalk'
  | 'vertical_launcher'
  | 'precision_pillars'
  | 'ice_glide'
  | 'decaying_bridge'
  | 'laser_gauntlet'
  | 'phase_steps'
  | 'conveyor_runway'
  | 'aerial_ring_dash';

// Pseudo-random deterministic generator based on seed
function createSeededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Stage naming generator
const STAGE_PREFIXES: Record<CourseDifficulty, string[]> = {
  easy: [
    'NEON ASCENT', 'SKY TEMPLE', 'GOLDEN RINGS', 'LASER SKYWALK', 'BOUNCE LAUNCH',
    'SPIRAL SPIRE', 'VOID CHASM', 'PRECISION PEAK', 'REACTOR CORE', 'SUMMIT HORIZON'
  ],
  medium: [
    'PULSE HIGHWAY', 'EMERALD RUNWAY', 'KINETIC DOCKS', 'HELIX CITADEL', 'AERO SLIDE',
    'ORBITAL DRAFT', 'CYBER PLAZA', 'TRAMPOLINE TOWER', 'DRIFT CHASM', 'FROST NEXUS',
    'MATRIX CROSSING', 'STRATO STRIP', 'ION LAUNCHER', 'VORTEX ALLEY', 'PULSE PILLARS',
    'KINETIC LABYRINTH', 'CHRONO RUNWAY', 'GLIDE OVERPASS', 'NEO STRATOSPHERE', 'METROPOLIS APEX'
  ],
  hard: [
    'DECAYING RUINS', 'QUANTUM CREVASSE', 'LASER BASTION', 'CRUMBLING SPAN', 'CRIMSON ASCENT',
    'MICRO PILLARS', 'GRID CORRIDOR', 'PHOTON SPIRE', 'SHATTER CHASM', 'HAZARD CHUTE',
    'PHASE OVERLOAD', 'THERMAL SHIFT', 'PRECISION VOID', 'FALLOUT GAP', 'PLASMA PASSAGE',
    'ENTROPY WALK', 'QUANTUM HELIX', 'CRITICAL MASS', 'TITAN CROSSING', 'VOID ANCHOR',
    'NULL BEACON', 'SUPERCHARGED CHASM', 'REACTOR EXHAUST', 'NANITE PILLARS', 'ISOTOPE SKYWAY',
    'ZERO GRAVITY SHAFT', 'WARP CREST', 'SEISMIC RIDGE', 'SINGULARITY GATE', 'QUANTUM PINNACLE'
  ],
  ultra_hard: [
    'ABYSSAL VOID', 'SINGULARITY RIM', 'PHASE GAUNTLET', 'EVENT HORIZON', 'GRAVITON STRIP',
    'OBLIVION CHASM', 'TIME WARP SPIRE', 'NEO PURGATORY', 'DARK PHOTON', 'NULL SECTOR',
    'CHRONO VOID', 'MICRO NEEDLE', 'QUANTUM ANOMALY', 'HAZARD MAZE', 'AERO SINGULARITY',
    'HYPER CONVEYOR', 'PHASE FLUX', 'COSMIC ABYSS', 'VOID TREMOR', 'PULSAR RUNWAY',
    'NEBULA CROSSING', 'SPATIAL FRACTURE', 'ANTIMATTER PATH', 'STRATO VOID', 'QUARK PILLARS',
    'BLACK HOLE RUNWAY', 'NULL MATRIX', 'ABYSS RIFT', 'CHRONO MATRIX', 'NIGHTMARE GAUNTLET',
    'DECAY MONOLITH', 'CYBERNETIC ABYSS', 'PHOTON CREVASSE', 'SINGULARITY CORE', 'WARP RIFT',
    'ABYSSAL APEX', 'EVENT CREST', 'ENTROPY SUMMIT', 'SUPERNOVA STRIP', 'DARK MATTER SPAN',
    'COSMIC RUNWAY', 'ULTRA PHOTON', 'TEMPORAL DRIFT', 'HYPER PHASE', 'VOID DOMINION',
    'FINAL ZERO', 'INFINITY CHASM', 'OMEGA SPIRE', 'GENESIS CREST', 'SINGULARITY THRONE'
  ],
};

const STAGE_SUBTITLES = [
  'Dynamic Kinetic Traversal',
  'Precision Air-Dash Vector',
  'High-Altitude Kinetic Boosters',
  'Oscillating Tech Platforms',
  'Zero-Friction Gliding Route',
  'Crumbling Structural Matrix',
  'Lethal Laser Deflection',
  'Intermittent Phase Steps',
  'Accelerated Conveyor Sprint',
  'Stratospheric Aerial Rings',
  'Vertical Ascent Helix',
  'Asymmetrical Island Clusters',
];

export function generateCourse(difficulty: CourseDifficulty): ParkourCourseData {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const totalStages = config.levelCount;
  const rand = createSeededRandom(
    difficulty === 'easy' ? 42 : difficulty === 'medium' ? 1337 : difficulty === 'hard' ? 9999 : 88888
  );

  const checkpoints: CourseCheckpoint[] = [];
  const platforms: CoursePlatform[] = [];
  const rings: CourseRing[] = [];
  const items: CourseItem[] = [];

  // Starting anchor cursor
  let cursor = { x: 0, y: 0, z: 0 };

  // Generate each stage
  for (let stageNum = 1; stageNum <= totalStages; stageNum++) {
    const isFirstStage = stageNum === 1;
    const isFinalStage = stageNum === totalStages;
    const progress = stageNum / totalStages; // 0 to 1

    // Stage Names & Colors
    const prefixList = STAGE_PREFIXES[difficulty];
    const stageName = prefixList[(stageNum - 1) % prefixList.length] || `STAGE ${stageNum}`;
    const subtitle = STAGE_SUBTITLES[Math.floor(rand() * STAGE_SUBTITLES.length)];

    // Color gradient based on stage progress
    const stageColor = config.color;
    const stageGlow = config.glowColor;

    // Checkpoint Island size
    const cpPlatformSize = isFirstStage ? 14 : isFinalStage ? 18 : Math.max(9, 13 - progress * 4);
    const cpPlatformId = `cp-plat-${stageNum}`;

    // Add Checkpoint Island Platform
    platforms.push({
      id: cpPlatformId,
      x: cursor.x,
      y: cursor.y,
      z: cursor.z,
      sx: cpPlatformSize,
      sy: 1.6,
      sz: cpPlatformSize,
      color: isFinalStage ? '#1e1b4b' : '#0f172a',
      glowColor: isFinalStage ? '#c084fc' : stageGlow,
      type: 'normal',
    });

    // Add Checkpoint Beacon Object
    checkpoints.push({
      id: stageNum,
      stage: stageNum,
      name: stageName,
      subtitle: subtitle,
      x: cursor.x,
      y: cursor.y + 1.2,
      z: cursor.z,
      spawnX: cursor.x,
      spawnY: cursor.y + 1.2,
      spawnZ: cursor.z,
      color: stageGlow,
    });

    // If final stage, we stop here (Throne / Summit Core)
    if (isFinalStage) {
      // Add summit throne decorative plinth
      platforms.push({
        id: 'summit-throne-base',
        x: cursor.x,
        y: cursor.y + 1.8,
        z: cursor.z - 8,
        sx: 8,
        sy: 2.2,
        sz: 8,
        color: '#2e1065',
        glowColor: '#c084fc',
        type: 'normal',
      });
      break;
    }

    // Determine how many platforms this stage has (3 to 6 platforms)
    const platformCount = Math.floor(3 + rand() * 3);

    // Pick Archetypes based on difficulty & stage progress to prevent repetition
    const availableArchetypes: Archetype[] = ['zigzag_catwalk', 'archipelago_cluster'];

    if (difficulty === 'easy') {
      availableArchetypes.push('vertical_launcher', 'precision_pillars', 'aerial_ring_dash');
    } else if (difficulty === 'medium') {
      availableArchetypes.push(
        'moving_skywalk',
        'ice_glide',
        'spiral_helix',
        'vertical_launcher',
        'precision_pillars',
        'aerial_ring_dash'
      );
    } else if (difficulty === 'hard') {
      availableArchetypes.push(
        'moving_skywalk',
        'decaying_bridge',
        'laser_gauntlet',
        'precision_pillars',
        'spiral_helix',
        'aerial_ring_dash',
        'ice_glide'
      );
    } else {
      // ultra_hard
      availableArchetypes.push(
        'phase_steps',
        'conveyor_runway',
        'decaying_bridge',
        'laser_gauntlet',
        'moving_skywalk',
        'spiral_helix',
        'precision_pillars',
        'aerial_ring_dash'
      );
    }

    // Select archetype for this stage
    const archetype = availableArchetypes[(stageNum + Math.floor(rand() * 3)) % availableArchetypes.length];

    // Generate path according to archetype
    let currentX = cursor.x;
    let currentY = cursor.y;
    let currentZ = cursor.z;

    // Advance beyond the checkpoint platform
    currentZ -= cpPlatformSize / 2 + 5;

    for (let pIdx = 0; pIdx < platformCount; pIdx++) {
      const pId = `s${stageNum}-p${pIdx + 1}`;
      const platProgress = pIdx / platformCount;

      // Scaling dimensions: shrinks on harder difficulties and later stages
      const baseW = Math.max(2.4, 6.5 - progress * 2.8 - (rand() * 0.8));
      const baseD = Math.max(2.4, 6.5 - progress * 2.8 - (rand() * 0.8));
      let pWidth = baseW;
      let pDepth = baseD;
      let pType: PlatformType = 'normal';
      let bounceStrength = 22;
      let moveRange: { axis: 'x' | 'y' | 'z'; dist: number; speed: number } | undefined = undefined;
      let conveyorSpeed = 10;
      let pColor = '#111e38';
      let pGlow = stageGlow;

      // Structural layout behaviors per archetype:
      switch (archetype) {
        case 'spiral_helix': {
          const angle = (pIdx * 0.8) + (stageNum * 0.5);
          const radius = 9 + rand() * 3;
          currentX = cursor.x + Math.sin(angle) * radius;
          currentY += 2.8 + rand() * 1.5;
          currentZ -= 9 + rand() * 3;
          pWidth = Math.max(3.2, baseW);
          pDepth = Math.max(3.2, baseD);
          pColor = '#1e1b4b';
          pGlow = '#a855f7';
          break;
        }

        case 'zigzag_catwalk': {
          const side = pIdx % 2 === 0 ? -1 : 1;
          const xOffset = side * (5 + rand() * 4);
          currentX = cursor.x + xOffset;
          currentY += 1.8 + rand() * 1.8;
          currentZ -= 11 + rand() * 3;
          break;
        }

        case 'archipelago_cluster': {
          const angle = (rand() - 0.5) * 1.2;
          currentX += Math.sin(angle) * 8;
          currentY += 1.2 + rand() * 2.2;
          currentZ -= 12 + rand() * 3;
          pWidth = 4.2 + rand() * 2.5;
          pDepth = 4.2 + rand() * 2.5;
          break;
        }

        case 'moving_skywalk': {
          currentX += (rand() - 0.5) * 6;
          currentY += 1.5 + rand() * 2.0;
          currentZ -= 12 + rand() * 3;
          pType = 'moving';
          const axis = rand() > 0.4 ? 'x' : 'y';
          moveRange = {
            axis,
            dist: axis === 'x' ? 6 + rand() * 3 : 3 + rand() * 2,
            speed: 1.4 + progress * 1.0,
          };
          pColor = '#2a173b';
          pGlow = '#e879f9';
          break;
        }

        case 'vertical_launcher': {
          currentZ -= 10 + rand() * 3;
          if (pIdx === 0) {
            pType = 'jump_pad';
            bounceStrength = 24 + progress * 4;
            pColor = '#064e3b';
            pGlow = '#00ff88';
          } else {
            currentY += 8 + rand() * 3;
            currentX += (rand() - 0.5) * 6;
          }
          break;
        }

        case 'precision_pillars': {
          currentX += (rand() - 0.5) * 8;
          currentY += 2.0 + rand() * 1.5;
          currentZ -= 9 + rand() * 2.5;
          pWidth = Math.max(2.2, 3.2 - progress * 0.8);
          pDepth = Math.max(2.2, 3.2 - progress * 0.8);
          pColor = '#3b1d08';
          pGlow = '#f59e0b';
          break;
        }

        case 'ice_glide': {
          currentZ -= 12 + rand() * 3;
          currentY += 1.0 + rand() * 1.2;
          currentX += (rand() - 0.5) * 4;
          pType = 'ice';
          pWidth = 4.5;
          pDepth = 7.0;
          pColor = '#0c4a6e';
          pGlow = '#38bdf8';
          break;
        }

        case 'decaying_bridge': {
          currentX += (rand() - 0.5) * 5;
          currentY += 1.6 + rand() * 1.6;
          currentZ -= 10 + rand() * 2.5;
          pType = 'decaying';
          pColor = '#571804';
          pGlow = '#fb923c';
          break;
        }

        case 'laser_gauntlet': {
          currentX += (rand() - 0.5) * 6;
          currentY += 1.8 + rand() * 1.5;
          currentZ -= 11 + rand() * 3;
          if (pIdx % 2 === 1) {
            pType = 'laser_hazard';
            pColor = '#500707';
            pGlow = '#ef4444';
          }
          break;
        }

        case 'phase_steps': {
          currentX += (rand() - 0.5) * 7;
          currentY += 2.0 + rand() * 1.6;
          currentZ -= 10 + rand() * 2.5;
          pType = 'phase';
          pColor = '#3b0764';
          pGlow = '#c084fc';
          break;
        }

        case 'conveyor_runway': {
          currentZ -= 14 + rand() * 3;
          currentY += 0.8 + rand() * 1.2;
          pType = 'conveyor';
          pWidth = 3.8;
          pDepth = 10;
          conveyorSpeed = 12 + progress * 4;
          pColor = '#042f2e';
          pGlow = '#14b8a6';
          break;
        }

        case 'aerial_ring_dash': {
          currentZ -= 13 + rand() * 3;
          currentY += 2.5 + rand() * 2;
          currentX += (rand() - 0.5) * 6;
          // Spawn a golden ring midway
          rings.push({
            id: `ring-${stageNum}-${pIdx}`,
            x: currentX,
            y: currentY + 2.5,
            z: currentZ + 5,
            radius: 3.2,
            boostVelocity: {
              x: (rand() - 0.5) * 4,
              y: 7 + rand() * 3,
              z: -18 - rand() * 4,
            },
            color: '#ffd700',
          });
          break;
        }
      }

      // Add platform
      platforms.push({
        id: pId,
        x: currentX,
        y: currentY,
        z: currentZ,
        sx: pWidth,
        sy: 1.2,
        sz: pDepth,
        color: pColor,
        glowColor: pGlow,
        type: pType,
        bounceStrength,
        moveRange,
        conveyorSpeed,
      });

      // Spawn Collectible Items (Data Cores & Power-ups)
      if (rand() > 0.45) {
        let itemType: ItemType = 'data_core';
        let itemColor = '#00ffff';
        let itemGlow = '#38bdf8';

        const itemRoll = rand();
        if (difficulty !== 'easy' && itemRoll > 0.75) {
          // Special power-up
          if (itemRoll > 0.92) {
            itemType = 'shield';
            itemColor = '#38bdf8';
            itemGlow = '#0284c7';
          } else if (itemRoll > 0.85) {
            itemType = 'chrono_freeze';
            itemColor = '#c084fc';
            itemGlow = '#9333ea';
          } else if (itemRoll > 0.80) {
            itemType = 'anti_gravity';
            itemColor = '#a3e635';
            itemGlow = '#65a30d';
          } else {
            itemType = 'dash_refill';
            itemColor = '#fbbf24';
            itemGlow = '#d97706';
          }
        }

        items.push({
          id: `item-${stageNum}-${pIdx}`,
          type: itemType,
          x: currentX,
          y: currentY + 1.8,
          z: currentZ,
          color: itemColor,
          glowColor: itemGlow,
        });
      }
    }

    // Set next checkpoint cursor based on the last platform reached
    cursor = {
      x: currentX,
      y: currentY + 2.5,
      z: currentZ - (14 + rand() * 4),
    };
  }

  return {
    difficulty,
    totalStages,
    checkpoints,
    platforms,
    rings,
    items,
  };
}
