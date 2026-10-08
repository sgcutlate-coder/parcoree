export type CourseDifficulty = 'easy' | 'medium' | 'hard' | 'ultra_hard';

export type PlatformType =
  | 'normal'
  | 'jump_pad'
  | 'moving'
  | 'decaying'
  | 'ice'
  | 'bouncy'
  | 'laser_hazard'
  | 'phase'
  | 'conveyor';

export type ItemType =
  | 'data_core'
  | 'dash_refill'
  | 'anti_gravity'
  | 'chrono_freeze'
  | 'shield';

export interface DifficultyConfig {
  id: CourseDifficulty;
  name: string;
  subtitle: string;
  levelCount: number;
  parTimeSeconds: number;
  color: string;
  glowColor: string;
  bgAtmosphere: string;
  badge: string;
  description: string;
  mechanics: string[];
}

export const DIFFICULTY_CONFIGS: Record<CourseDifficulty, DifficultyConfig> = {
  easy: {
    id: 'easy',
    name: 'NEON ASCENT',
    subtitle: 'Ground Pad & Jump Training',
    levelCount: 10,
    parTimeSeconds: 900, // 15 mins
    color: '#00ffff',
    glowColor: '#00e5ff',
    bgAtmosphere: '#04060f',
    badge: '🟢 EASY',
    description: 'Generous platform footprints, basic jump pads, speed rings, and forgiving recovery zones.',
    mechanics: ['Wide Platforms', 'Kinetic Jump Pads', 'Golden Speed Rings', 'Data Cores'],
  },
  medium: {
    id: 'medium',
    name: 'CYBER METROPOLIS',
    subtitle: 'Pulse Corridors & Kinetic Drift',
    levelCount: 20,
    parTimeSeconds: 1320, // 22 mins
    color: '#10b981',
    glowColor: '#34d399',
    bgAtmosphere: '#03140e',
    badge: '🟡 MEDIUM',
    description: 'Dynamic moving platforms, slippery ice blocks, bouncy trampolines, and vertical helix ascents.',
    mechanics: ['Moving Blocks', 'Ice Platforms', 'Bouncy Trampolines', 'Dash Cells', 'Vertical Helices'],
  },
  hard: {
    id: 'hard',
    name: 'QUANTUM SPIRE',
    subtitle: 'Laser Chasms & Decaying Matrices',
    levelCount: 30,
    parTimeSeconds: 2100, // 35 mins
    color: '#f59e0b',
    glowColor: '#fbbf24',
    bgAtmosphere: '#1a0c02',
    badge: '🔴 HARD',
    description: 'Crumbling decaying blocks, lethal laser hazard grids, precision stepping pillars, and tight air dashes.',
    mechanics: ['Decaying Blocks', 'Laser Hazard Grids', 'Precision Pillars', 'Anti-Grav Boosters', 'Shields'],
  },
  ultra_hard: {
    id: 'ultra_hard',
    name: 'SINGULARITY ABYSS',
    subtitle: 'Void Gauntlet & Chrono Trials',
    levelCount: 50,
    parTimeSeconds: 3000, // 50 mins
    color: '#c084fc',
    glowColor: '#e879f9',
    bgAtmosphere: '#140321',
    badge: '🟣 ULTRA HARD',
    description: 'Phase-blinking platforms, micro-step blocks, high-speed conveyors, and unforgiving void gaps.',
    mechanics: ['Phase Ghost Blocks', 'Speed Conveyors', 'Micro Pillars', 'Chrono Freeze', 'Aerial Ring Chains'],
  },
};
