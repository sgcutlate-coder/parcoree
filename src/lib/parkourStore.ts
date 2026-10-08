import { create } from 'zustand';
import {
  CourseDifficulty,
  ItemType,
  DIFFICULTY_CONFIGS,
} from './parkourDifficulties';
import {
  ParkourCourseData,
  getCourseForDifficulty,
  CourseCheckpoint,
  CoursePlatform,
  CourseRing,
  CourseItem,
} from './parkourCourse';
import { parkourAudio } from './parkourAudio';
import { multiplayerNet, RemotePlayer } from './multiplayerNetwork';

export type CompetitorRacer = RemotePlayer;
export type { RemotePlayer };

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
  // Difficulty & Active Course
  selectedDifficulty: CourseDifficulty;
  courseData: ParkourCourseData;
  totalLevels: number;

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

  // New Items & Power-Up Buffs
  collectedItems: Record<string, boolean>;
  dataCoresCollected: number;
  hasShield: boolean;
  antiGravityTimer: number; // seconds remaining
  chronoFreezeTimer: number; // seconds remaining

  // Decaying Platforms State Map
  decayingPlatformStates: Record<string, { state: 'intact' | 'shaking' | 'collapsed'; timer: number }>;

  // Real Multiplayer State (1 to 4 Real Players, ZERO Bots)
  gameMode: 'solo' | 'multiplayer';
  inLobby: boolean;
  isHost: boolean;
  roomCode: string;
  maxPlayers: number; // 1 to 4
  playerCount: number;
  playerName: string;
  lobbyPlayers: RemotePlayer[];
  remotePlayers: RemotePlayer[];
  playerRank: number; // 1 to 4
  standings: RacerStanding[];
  p2pStatus: 'connecting' | 'connected' | 'error';

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
  setDifficulty: (diff: CourseDifficulty) => void;
  startSoloGame: (diff?: CourseDifficulty) => void;
  createMultiplayerRoom: (maxPlayers: number, name?: string, diff?: CourseDifficulty) => string;
  joinMultiplayerRoom: (code: string, name?: string) => boolean;
  claimHost: () => void;
  startMatchFromLobby: () => void;
  leaveLobby: () => void;
  broadcastMyPosition: (pos: {
    x: number;
    y: number;
    z: number;
    rotY: number;
    vy: number;
    stage: number;
    isDashing: boolean;
    isGrounded: boolean;
    speed: number;
  }) => void;
  tickTimer: (delta: number) => void;
  reachCheckpoint: (id: number) => void;
  triggerRespawn: () => [number, number, number];
  triggerHazardHit: () => [number, number, number];
  collectItem: (itemId: string, type: ItemType) => void;
  stepOnDecayingPlatform: (platId: string) => void;
  updateDecayingPlatforms: (dt: number) => void;
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

const initialDifficulty: CourseDifficulty = 'easy';
const initialCourse = getCourseForDifficulty(initialDifficulty);
const initialFirstCp = initialCourse.checkpoints[0];

