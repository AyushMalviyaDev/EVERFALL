/**
 * TerraForge - Network Manager
 * 
 * Manages WebSocket connection lifecycle, message serialization,
 * packet dispatching, and fallback offline simulation.
 */

import type {
  ClientPacket,
  ServerPacket,
  ServerBlockUpdatePacket,
  ServerSnapshotPacket,
  ServerChatBroadcastPacket,
  ServerAiStatusPacket,
  ServerInitAckPacket
} from './protocol.ts';

export type PacketHandler<T extends ServerPacket> = (packet: T) => void;

export class NetworkManager {
  private ws: WebSocket | null = null;
  private url: string;
  public isConnected = false;
  public playerId: string = 'local_player';
  public latencyMs = 0;
  private pingInterval: number | null = null;
  private lastPingSent = 0;

  // Event Handlers
  public onInitAck: PacketHandler<ServerInitAckPacket> | null = null;
  public onSnapshot: PacketHandler<ServerSnapshotPacket> | null = null;
  public onBlockUpdate: PacketHandler<ServerBlockUpdatePacket> | null = null;
  public onChat: PacketHandler<ServerChatBroadcastPacket> | null = null;
  public onAiStatus: PacketHandler<ServerAiStatusPacket> | null = null;

  constructor(url = 'ws://localhost:8000/api/v1/ws/world') {
    this.url = url;
  }

  /**
   * Attempts connection to the FastAPI WebSocket backend.
   */
  public connect(username = 'Player'): void {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log('[Network] Connected to TerraForge FastAPI Backend!');

        // Send initial join handshake
        this.send({
          type: 'PLAYER_JOIN',
          username,
        });

        // Start ping loop for latency tracking
        this.pingInterval = window.setInterval(() => {
          this.lastPingSent = performance.now();
        }, 2000);
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const packet = JSON.parse(event.data) as ServerPacket;
          this.handlePacket(packet);
        } catch (err) {
          console.error('[Network] Malformed packet received:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        if (this.pingInterval) clearInterval(this.pingInterval);
        console.log('[Network] WebSocket disconnected. Running in Standalone Mode.');
      };

      this.ws.onerror = () => {
        this.isConnected = false;
        // Graceful fallback to standalone mode
      };
    } catch {
      this.isConnected = false;
      console.log('[Network] Backend offline. Running in Standalone Mode.');
    }
  }

  /**
   * Dispatches incoming server packets to subscribed scene handlers.
   */
  private handlePacket(packet: ServerPacket): void {
    if (this.lastPingSent > 0) {
      this.latencyMs = Math.round(performance.now() - this.lastPingSent);
    }

    switch (packet.type) {
      case 'INIT_ACK':
        this.playerId = packet.playerId;
        if (this.onInitAck) this.onInitAck(packet);
        break;
      case 'WORLD_SNAPSHOT':
        if (this.onSnapshot) this.onSnapshot(packet);
        break;
      case 'BLOCK_UPDATE':
        if (this.onBlockUpdate) this.onBlockUpdate(packet);
        break;
      case 'CHAT_BROADCAST':
        if (this.onChat) this.onChat(packet);
        break;
      case 'AI_STATUS':
        if (this.onAiStatus) this.onAiStatus(packet);
        break;
    }
  }

  /**
   * Transmits a packet to the backend server.
   */
  public send(packet: ClientPacket): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(packet));
    }
  }

  public disconnect(): void {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}
