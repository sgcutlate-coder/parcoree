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
  onP2PStatusChange?: (status: 'connecting' | 'connected' | 'error', isP2P: boolean) => void;
};

export const PLAYER_COLORS = [
  { color: '#00ffff', glow: '#00e5ff' }, // P1: Cyan (Host)
  { color: '#ff007f', glow: '#ff3399' }, // P2: Neon Magenta
  { color: '#00ff88', glow: '#33ffaa' }, // P3: Neon Emerald
  { color: '#ffd700', glow: '#ffea66' }, // P4: Solar Gold
];

class MultiplayerNetwork {
  private peerInstance: any = null;
  private peerConnections: Map<string, any> = new Map();
  private hostConn: any = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private client: MqttClient | null = null;
  private roomCode: string | null = null;
  private myId: string = '';
  private myName: string = 'Runner';
  private isHost: boolean = false;
  private myColor: { color: string; glow: string } = PLAYER_COLORS[0];
  private connectedPlayers: Map<string, RemotePlayer> = new Map();
  private callbacks: NetworkEventCallback = {};
  private sendThrottle: number = 0;
  private lobbyHeartbeatTimer: any = null;
  private p2pRetryTimer: any = null;
  private seenMessageIds: Set<string> = new Set();
  private boundBeforeUnload: any = null;
  private p2pConnected: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.myId = 'p_' + Math.random().toString(36).substring(2, 9);
    }
  }

  public getMyId(): string {
    return this.myId;
  }

  public getIsHost(): boolean {
    return this.isHost;
  }

  public getIsP2PConnected(): boolean {
    return this.p2pConnected;
  }

  public getMyColor(): { color: string; glow: string } {
    return this.myColor;
  }

  private recordMessageId(msgId: string | undefined): boolean {
    if (!msgId) return true;
    if (this.seenMessageIds.has(msgId)) return false;
    this.seenMessageIds.add(msgId);
    if (this.seenMessageIds.size > 300) {
      const first = this.seenMessageIds.values().next().value;
      if (first) this.seenMessageIds.delete(first);
    }
    return true;
  }

  private generateMsgId(): string {
    return `${this.myId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  public getFullRoster(): RemotePlayer[] {
    const me: RemotePlayer = {
      id: this.myId,
      name: this.isHost ? `${this.myName} (Host)` : this.myName,
      color: this.myColor.color,
      glowColor: this.myColor.glow,
      isHost: this.isHost,
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
    };

    return [me, ...Array.from(this.connectedPlayers.values())];
  }

  public async connect(
    roomCode: string,
    playerName: string,
    isHost: boolean,
    callbacks: NetworkEventCallback
  ) {
    this.disconnect();

    this.roomCode = roomCode.trim().toUpperCase();
    this.myName = (playerName || 'Runner').trim();
    this.isHost = isHost;
    this.myColor = isHost ? PLAYER_COLORS[0] : PLAYER_COLORS[1];
    this.callbacks = callbacks;
    this.connectedPlayers.clear();
    this.seenMessageIds.clear();
    this.p2pConnected = false;

    // 1. Initial UI update with self
    const initialRoster = this.getFullRoster();
    this.callbacks.onLobbyUpdate?.(initialRoster);
    this.callbacks.onP2PStatusChange?.('connecting', false);

    // 2. Initialize Native BroadcastChannel for instant local cross-tab sync
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(`neonparkour_room_${this.roomCode}`);
        this.broadcastChannel.onmessage = (event) => {
          this.handleIncomingRaw(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel notice:', e);
      }
    }

    // 3. Initialize True WebRTC P2P with Google STUN via PeerJS
    await this.initWebRTCP2P();

    // 4. Initialize Multi-Network MQTT WebSocket Fallback
    this.initMqttFallback();

    // 5. Lobby synchronization heartbeat
    if (typeof window !== 'undefined') {
      this.lobbyHeartbeatTimer = window.setInterval(() => {
        if (!this.roomCode) return;
        if (this.isHost) {
          this.broadcastLobbyState();
        } else {
          // Keep announcing presence until host is connected
          if (this.connectedPlayers.size === 0) {
            this.broadcastJoin();
          }
        }
      }, 1200);

      this.boundBeforeUnload = () => {
        this.broadcastLeave();
      };
      window.addEventListener('beforeunload', this.boundBeforeUnload);
    }

    // Immediate announcement
    if (this.isHost) {
      this.broadcastLobbyState();
    } else {
      this.broadcastJoin();
    }
  }

  private async initWebRTCP2P() {
    if (typeof window === 'undefined') return;

    try {
      const PeerModule = await import('peerjs');
      const Peer = PeerModule.default || (PeerModule as any).Peer || PeerModule;

      const cleanCode = (this.roomCode || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const hostPeerId = `np-host-${cleanCode}`;

      const iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
      ];

      if (this.isHost) {
        // HOST: Bind to deterministic peer ID so all guests can find this host
        this.peerInstance = new Peer(hostPeerId, {
          config: { iceServers },
          debug: 1,
        });

        this.peerInstance.on('open', (id: string) => {
          console.log('⚡ WebRTC P2P Host Ready! Peer ID:', id);
          this.p2pConnected = true;
          this.callbacks.onP2PStatusChange?.('connected', true);
        });

        this.peerInstance.on('connection', (conn: any) => {
          console.log('⚡ WebRTC Guest incoming connection from:', conn.peer);
          this.handleDataConnection(conn);
        });

        this.peerInstance.on('error', (err: any) => {
          console.warn('WebRTC Host Peer notice:', err?.type || err);
          if (err?.type === 'unavailable-id') {
            // Already taken (e.g. tab refresh), create with unique suffix
            const altId = `${hostPeerId}-${Math.random().toString(36).substring(2, 6)}`;
            this.peerInstance = new Peer(altId, { config: { iceServers }, debug: 1 });
          }
        });
      } else {
        // GUEST: Create a unique peer ID and connect directly to host
        const guestPeerId = `np-guest-${cleanCode}-${Math.random().toString(36).substring(2, 8)}`;
        this.peerInstance = new Peer(guestPeerId, {
          config: { iceServers },
          debug: 1,
        });

        this.peerInstance.on('open', (id: string) => {
          console.log('⚡ WebRTC P2P Guest Ready! Connecting to Host:', hostPeerId);
          this.connectToHostWebRTC(hostPeerId);
        });

        this.peerInstance.on('error', (err: any) => {
          console.warn('WebRTC Guest Peer notice:', err?.type || err);
        });
      }
    } catch (err) {
      console.warn('WebRTC P2P setup fallback to broadcast/websocket:', err);
    }
  }

  private connectToHostWebRTC(hostPeerId: string) {
    if (!this.peerInstance) return;

    try {
      const conn = this.peerInstance.connect(hostPeerId, { reliable: true });
      this.handleDataConnection(conn);

      // Retry connecting to host if not open after 3.5s
      let retryCount = 0;
      this.p2pRetryTimer = window.setInterval(() => {
        if (this.p2pConnected || !this.roomCode || this.isHost) {
          clearInterval(this.p2pRetryTimer);
          return;
        }
        retryCount++;
        if (retryCount <= 5 && this.peerInstance) {
          console.log(`Re-attempting WebRTC P2P connection to Host (attempt ${retryCount})...`);
          const retryConn = this.peerInstance.connect(hostPeerId, { reliable: true });
          this.handleDataConnection(retryConn);
        } else {
          clearInterval(this.p2pRetryTimer);
        }
      }, 3500);
    } catch (e) {
      console.warn('P2P connection attempt error:', e);
    }
  }

  private handleDataConnection(conn: any) {
    conn.on('open', () => {
      console.log('⚡ WebRTC P2P DataChannel OPEN with peer:', conn.peer);
      this.peerConnections.set(conn.peer, conn);
      this.p2pConnected = true;
      this.callbacks.onP2PStatusChange?.('connected', true);

      if (this.isHost) {
        // Host immediately sends authoritative full roster to the connected peer
        const roster = this.getFullRoster();
        conn.send(JSON.stringify({
          type: 'LOBBY_STATE',
          senderId: this.myId,
          players: roster,
          time: Date.now(),
        }));
      } else {
        // Guest immediately announces presence to host
        conn.send(JSON.stringify({
          type: 'JOIN',
          senderId: this.myId,
          name: this.myName,
          isHost: false,
          time: Date.now(),
        }));
      }
    });

    conn.on('data', (data: any) => {
      this.handleIncomingRaw(typeof data === 'string' ? data : JSON.stringify(data));
    });

    conn.on('close', () => {
      console.log('WebRTC connection closed with peer:', conn.peer);
      this.peerConnections.delete(conn.peer);
      if (this.peerConnections.size === 0 && !this.isHost) {
        this.p2pConnected = false;
        this.callbacks.onP2PStatusChange?.('error', false);
      }
    });

    conn.on('error', (err: any) => {
      console.warn('WebRTC connection error with peer:', conn.peer, err);
    });
  }

  private initMqttFallback() {
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
            if (this.isHost) {
              this.broadcastLobbyState();
            } else {
              this.broadcastJoin();
            }
          }
        });
      });

      this.client.on('message', (_topic, payload) => {
        this.handleIncomingRaw(payload.toString());
      });

      this.client.on('error', (err) => {
        console.warn('MQTT warning (WebRTC P2P active):', err);
      });
    } catch (e) {
      console.warn('MQTT connection error (WebRTC P2P active):', e);
    }
  }

  public promoteToHost() {
    this.isHost = true;
    this.myColor = PLAYER_COLORS[0];
    const fullRoster = this.getFullRoster();
    this.callbacks.onLobbyUpdate?.(fullRoster);
    this.broadcastLobbyState();
  }

  private publishMessage(subtopic: 'lobby' | 'sync', msg: any) {
    if (!this.roomCode) return;
    const msgId = msg.msgId || this.generateMsgId();
    msg.msgId = msgId;
    this.recordMessageId(msgId);

    const payloadStr = JSON.stringify(msg);

    // 1. Direct WebRTC P2P DataChannels (<20ms ultra low latency)
    this.peerConnections.forEach((conn, peerId) => {
      try {
        if (conn && conn.open) {
          conn.send(payloadStr);
        }
      } catch (err) {
        console.warn('Error sending over WebRTC to', peerId, err);
      }
    });

    // 2. BroadcastChannel: instant local zero-latency multi-tab
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(payloadStr);
      } catch {}
    }

    // 3. MQTT: reliable cross-network fallback
    if (this.client && this.client.connected) {
      try {
        this.client.publish(`neonparkour/room/${this.roomCode}/${subtopic}`, payloadStr);
      } catch {}
    }
  }

  private handleIncomingRaw(payloadStr: string) {
    try {
      const data = JSON.parse(payloadStr);
      if (!data || data.senderId === this.myId) return; // Ignore own messages
      if (data.msgId && !this.recordMessageId(data.msgId)) return; // Ignore duplicate packets

      if (data.type === 'SYNC') {
        this.handleSyncMessage(data);
      } else {
        this.handleLobbyMessage(data);
      }
    } catch {
      // Ignore malformed payloads
    }
  }

  public broadcastJoin() {
    if (!this.roomCode) return;
    const msg = {
      type: 'JOIN',
      senderId: this.myId,
      name: this.myName,
      isHost: this.isHost,
      time: Date.now(),
    };
    this.publishMessage('lobby', msg);
  }

  public broadcastLeave() {
    if (!this.roomCode) return;
    const msg = {
      type: 'LEAVE',
      senderId: this.myId,
      time: Date.now(),
    };
    this.publishMessage('lobby', msg);
  }

  public broadcastLobbyState() {
    if (!this.roomCode || !this.isHost) return;
    const allPlayers = this.getFullRoster();
    const msg = {
      type: 'LOBBY_STATE',
      senderId: this.myId,
      players: allPlayers,
      time: Date.now(),
    };
    this.publishMessage('lobby', msg);
  }

  public startMatchAsHost() {
    if (!this.roomCode || !this.isHost) return;
    if (this.lobbyHeartbeatTimer) {
      clearInterval(this.lobbyHeartbeatTimer);
      this.lobbyHeartbeatTimer = null;
    }
    const msg = {
      type: 'START_MATCH',
      senderId: this.myId,
      time: Date.now(),
    };
    this.publishMessage('lobby', msg);
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
    if (!this.roomCode) return;
    const now = performance.now();
    // Cap updates at ~30 per sec to conserve bandwidth
    if (now - this.sendThrottle < 32) return;
    this.sendThrottle = now;

    const payload = {
      type: 'SYNC',
      senderId: this.myId,
      name: this.myName,
      color: this.myColor.color,
      glowColor: this.myColor.glow,
      ...state,
      time: Date.now(),
    };

    this.publishMessage('sync', payload);
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
      const playerColor = PLAYER_COLORS[slotIndex] || PLAYER_COLORS[1];

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

      const fullRoster = this.getFullRoster();
      this.callbacks.onLobbyUpdate?.(fullRoster);

      if (this.isHost) {
        this.broadcastLobbyState();
      }
    } else if (data.type === 'LOBBY_STATE' && Array.isArray(data.players) && data.players.length > 0) {
      if (!this.isHost && data.players) {
        this.connectedPlayers.clear();
        for (const p of data.players) {
          if (p.id !== this.myId) {
            this.connectedPlayers.set(p.id, p);
          } else {
            if (p.color) {
              this.myColor = { color: p.color, glow: p.glowColor || p.color };
            }
          }
        }
        this.p2pConnected = true;
        this.callbacks.onP2PStatusChange?.('connected', true);
        this.callbacks.onLobbyUpdate?.(data.players);
      }
    } else if (data.type === 'START_MATCH') {
      if (this.lobbyHeartbeatTimer) {
        clearInterval(this.lobbyHeartbeatTimer);
        this.lobbyHeartbeatTimer = null;
      }
      this.callbacks.onMatchStart?.();
    } else if (data.type === 'LEAVE') {
      if (this.connectedPlayers.has(data.senderId)) {
        this.connectedPlayers.delete(data.senderId);
        this.callbacks.onPlayerLeft?.(data.senderId);
        const fullRoster = this.getFullRoster();
        this.callbacks.onLobbyUpdate?.(fullRoster);
        if (this.isHost) {
          this.broadcastLobbyState();
        }
      }
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

  public disconnect() {
    if (this.lobbyHeartbeatTimer) {
      clearInterval(this.lobbyHeartbeatTimer);
      this.lobbyHeartbeatTimer = null;
    }

    if (this.p2pRetryTimer) {
      clearInterval(this.p2pRetryTimer);
      this.p2pRetryTimer = null;
    }

    if (typeof window !== 'undefined' && this.boundBeforeUnload) {
      window.removeEventListener('beforeunload', this.boundBeforeUnload);
      this.boundBeforeUnload = null;
    }

    // Close WebRTC peer connections
    this.peerConnections.forEach((conn) => {
      try {
        conn.close();
      } catch {}
    });
    this.peerConnections.clear();

    if (this.peerInstance) {
      try {
        this.peerInstance.destroy();
      } catch {}
      this.peerInstance = null;
    }

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch {}
      this.broadcastChannel = null;
    }

    if (this.client) {
      try {
        this.client.end(true);
      } catch {}
      this.client = null;
    }

    this.connectedPlayers.clear();
    this.seenMessageIds.clear();
    this.roomCode = null;
    this.p2pConnected = false;
  }
}

export const multiplayerNet = new MultiplayerNetwork();