export const useParkourStore = create<ParkourState>((set, get) => ({
  selectedDifficulty: initialDifficulty,
  courseData: initialCourse,
  totalLevels: initialCourse.totalStages,

  gameStarted: false,
  currentStage: 1,
  stageName: initialFirstCp.name,
  stageSubtitle: initialFirstCp.subtitle,
  currentCheckpointId: 1,
  respawnPosition: [initialFirstCp.spawnX, initialFirstCp.spawnY, initialFirstCp.spawnZ],

  timer: 0,
  isTimerRunning: false,
  isFinished: false,
  finishTime: null,
  deaths: 0,
  dashCooldown: 0,
  canDoubleJump: true,

  collectedItems: {},
  dataCoresCollected: 0,
  hasShield: false,
  antiGravityTimer: 0,
  chronoFreezeTimer: 0,

  decayingPlatformStates: {},

  // Real Multiplayer defaults
  gameMode: 'solo',
  inLobby: false,
  isHost: false,
  roomCode: 'NEON-8821',
  maxPlayers: 4,
  playerCount: 1,
  playerName: 'CyberRunner',
  lobbyPlayers: [],
  remotePlayers: [],
  playerRank: 1,
  standings: [],
  p2pStatus: 'connecting',

  platformMode: 'pc',
  joystickVector: { x: 0, y: 0 },
  isJumpHeld: false,
  isDashHeld: false,

  activeNotification: null,
  showVictoryModal: false,
  isMuted: false,

  init: () => {
    if (typeof window !== 'undefined') {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      set({ platformMode: isTouch ? 'mobile' : 'pc' });

      // Check if URL has ?room=... to auto-populate join code
      const urlParams = new URLSearchParams(window.location.search);
      const room = urlParams.get('room');
      if (room) {
        set({ roomCode: room.toUpperCase() });
      }
    }
  },

  setDifficulty: (diff: CourseDifficulty) => {
    const course = getCourseForDifficulty(diff);
    const firstCp = course.checkpoints[0];
    const diffConfig = DIFFICULTY_CONFIGS[diff];

    set({
      selectedDifficulty: diff,
      courseData: course,
      totalLevels: course.totalStages,
      currentStage: 1,
      currentCheckpointId: 1,
      stageName: firstCp.name,
      stageSubtitle: firstCp.subtitle,
      respawnPosition: [firstCp.spawnX, firstCp.spawnY, firstCp.spawnZ],
      collectedItems: {},
      dataCoresCollected: 0,
      hasShield: false,
      antiGravityTimer: 0,
      chronoFreezeTimer: 0,
      decayingPlatformStates: {},
      timer: 0,
      isTimerRunning: false,
      isFinished: false,
      finishTime: null,
      deaths: 0,
      dashCooldown: 0,
      canDoubleJump: true,
      activeNotification: `⚡ ${diffConfig.badge} SELECTED (${course.totalStages} LEVELS)!`,
    });
  },

  startSoloGame: (diff?: CourseDifficulty) => {
    if (diff && diff !== get().selectedDifficulty) {
      get().setDifficulty(diff);
    }
    const { courseData, selectedDifficulty } = get();
    const config = DIFFICULTY_CONFIGS[selectedDifficulty];
    multiplayerNet.disconnect();
    parkourAudio.playJump();

    set({
      gameMode: 'solo',
      gameStarted: true,
      inLobby: false,
      isTimerRunning: true,
      timer: 0,
      remotePlayers: [],
      standings: [],
      playerCount: 1,
      activeNotification: `🚀 ${config.badge} SPEEDRUN STARTED! (${courseData.totalStages} LEVELS)`,
    });
  },

  createMultiplayerRoom: (maxPlayers: number, name = 'CyberRunner', diff?: CourseDifficulty) => {
    if (diff && diff !== get().selectedDifficulty) {
      get().setDifficulty(diff);
    }
    const code = `NEON-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalName = (name || 'CyberRunner').trim();
    const { selectedDifficulty, courseData } = get();

    set({
      gameMode: 'multiplayer',
      roomCode: code,
      playerName: finalName,
      maxPlayers,
      playerCount: 1,
      isHost: true,
      inLobby: true,
      gameStarted: false,
      isTimerRunning: false,
      remotePlayers: [],
      lobbyPlayers: [],
      activeNotification: `📡 ROOM ${code} CREATED (${DIFFICULTY_CONFIGS[selectedDifficulty].badge})! WAITING FOR PLAYERS...`,
    });

    multiplayerNet.connect(code, finalName, true, {
      onLobbyUpdate: (players) => {
        const myId = multiplayerNet.getMyId();
        const remotes = players.filter((p) => p.id !== myId);
        set({
          lobbyPlayers: players,
          remotePlayers: remotes,
          playerCount: Math.max(1, players.length),
        });
      },
      onP2PStatusChange: (status) => {
        set({ p2pStatus: status });
      },
      onMatchStart: () => {
        get().startMatchFromLobby();
      },
      onPlayerPosition: (player) => {
        const current = get().remotePlayers;
        const index = current.findIndex((p) => p.id === player.id);
        const updated = [...current];
        if (index >= 0) {
          updated[index] = player;
        } else {
          updated.push(player);
        }
        set({ remotePlayers: updated, playerCount: updated.length + 1 });
      },
    });

    return code;
  },

  joinMultiplayerRoom: (code: string, name = 'CyberRunner') => {
    let cleanCode = (code || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (/^\d{4}$/.test(cleanCode)) {
      cleanCode = `NEON-${cleanCode}`;
    }
    if (!cleanCode) cleanCode = 'NEON-1000';
    const finalName = (name || 'CyberRunner').trim();

    set({
      gameMode: 'multiplayer',
      roomCode: cleanCode,
      playerName: finalName,
      isHost: false,
      inLobby: true,
      gameStarted: false,
      isTimerRunning: false,
      remotePlayers: [],
      lobbyPlayers: [],
      p2pStatus: 'connecting',
      activeNotification: `🔗 CONNECTING TO ROOM ${cleanCode}...`,
    });

    multiplayerNet.connect(cleanCode, finalName, false, {
      onLobbyUpdate: (players) => {
        const myId = multiplayerNet.getMyId();
        const remotes = players.filter((p) => p.id !== myId);
        set({
          lobbyPlayers: players,
          remotePlayers: remotes,
          playerCount: Math.max(1, players.length),
          activeNotification: `✅ CONNECTED TO ROOM ${cleanCode}! (${players.length} PLAYERS IN LOBBY)`,
        });
      },
      onP2PStatusChange: (status) => {
        set({ p2pStatus: status });
      },
      onMatchStart: () => {
        get().startMatchFromLobby();
      },
      onPlayerPosition: (player) => {
        const current = get().remotePlayers;
        const index = current.findIndex((p) => p.id === player.id);
        const updated = [...current];
        if (index >= 0) {
          updated[index] = player;
        } else {
          updated.push(player);
        }
        set({ remotePlayers: updated, playerCount: updated.length + 1 });
      },
    });

    return true;
  },

  claimHost: () => {
    set({ isHost: true });
    multiplayerNet.promoteToHost();
  },

  startMatchFromLobby: () => {
    if (!get().isHost) {
      set({ isHost: true });
      multiplayerNet.promoteToHost();
    }
    multiplayerNet.startMatchAsHost();
    parkourAudio.playJump();
    set({
      inLobby: false,
      gameStarted: true,
      isTimerRunning: true,
      timer: 0,
      activeNotification: '🏁 MULTIPLAYER RACE STARTED! RACE TO THE SUMMIT!',
    });
  },

  leaveLobby: () => {
    multiplayerNet.disconnect();
    set({
      inLobby: false,
      gameStarted: false,
      remotePlayers: [],
      lobbyPlayers: [],
    });
  },

  broadcastMyPosition: (pos) => {
    const { gameMode, isFinished, finishTime, timer, remotePlayers, currentStage, playerName } = get();
    if (gameMode !== 'multiplayer') return;

    multiplayerNet.sendPosition({
      ...pos,
      finished: isFinished,
      finishTime: finishTime,
    });

    // Update live race standings
    const myColor = multiplayerNet.getMyColor().color;
    const allRacers: RacerStanding[] = [
      {
        id: 'self',
        name: playerName || 'You',
        color: myColor || '#00ffff',
        stage: currentStage,
        zDist: -pos.z,
        rank: 1,
        isSelf: true,
        finished: isFinished,
        finishTime: finishTime,
      },
      ...remotePlayers.map((r) => ({
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
    set({
      standings: allRacers,
      playerRank: myRankItem ? myRankItem.rank : 1,
    });
  },

  tickTimer: (delta: number) => {
    const { gameStarted, isTimerRunning, isFinished, dashCooldown, chronoFreezeTimer, antiGravityTimer } = get();
    if (!gameStarted || !isTimerRunning || isFinished) return;

    let newDashCd = dashCooldown - delta * 0.8;
    if (newDashCd < 0) newDashCd = 0;

    let newChrono = chronoFreezeTimer - delta;
    if (newChrono < 0) newChrono = 0;

    let newAntiGrav = antiGravityTimer - delta;
    if (newAntiGrav < 0) newAntiGrav = 0;

    // If Chrono Freeze is active, timer does not advance!
    const timerDelta = newChrono > 0 ? 0 : delta;

    set((state) => ({
      timer: state.timer + timerDelta,
      dashCooldown: newDashCd,
      chronoFreezeTimer: newChrono,
      antiGravityTimer: newAntiGrav,
    }));
  },

  reachCheckpoint: (id: number) => {
    const { currentCheckpointId, courseData } = get();
    if (id <= currentCheckpointId) return;

    const cp = courseData.checkpoints.find((c) => c.id === id);
    if (!cp) return;

    parkourAudio.playCheckpoint();
    set({
      currentCheckpointId: id,
      currentStage: cp.stage,
      stageName: cp.name,
      stageSubtitle: cp.subtitle,
      respawnPosition: [cp.spawnX, cp.spawnY, cp.spawnZ],
      activeNotification: `⚡ CHECKPOINT ${cp.stage}/${courseData.totalStages}: ${cp.name} SAVED!`,
    });

    if (cp.stage === courseData.totalStages) {
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

  triggerHazardHit: () => {
    const { hasShield, respawnPosition, currentStage } = get();
    if (hasShield) {
      parkourAudio.playPowerUp();
      set({
        hasShield: false,
        activeNotification: '🛡️ AEGIS SHIELD ABSORBED HAZARD HIT!',
      });
      return respawnPosition;
    }

    parkourAudio.playHazardZap();
    set((state) => ({
      deaths: state.deaths + 1,
      dashCooldown: 0,
      activeNotification: `💥 LASER HAZARD DETECTED! RESPAWNING AT STAGE ${currentStage}...`,
    }));
    return respawnPosition;
  },

  collectItem: (itemId: string, type: ItemType) => {
    const { collectedItems } = get();
    if (collectedItems[itemId]) return;

    const updated = { ...collectedItems, [itemId]: true };

    switch (type) {
      case 'data_core': {
        parkourAudio.playItemCollect();
        const count = get().dataCoresCollected + 1;
        set({
          collectedItems: updated,
          dataCoresCollected: count,
          activeNotification: `💠 DATA CORE COLLECTED! (${count} CORES)`,
        });
        break;
      }
      case 'dash_refill': {
        parkourAudio.playPowerUp();
        set({
          collectedItems: updated,
          dashCooldown: 0,
          activeNotification: '⚡ AIR DASH CHARGED! READY FOR AIR BOOST!',
        });
        break;
      }
      case 'anti_gravity': {
        parkourAudio.playPowerUp();
        set({
          collectedItems: updated,
          antiGravityTimer: 7.0,
          activeNotification: '🪶 ANTI-GRAVITY ACTIVATED (7s)! HIGHER JUMP!',
        });
        break;
      }
      case 'chrono_freeze': {
        parkourAudio.playPowerUp();
        set({
          collectedItems: updated,
          chronoFreezeTimer: 5.0,
          activeNotification: '⏱️ CHRONO FREEZE! STOPWATCH FROZEN (5s)!',
        });
        break;
      }
      case 'shield': {
        parkourAudio.playPowerUp();
        set({
          collectedItems: updated,
          hasShield: true,
          activeNotification: '🛡️ AEGIS SHIELD EQUIPPED! +1 HAZARD ABSORPTION',
        });
        break;
      }
    }
  },

  stepOnDecayingPlatform: (platId: string) => {
    const { decayingPlatformStates } = get();
    const current = decayingPlatformStates[platId];
    if (current && current.state !== 'intact') return;

    parkourAudio.playDecayWarning();
    set({
      decayingPlatformStates: {
        ...decayingPlatformStates,
        [platId]: { state: 'shaking', timer: 1.2 }, // collapses in 1.2s
      },
      activeNotification: '⚠️ DECAYING BLOCK COLLAPSING! JUMP QUICKLY!',
    });
  },

  updateDecayingPlatforms: (dt: number) => {
    const { decayingPlatformStates } = get();
    let hasChanges = false;
    const nextStates = { ...decayingPlatformStates };

    for (const id in nextStates) {
      const entry = nextStates[id];
      if (entry.state === 'shaking') {
        const nextTimer = entry.timer - dt;
        if (nextTimer <= 0) {
          nextStates[id] = { state: 'collapsed', timer: 3.5 }; // respawns after 3.5s
          hasChanges = true;
        } else {
          nextStates[id] = { ...entry, timer: nextTimer };
          hasChanges = true;
        }
      } else if (entry.state === 'collapsed') {
        const nextTimer = entry.timer - dt;
        if (nextTimer <= 0) {
          delete nextStates[id]; // respawn intact
          hasChanges = true;
        } else {
          nextStates[id] = { ...entry, timer: nextTimer };
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      set({ decayingPlatformStates: nextStates });
    }
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
    const { timer, isFinished, playerRank, gameMode, selectedDifficulty } = get();
    if (isFinished) return;

    parkourAudio.playVictory();
    const config = DIFFICULTY_CONFIGS[selectedDifficulty];
    const rankTitle = gameMode === 'multiplayer'
      ? (playerRank === 1 ? '🥇 1ST PLACE WINNER!' : `🏁 FINISHED IN #${playerRank} PLACE!`)
      : `🏆 ${config.name} CONQUERED!`;

    set({
      isFinished: true,
      isTimerRunning: false,
      finishTime: timer,
      showVictoryModal: true,
      activeNotification: rankTitle,
    });
  },

  restartGame: () => {
    const { courseData } = get();
    const firstCp = courseData.checkpoints[0];

    set({
      gameStarted: true,
      currentStage: 1,
      stageName: firstCp.name,
      stageSubtitle: firstCp.subtitle,
      currentCheckpointId: 1,
      respawnPosition: [firstCp.spawnX, firstCp.spawnY, firstCp.spawnZ],
      timer: 0,
      isTimerRunning: true,
      isFinished: false,
      finishTime: null,
      deaths: 0,
      dashCooldown: 0,
      canDoubleJump: true,
      showVictoryModal: false,
      collectedItems: {},
      dataCoresCollected: 0,
      hasShield: false,
      antiGravityTimer: 0,
      chronoFreezeTimer: 0,
      decayingPlatformStates: {},
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
    const { courseData } = get();
    const cp = courseData.checkpoints.find((c) => c.stage === stageNum) || courseData.checkpoints[0];
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
