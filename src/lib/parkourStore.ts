import { create } from 'zustand';
import { COURSE_CHECKPOINTS, COURSE_PLATFORMS, CoursePlatform } from './parkourCourse';
import { parkourAudio } from './parkourAudio';

export interface CompetitorRacer {
  id: string;
  name: string;
  color: string;
  glowColor: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  stage: number;
  isDashing: boolean;
  isGrounded: boolean;
  speed: number;
  targetPlatformIndex: number;
  finished: boolean;
  finishTime: number | null;
  skillSpeed: number; // Multiplier 0.88 to 1.08
}

export interface RacerStanding {
  id: string;
  name: string;
  color: string;
  stage: number;
  zDist: number;
  rank: number;
  isSelf: boolean;
  finished: boolean;
  finishTime: number | null;
}

export interface ParkourState {
  // Gameplay Progress
  gameStarted: boolean;
  currentStage: number;
  stageName: string;
  stageSubtitle: string;
  currentCheckpointId: number;
  respawnPosition: [number, number, number];
  
  // Timer & Stats
  timer: number;
  isTimerRunning: boolean;
  isFinished: boolean;
  finishTime: number | null;
  deaths: number;
  dashCooldown: number; // 0 to 1, 0 is ready
  canDoubleJump: boolean;

  // Multiplayer Room State (1 to 4 Players)
  gameMode: 'solo' | 'multiplayer';
  roomCode: string;
  playerCount: number; // 1 to 4
  playerName: string;
  competitors: CompetitorRacer[];
  playerRank: number; // 1 to 4
  standings: RacerStanding[];

  // Crossplay & Input
  platformMode: 'pc' | 'mobile';
  joystickVector: { x: number; y: number };
  isJumpHeld: boolean;
  isDashHeld: boolean;
  
  // Notification & Audio
  activeNotification: string | null;
  showVictoryModal: boolean;
  isMuted: boolean;

  // Actions
  init: () => void;
  startGame: (mode?: 'solo' | 'multiplayer', count?: number, name?: string, code?: string) => void;
  createRoom: (count: number, name?: string) => string;
  joinRoom: (code: string, name?: string) => boolean;
  updateCompetitors: (dt: number, playerX: number, playerY: number, playerZ: number) => void;
  tickTimer: (delta: number) => void;
  reachCheckpoint: (id: number) => void;
  triggerRespawn: () => [number, number, number];
  triggerDash: () => boolean;
  setDoubleJumpAvailable: (avail: boolean) => void;
  completeCourse: () => void;
  restartGame: () => void;
  setPlatformMode: (mode: 'pc' | 'mobile') => void;
  setJoystickVector: (vec: { x: number; y: number }) => void;
  setJumpHeld: (held: boolean) => void;
  setDashHeld: (held: boolean) => void;
  toggleMute: () => void;
  clearNotification: () => void;
  teleportToStage: (stageNum: number) => [number, number, number];
}

const FIRST_CP = COURSE_CHECKPOINTS[0];

const COMPETITOR_PRESETS: Array<{ name: string; color: string; glowColor: string; skill: number }> = [
  { name: 'VORTEX-02', color: '#ff007f', glowColor: '#ff007f', skill: 1.02 },
  { name: 'TITAN-03', color: '#00ff88', glowColor: '#00ff88', skill: 0.96 },
  { name: 'SOLAR-04', color: '#ffd700', glowColor: '#ffd700', skill: 0.99 },
];

function generateCompetitors(count: number): CompetitorRacer[] {
  // count is total players (1 to 4), so other competitors = count - 1
  const numCompetitors = Math.max(0, Math.min(3, count - 1));
  const result: CompetitorRacer[] = [];

  for (let i = 0; i < numCompetitors; i++) {
    const preset = COMPETITOR_PRESETS[i];
    // Slightly offset spawn X so they don't clip into player
    const spawnOffsetX = (i + 1) * 2 - 4;
    result.push({
      id: `bot-${i + 1}`,
      name: preset.name,
      color: preset.color,
      glowColor: preset.glowColor,
      x: FIRST_CP.spawnX + spawnOffsetX,
      y: FIRST_CP.spawnY,
      z: FIRST_CP.spawnZ + 1,
      vx: 0,
      vy: 0,
      vz: 0,
      stage: 1,
      isDashing: false,
      isGrounded: true,
      speed: 0,
      targetPlatformIndex: 1,
      finished: false,
      finishTime: null,
      skillSpeed: preset.skill,
    });
  }

  return result;
}

