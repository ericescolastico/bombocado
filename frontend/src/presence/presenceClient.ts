/**
 * Cliente Socket.IO para presença
 */
'use client';

import { io, Socket } from 'socket.io-client';
import { PRESENCE_EVENTS } from './presence.events';
import { LeaderElection } from './leaderElection';
import { usePresenceStore, PresenceEntry } from './presenceStore';

const HEARTBEAT_INTERVAL_MS = 25000; // 25 segundos
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export class PresenceClient {
  private socket: Socket | null = null;
  private leaderElection: LeaderElection | null = null;
  private heartbeatInterval?: NodeJS.Timeout;
  private isConnected: boolean = false;

  constructor(
    private onConnect?: () => void,
    private onDisconnect?: () => void,
    private onError?: (error: Error) => void,
  ) {}

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    try {
      this.socket = io(`${API_URL}/presence`, {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
      });

      this.setupEventHandlers();

      // Setup leader election
      this.leaderElection = new LeaderElection(
        () => {
          // Tornou-se líder, iniciar heartbeat
          this.startHeartbeat();
        },
        () => {
          // Perdeu liderança, parar heartbeat
          this.stopHeartbeat();
        },
      );

      // Iniciar heartbeat se já for líder (pode acontecer se eleição for instantânea)
      if (this.leaderElection.getLeaderStatus()) {
        this.startHeartbeat();
      }

      // Listener para beforeunload (enviar última batida)
      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', () => {
          if (this.leaderElection?.getLeaderStatus() && this.socket?.connected) {
            this.socket.emit(PRESENCE_EVENTS.HEARTBEAT);
          }
        });

        // Listener para visibilitychange (continua batendo mesmo quando hidden)
        if (typeof document !== 'undefined') {
          document.addEventListener('visibilitychange', () => {
            // Heartbeat continua mesmo quando aba está em background
          });
        }
      }

    } catch (error) {
      console.error('Error creating presence client:', error);
      this.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[Presence] Connected to server');
      this.isConnected = true;
      this.onConnect?.();
    });

    this.socket.on('disconnect', () => {
      console.log('[Presence] Disconnected from server');
      this.isConnected = false;
      this.onDisconnect?.();
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Presence] Connection error:', error);
      this.onError?.(error);
    });

    // Snapshot inicial
    this.socket.on(PRESENCE_EVENTS.SNAPSHOT, (data: { entries: PresenceEntry[] }) => {
      console.log('[Presence] Received snapshot:', data.entries);
      usePresenceStore.getState().applySnapshot(data.entries);
    });

    // Updates de presença
    this.socket.on(PRESENCE_EVENTS.UPDATE, (data: PresenceEntry) => {
      console.log('[Presence] Received update:', data);
      usePresenceStore.getState().applyUpdate(data.userId, data);
    });
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      return; // Já está rodando
    }

    this.heartbeatInterval = setInterval(() => {
      if (
        this.socket?.connected &&
        this.leaderElection?.getLeaderStatus() &&
        (typeof document === 'undefined' || !document.hidden)
      ) {
        this.socket.emit(PRESENCE_EVENTS.HEARTBEAT);
      }
    }, HEARTBEAT_INTERVAL_MS);

    // Enviar primeira batida imediatamente
    if (this.socket?.connected && this.leaderElection?.getLeaderStatus()) {
      this.socket.emit(PRESENCE_EVENTS.HEARTBEAT);
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.leaderElection?.cleanup();
    this.socket?.disconnect();
    this.socket = null;
    this.isConnected = false;
  }

  getConnected(): boolean {
    return this.isConnected;
  }

  getLeaderStatus(): boolean {
    return this.leaderElection?.getLeaderStatus() ?? false;
  }
}

