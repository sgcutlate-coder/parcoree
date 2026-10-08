import {
  CourseDifficulty,
  PlatformType,
  ItemType,
  DIFFICULTY_CONFIGS,
} from './parkourDifficulties';
import { generateCourse } from './courseGenerator';

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
  type?: PlatformType;
  bounceStrength?: number;
  moveRange?: { axis: 'x' | 'y' | 'z'; dist: number; speed: number };
  conveyorSpeed?: number;
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

export interface CourseItem {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  z: number;
  color: string;
  glowColor: string;
}

export interface ParkourCourseData {
  difficulty: CourseDifficulty;
  totalStages: number;
  checkpoints: CourseCheckpoint[];
  platforms: CoursePlatform[];
  rings: CourseRing[];
  items: CourseItem[];
}

// Generate courses for all 4 difficulties
// Easy (10 levels), Medium (20 levels), Hard (30 levels), Ultra Hard (50 levels)
export const COURSES: Record<CourseDifficulty, ParkourCourseData> = {
  easy: generateCourse('easy'),
  medium: generateCourse('medium'),
  hard: generateCourse('hard'),
  ultra_hard: generateCourse('ultra_hard'),
};

export function getCourseForDifficulty(difficulty: CourseDifficulty): ParkourCourseData {
  return COURSES[difficulty] || COURSES.easy;
}

// Backwards compatibility default exports (Easy course)
export const COURSE_CHECKPOINTS: CourseCheckpoint[] = COURSES.easy.checkpoints;
export const COURSE_PLATFORMS: CoursePlatform[] = COURSES.easy.platforms;
export const COURSE_RINGS: CourseRing[] = COURSES.easy.rings;
export const COURSE_ITEMS: CourseItem[] = COURSES.easy.items;