export const useParkourStore = create<ParkourState>((set, get) => ({
  gameStarted: false,
  currentStage: 1,
  stageName: FIRST_CP.name,
  stageSubtitle: FIRST_CP.subtitle,
  currentCheckpointId: 1,
  respawnPosition: [FIRST_CP.spawnX, FIRST_CP.spawnY, FIRST_CP.spawnZ],

  timer: 0,
  isTimerRunning: false,
  isFinished: false,
  finishTime: null,
  deaths: 0,
  dashCooldown: 0,
  canDoubleJump: true,

  // Multiplayer default state
  gameMode: 'solo',
  roomCode: 'NEON-8821',
  playerCount: 1,
  playerName: 'Runner-1',
  competitors: [],
  playerRank: 1,
  standings: [],

  platformMode: 'pc',
  joystickVector: { x: 0, y: 0 },
  isJumpHeld: false,
  isDashHeld: false,

  activeNotification: '🚀 STAGE 1: NEON ASCENT — TIME ATTACK STARTED! GOAL: < 15:00',
  showVictoryModal: false,
  isMuted: false,

  init: () => {
    if (typeof window !== 'undefined') {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      set({ platformMode: isTouch ? 'mobile' : 'pc' });

      // Check if URL has ?room=...
      const urlParams = new URLSearchParams(window.location.search);
      const room = urlParams.get('room');
      if (room) {
        set({ roomCode: room.toUpperCase() });
      }
    }
  },

  startGame: (mode = 'solo', count = 1, name = 'Runner-1', code) => {
    parkourAudio.playJump();
    const finalRoom = code || `NEON-${Math.floor(1000 + Math.random() * 9000)}`;
    const compList = mode === 'multiplayer' ? generateCompetitors(count) : [];

    set({
      gameStarted: true,
      isTimerRunning: true,
      gameMode: mode,
      playerCount: count,
      playerName: name || 'Runner-1',
      roomCode: finalRoom,
      competitors: compList,
      activeNotification: mode === 'multiplayer'
        ? `🔥 ROOM ${finalRoom} STARTED! ${count} PLAYERS RACING TO SUMMIT!`
        : '🚀 STAGE 1: NEON ASCENT — TIME ATTACK STARTED! GOAL: < 15:00',
    });
  },

  createRoom: (count: number, name = 'Runner-1') => {
    const code = `NEON-${Math.floor(1000 + Math.random() * 9000)}`;
    get().startGame('multiplayer', count, name, code);
    return code;
  },

  joinRoom: (code: string, name = 'Runner-1') => {
    const cleanCode = (code || 'NEON-1000').trim().toUpperCase();
    get().startGame('multiplayer', 4, name, cleanCode);
    return true;
  },

  updateCompetitors: (dt: number, playerX: number, playerY: number, playerZ: number) => {
    const { competitors, gameMode, timer, currentStage } = get();
    if (gameMode !== 'multiplayer' || competitors.length === 0) return;

    let updated = false;
    const newComps = competitors.map((racer) => {
      if (racer.finished) return racer;

      updated = true;
      let targetP = COURSE_PLATFORMS[racer.targetPlatformIndex];
      if (!targetP) {
        targetP = COURSE_PLATFORMS[COURSE_PLATFORMS.length - 1];
      }

      // Desired target coords
      const targetX = targetP.x;
      const targetY = targetP.y + targetP.sy / 2;
      const targetZ = targetP.z;

      const dx = targetX - racer.x;
      const dy = targetY - racer.y;
      const dz = targetZ - racer.z;
      const horizDist = Math.hypot(dx, dz);

      // Horizontal steering
      const baseSpeed = 12.5 * racer.skillSpeed;
      const dirX = horizDist > 0.1 ? (dx / horizDist) : 0;
      const dirZ = horizDist > 0.1 ? (dz / horizDist) : -1;

      // Vertical gravity & ground check
      let newVy = racer.vy - 36 * dt;
      let newY = racer.y + newVy * dt;
      let grounded = false;

      // Platform ground detection for racer
      for (let i = 0; i < COURSE_PLATFORMS.length; i++) {
        const p = COURSE_PLATFORMS[i];
        const topY = p.y + p.sy / 2;
        if (
          racer.x >= p.x - p.sx / 2 - 0.4 &&
          racer.x <= p.x + p.sx / 2 + 0.4 &&
          racer.z >= p.z - p.sz / 2 - 0.4 &&
          racer.z <= p.z + p.sz / 2 + 0.4 &&
          racer.y >= topY - 0.25 &&
          newY <= topY + 0.25 &&
          newVy <= 0
        ) {
          newY = topY;
          grounded = true;
          if (p.type === 'jump_pad') {
            newVy = p.bounceStrength || 24;
            grounded = false;
          } else {
            newVy = 0;
          }
          break;
        }
      }

      // Jump when reaching platform edge or next platform is higher
      if (grounded && (horizDist < 3.2 || dy > 1.5)) {
        newVy = 14.5;
        grounded = false;
      }

      // Move forward
      let newX = racer.x + dirX * baseSpeed * dt;
      let newZ = racer.z + dirZ * baseSpeed * dt;

      // Platform reached -> advance to next platform
      let nextTargetIndex = racer.targetPlatformIndex;
      if (horizDist < 2.5) {
        if (racer.targetPlatformIndex < COURSE_PLATFORMS.length - 1) {
          nextTargetIndex = racer.targetPlatformIndex + 1;
        } else {
          // Reached finish Summit!
          return {
            ...racer,
            x: targetX,
            y: targetY,
            z: targetZ,
            finished: true,
            finishTime: timer,
          };
        }
      }

      // Check current stage based on Z
      let currentStageNum = 1;
      for (let c = 0; c < COURSE_CHECKPOINTS.length; c++) {
        if (newZ <= COURSE_CHECKPOINTS[c].spawnZ + 4) {
          currentStageNum = COURSE_CHECKPOINTS[c].stage;
        }
      }

      // Void respawn if fallen
      if (newY < targetY - 14 || newY < -12) {
        const cp = COURSE_CHECKPOINTS.find((c) => c.stage === currentStageNum) || FIRST_CP;
        newX = cp.spawnX;
        newY = cp.spawnY + 1;
        newZ = cp.spawnZ;
        newVy = 0;
      }

      return {
        ...racer,
        x: newX,
        y: newY,
        z: newZ,
        vy: newVy,
        isGrounded: grounded,
        targetPlatformIndex: nextTargetIndex,
        stage: currentStageNum,
        speed: baseSpeed,
      };
    });

    // Build real-time standings
    const allRacers: RacerStanding[] = [
      {
        id: 'self',
        name: get().playerName || 'You',
        color: '#00ffff',
        stage: currentStage,
        zDist: -playerZ, // Higher number = closer to summit (-650)
        rank: 1,
        isSelf: true,
        finished: get().isFinished,
        finishTime: get().finishTime,
      },
      ...newComps.map((r) => ({
        id: r.id,
        name: r.name,
        color: r.color,
        stage: r.stage,
        zDist: -r.z,
        rank: 1,
        isSelf: false,
        finished: r.finished,
        finishTime: r.finishTime,
      })),
    ];

    // Sort by: finished first (by finishTime asc), then by stage desc, then by zDist desc
    allRacers.sort((a, b) => {
      if (a.finished && b.finished) {
        return (a.finishTime || 0) - (b.finishTime || 0);
      }
      if (a.finished) return -1;
      if (b.finished) return 1;
      if (a.stage !== b.stage) return b.stage - a.stage;
      return b.zDist - a.zDist;
    });

    allRacers.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    const myRankItem = allRacers.find((r) => r.isSelf);
    const myRank = myRankItem ? myRankItem.rank : 1;

    set({
      competitors: newComps,
      standings: allRacers,
      playerRank: myRank,
    });
  },

  tickTimer: (delta: number) => {
    const { gameStarted, isTimerRunning, isFinished, dashCooldown } = get();
    if (!gameStarted || !isTimerRunning || isFinished) return;

    let newDashCd = dashCooldown - delta * 0.8; // ~1.2s cooldown
    if (newDashCd < 0) newDashCd = 0;

    set((state) => ({
      timer: state.timer + delta,
      dashCooldown: newDashCd,
    }));
  },

  reachCheckpoint: (id: number) => {
    const { currentCheckpointId } = get();
    if (id <= currentCheckpointId) return; // Only advance forward

    const cp = COURSE_CHECKPOINTS.find((c) => c.id === id);
    if (!cp) return;

    parkourAudio.playCheckpoint();
    set({
      currentCheckpointId: id,
      currentStage: cp.stage,
      stageName: cp.name,
      stageSubtitle: cp.subtitle,
      respawnPosition: [cp.spawnX, cp.spawnY, cp.spawnZ],
      activeNotification: `⚡ CHECKPOINT ${cp.stage}/10: ${cp.name} SAVED!`,
    });

    if (cp.stage === 10) {
      get().completeCourse();
    }
  },

  triggerRespawn: () => {
    parkourAudio.playRespawn();
    set((state) => ({
      deaths: state.deaths + 1,
      dashCooldown: 0,
      activeNotification: `⚠️ FALL DETECTED! RESPAWNING AT STAGE ${state.currentStage}...`,
    }));
    return get().respawnPosition;
  },

  triggerDash: () => {
    const { dashCooldown } = get();
    if (dashCooldown > 0.05) return false;

    parkourAudio.playDash();
    set({ dashCooldown: 1.0 });
    return true;
  },

  setDoubleJumpAvailable: (avail: boolean) => {
    set({ canDoubleJump: avail });
  },

  completeCourse: () => {
    const { timer, isFinished, playerRank, gameMode } = get();
    if (isFinished) return;

    parkourAudio.playVictory();
    const rankTitle = gameMode === 'multiplayer'
      ? (playerRank === 1 ? '🥇 1ST PLACE WINNER!' : `🏁 FINISHED IN #${playerRank} PLACE!`)
      : '🏆 NEON CORE SUMMIT REACHED!';

    set({
      isFinished: true,
      isTimerRunning: false,
      finishTime: timer,
      showVictoryModal: true,
      activeNotification: rankTitle,
    });
  },

  restartGame: () => {
    const { gameMode, playerCount, playerName, roomCode } = get();
    const compList = gameMode === 'multiplayer' ? generateCompetitors(playerCount) : [];

    set({
      gameStarted: true,
      currentStage: 1,
      stageName: FIRST_CP.name,
      stageSubtitle: FIRST_CP.subtitle,
      currentCheckpointId: 1,
      respawnPosition: [FIRST_CP.spawnX, FIRST_CP.spawnY, FIRST_CP.spawnZ],
      timer: 0,
      isTimerRunning: true,
      isFinished: false,
      finishTime: null,
      deaths: 0,
      dashCooldown: 0,
      canDoubleJump: true,
      competitors: compList,
      showVictoryModal: false,
      activeNotification: '🏁 COURSE RESTARTED! GO FOR THE S-RANK!',
    });
  },

  setPlatformMode: (mode: 'pc' | 'mobile') => {
    set({ platformMode: mode });
  },

  setJoystickVector: (vec: { x: number; y: number }) => {
    set({ joystickVector: vec });
  },

  setJumpHeld: (held: boolean) => {
    set({ isJumpHeld: held });
  },

  setDashHeld: (held: boolean) => {
    set({ isDashHeld: held });
  },

  toggleMute: () => {
    const nextMuted = !get().isMuted;
    parkourAudio.setMuted(nextMuted);
    set({ isMuted: nextMuted });
  },

  clearNotification: () => {
    set({ activeNotification: null });
  },

  teleportToStage: (stageNum: number) => {
    const cp = COURSE_CHECKPOINTS.find((c) => c.stage === stageNum) || FIRST_CP;
    parkourAudio.playCheckpoint();
    set({
      currentCheckpointId: cp.id,
      currentStage: cp.stage,
      stageName: cp.name,
      stageSubtitle: cp.subtitle,
      respawnPosition: [cp.spawnX, cp.spawnY, cp.spawnZ],
      activeNotification: `🚀 TELEPORTED TO STAGE ${cp.stage}: ${cp.name}`,
    });
    return [cp.spawnX, cp.spawnY, cp.spawnZ];
  },
}));
