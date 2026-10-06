import { create } from 'zustand';
import { COURSE_CHECKPOINTS, COURSE_PLATFORMS } from './parkourCourse';
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
  startSoloGame: () => void;
  createMultiplayerRoom: (maxPlayers: number, name?: string) => string;
  joinMultiplayerRoom: (code: string, name?: string) => boolean;
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

  startSoloGame: () => {
    multiplayerNet.disconnect();
    parkourAudio.playJump();
    set({
      gameMode: 'solo',
      gameStarted: true,
      inLobby: false,
      isTimerRunning: true,
      remotePlayers: [],
      standings: [],
      playerCount: 1,
      activeNotification: '🚀 SOLO SPEEDRUN STARTED! GOAL: < 15:00',
    });
  },

  createMultiplayerRoom: (maxPlayers: number, name = 'CyberRunner') => {
    const code = `NEON-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalName = (name || 'CyberRunner').trim();

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
      lobbyPlayers: [
        {
          id: 'host',
          name: `${finalName} (Host)`,
          color: '#00ffff',
          glowColor: '#00e5ff',
          isHost: true,
          x: 0,
          y: 2,
          z: 0,
          rotY: 0,
          vy: 0,
          stage: 1,
          isDashing: false,
          isGrounded: true,
          speed: 0,
          finished: false,
          finishTime: null,
          lastSeen: Date.now(),
        },
      ],
      activeNotification: `📡 ROOM ${code} CREATED! WAITING FOR PLAYERS TO JOIN...`,
    });

    multiplayerNet.connect(code, finalName, true, {
      onLobbyUpdate: (players) => {
        set({ lobbyPlayers: players, playerCount: Math.max(1, players.length) });
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
    const cleanCode = (code || 'NEON-1000').trim().toUpperCase();
    const finalName = (name || 'Player').trim();

    set({
      gameMode: 'multiplayer',
      roomCode: cleanCode,
      playerName: finalName,
      isHost: false,
      inLobby: true,
      gameStarted: false,
      isTimerRunning: false,
      remotePlayers: [],
      activeNotification: `🔗 CONNECTING TO ROOM ${cleanCode}...`,
    });

    multiplayerNet.connect(cleanCode, finalName, false, {
      onLobbyUpdate: (players) => {
        set({ lobbyPlayers: players, playerCount: Math.max(1, players.length) });
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

  startMatchFromLobby: () => {
    if (get().isHost) {
      multiplayerNet.startMatchAsHost();
    }
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
    const allRacers: RacerStanding[] = [
      {
        id: 'self',
        name: playerName || 'You',
        color: '#00ffff',
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
    const { gameStarted, isTimerRunning, isFinished, dashCooldown } = get();
    if (!gameStarted || !isTimerRunning || isFinished) return;

    let newDashCd = dashCooldown - delta * 0.8;
    if (newDashCd < 0) newDashCd = 0;

    set((state) => ({
      timer: state.timer + delta,
      dashCooldown: newDashCd,
    }));
  },

  reachCheckpoint: (id: number) => {
    const { currentCheckpointId } = get();
    if (id <= currentCheckpointId) return;

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
