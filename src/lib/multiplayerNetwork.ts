import mqtt, { MqttClient } from 'mqtt';

export interface RemotePlayer {
  id: string;
  name: string;
  color: string;
  glowColor: string;
  isHost: boolean;
  x: number;
  y: number;
  z: number;
  rotY: number;
  vy: number;
  stage: number;
  isDashing: boolean;
  isGrounded: boolean;
  speed: number;
  finished: boolean;
  finishTime: number | null;
  lastSeen: number;
}

export type NetworkEventCallback = {
  onLobbyUpdate?: (players: RemotePlayer[]) => void;
  onMatchStart?: () => void;
  onPlayerPosition?: (player: RemotePlayer) => void;
  onPlayerLeft?: (playerId: string) => void;
};

const PLAYER_COLORS = [
  { color: '#00ffff', glow: '#00e5ff' }, // P1: Cyan
  { color: '#ff007f', glow: '#ff3399' }, // P2: Neon Magenta
  { color: '#00ff88', glow: '#33ffaa' }, // P3: Neon Emerald
  { color: '#ffd700', glow: '#ffea66' }, // P4: Solar Gold
];

class MultiplayerNetwork {
  private client: MqttClient | null = null;
  private roomCode: string | null = null;
  private myId: string = '';
  private myName: string = 'Runner';
  private isHost: boolean = false;
  private myColor: { color: string; glow: string } = PLAYER_COLORS[0];
  private connectedPlayers: Map<string, RemotePlayer> = new Map();
  private callbacks: NetworkEventCallback = {};
  private sendThrottle: number = 0;
  private lastAnnounce: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.myId = 'p_' + Math.random().toString(36).substring(2, 9);
    }
  }

  public connect(
    roomCode: string,
    playerName: string,
    isHost: boolean,
    callbacks: NetworkEventCallback
  ) {
    this.disconnect();

    this.roomCode = roomCode.trim().toUpperCase();
    this.myName = playerName || 'Runner';
    this.isHost = isHost;
    this.callbacks = callbacks;
    this.connectedPlayers.clear();

    const brokerUrl = 'wss://broker.emqx.io:8084/mqtt';

    try {
      this.client = mqtt.connect(brokerUrl, {
        clientId: `np_${this.myId}`,
        clean: true,
        reconnectPeriod: 2500,
        connectTimeout: 5000,
      });

      this.client.on('connect', () => {
        if (!this.client || !this.roomCode) return;

        const lobbyTopic = `neonparkour/room/${this.roomCode}/lobby`;
        const syncTopic = `neonparkour/room/${this.roomCode}/sync`;

        this.client.subscribe([lobbyTopic, syncTopic], (err) => {
          if (!err) {
            // Announce presence
            this.broadcastJoin();
          }
        });
      });

      this.client.on('message', (topic, payload) => {
        try {
          const data = JSON.parse(payload.toString());
          if (data.senderId === this.myId) return; // Ignore own messages

          if (topic.endsWith('/lobby')) {
            this.handleLobbyMessage(data);
          } else if (topic.endsWith('/sync')) {
            this.handleSyncMessage(data);
          }
        } catch {
          // Ignore malformed payloads
        }
      });

      this.client.on('error', (err) => {
        console.warn('Multiplayer network warning:', err);
      });
    } catch (e) {
      console.warn('Multiplayer connection error:', e);
    }
  }

  public broadcastJoin() {
    if (!this.client || !this.roomCode) return;
    const msg = {
      type: 'JOIN',
      senderId: this.myId,
      name: this.myName,
      isHost: this.isHost,
      time: Date.now(),
    };
    this.client.publish(`neonparkour/room/${this.roomCode}/lobby`, JSON.stringify(msg));
  }

  public broadcastLobbyState() {
    if (!this.client || !this.roomCode || !this.isHost) return;
    // Broadcast full player roster from host
    const allPlayers: RemotePlayer[] = [
      {
        id: this.myId,
        name: `${this.myName} (Host)`,
        color: PLAYER_COLORS[0].color,
        glowColor: PLAYER_COLORS[0].glow,
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
      ...Array.from(this.connectedPlayers.values()),
    ];

    const msg = {
      type: 'LOBBY_STATE',
      senderId: this.myId,
      players: allPlayers,
      time: Date.now(),
    };
    this.client.publish(`neonparkour/room/${this.roomCode}/lobby`, JSON.stringify(msg));
  }

  public startMatchAsHost() {
    if (!this.client || !this.roomCode || !this.isHost) return;
    const msg = {
      type: 'START_MATCH',
      senderId: this.myId,
      time: Date.now(),
    };
    this.client.publish(`neonparkour/room/${this.roomCode}/lobby`, JSON.stringify(msg));
  }

  public sendPosition(state: {
    x: number;
    y: number;
    z: number;
    rotY: number;
    vy: number;
    stage: number;
    isDashing: boolean;
    isGrounded: boolean;
    speed: number;
    finished: boolean;
    finishTime: number | null;
  }) {
    if (!this.client || !this.roomCode) return;
    const now = performance.now();
    // Cap at ~25 updates per second to save bandwidth
    if (now - this.sendThrottle < 40) return;
    this.sendThrottle = now;

    const payload = {
      senderId: this.myId,
      name: this.myName,
      color: this.myColor.color,
      glowColor: this.myColor.glow,
      ...state,
      time: Date.now(),
    };

    this.client.publish(`neonparkour/room/${this.roomCode}/sync`, JSON.stringify(payload));
  }

  private handleLobbyMessage(data: {
    type: string;
    senderId: string;
    name?: string;
    isHost?: boolean;
    players?: RemotePlayer[];
  }) {
    if (data.type === 'JOIN' && data.name) {
      const existing = this.connectedPlayers.get(data.senderId);
      const slotIndex = (this.connectedPlayers.size + 1) % PLAYER_COLORS.length;
      const playerColor = PLAYER_COLORS[slotIndex];

      if (!existing) {
        this.connectedPlayers.set(data.senderId, {
          id: data.senderId,
          name: data.name,
          color: playerColor.color,
          glowColor: playerColor.glow,
          isHost: !!data.isHost,
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
        });
      }

      // If we are host, broadcast the updated lobby state to all connected peers
      if (this.isHost) {
        this.broadcastLobbyState();
      } else {
        // As a guest, notify local UI of who we know
        this.callbacks.onLobbyUpdate?.(Array.from(this.connectedPlayers.values()));
      }
    } else if (data.type === 'LOBBY_STATE' && Array.from(data.players || []).length > 0) {
      // Received authoritative roster from host
      if (!this.isHost && data.players) {
        this.connectedPlayers.clear();
        for (const p of data.players) {
          if (p.id !== this.myId) {
            this.connectedPlayers.set(p.id, p);
          }
        }
        this.callbacks.onLobbyUpdate?.(Array.from(this.connectedPlayers.values()));
      }
    } else if (data.type === 'START_MATCH') {
      this.callbacks.onMatchStart?.();
    }
  }

  private handleSyncMessage(data: {
    senderId: string;
    name: string;
    color: string;
    glowColor: string;
    x: number;
    y: number;
    z: number;
    rotY: number;
    vy: number;
    stage: number;
    isDashing: boolean;
    isGrounded: boolean;
    speed: number;
    finished: boolean;
    finishTime: number | null;
  }) {
    const player: RemotePlayer = {
      id: data.senderId,
      name: data.name,
      color: data.color || '#ff007f',
      glowColor: data.glowColor || '#ff3399',
      isHost: false,
      x: data.x,
      y: data.y,
      z: data.z,
      rotY: data.rotY,
      vy: data.vy,
      stage: data.stage,
      isDashing: data.isDashing,
      isGrounded: data.isGrounded,
      speed: data.speed,
      finished: data.finished,
      finishTime: data.finishTime,
      lastSeen: Date.now(),
    };

    this.connectedPlayers.set(data.senderId, player);
    this.callbacks.onPlayerPosition?.(player);
  }

  public getConnectedPlayers(): RemotePlayer[] {
    return Array.from(this.connectedPlayers.values());
  }

  public getMyId(): string {
    return this.myId;
  }

  public getIsHost(): boolean {
    return this.isHost;
  }

  public disconnect() {
    if (this.client) {
      try {
        this.client.end(true);
      } catch {}
      this.client = null;
    }
    this.connectedPlayers.clear();
  }
}

export const multiplayerNet = new MultiplayerNetwork();
