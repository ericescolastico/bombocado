/**
 * Eleição de líder para heartbeat multi-abas
 * Usa BroadcastChannel quando disponível, fallback para localStorage
 */

const LEADER_HEARTBEAT_INTERVAL_MS = 5000; // 5 segundos
const LEADER_TIMEOUT_MS = 8000; // 8 segundos
const LEADER_CHECK_INTERVAL_MS = 500;

interface LeaderInfo {
  tabId: string;
  ts: number;
}

export class LeaderElection {
  private tabId: string;
  private isLeader: boolean = false;
  private leaderCheckInterval?: NodeJS.Timeout;
  private heartbeatInterval?: NodeJS.Timeout;
  private broadcastChannel?: BroadcastChannel;
  private onBecomeLeader?: () => void;
  private onLoseLeadership?: () => void;

  constructor(
    onBecomeLeader?: () => void,
    onLoseLeadership?: () => void,
  ) {
    this.tabId = this.generateTabId();
    this.onBecomeLeader = onBecomeLeader;
    this.onLoseLeadership = onLoseLeadership;

    if (this.supportsBroadcastChannel()) {
      this.setupBroadcastChannel();
    } else {
      this.setupLocalStorage();
    }
  }

  private generateTabId(): string {
    if (typeof window === 'undefined') return 'server';
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private supportsBroadcastChannel(): boolean {
    return typeof window !== 'undefined' && 'BroadcastChannel' in window;
  }

  private setupBroadcastChannel() {
    if (typeof window === 'undefined') return;

    try {
      this.broadcastChannel = new BroadcastChannel('presence-leader');

      // Enviar "hello" para verificar se já existe líder
      this.broadcastChannel.postMessage({ type: 'hello', tabId: this.tabId });

      // Aguardar resposta (se ninguém responder em ~500ms, assumir liderança)
      const responseTimeout = setTimeout(() => {
        this.becomeLeader();
      }, 500);

      this.broadcastChannel.onmessage = (event) => {
        const { type, tabId } = event.data;

        if (type === 'leader-exists' || (type === 'i-am-leader' && tabId !== this.tabId)) {
          clearTimeout(responseTimeout);
          // Outro tab é líder, não fazer nada
          this.isLeader = false;
        } else if (type === 'hello' && tabId !== this.tabId) {
          // Alguém perguntou, responder que já existe líder (se eu for)
          if (this.isLeader) {
            this.broadcastChannel?.postMessage({ type: 'leader-exists', tabId: this.tabId });
          } else {
            // Responder que não sou líder, mas talvez eu seja candidato
            clearTimeout(responseTimeout);
            // Aguardar um pouco mais antes de assumir liderança
            setTimeout(() => {
              if (!this.isLeader) {
                this.becomeLeader();
              }
            }, 100);
          }
        }
      };

      // Heartbeat do líder
      this.heartbeatInterval = setInterval(() => {
        if (this.isLeader) {
          this.broadcastChannel?.postMessage({ type: 'i-am-leader', tabId: this.tabId });
        }
      }, LEADER_HEARTBEAT_INTERVAL_MS);

      // Verificar se líder ainda está ativo
      this.leaderCheckInterval = setInterval(() => {
        if (this.isLeader) {
          this.broadcastChannel?.postMessage({ type: 'heartbeat', tabId: this.tabId });
        }
      }, LEADER_CHECK_INTERVAL_MS);

    } catch (error) {
      console.warn('BroadcastChannel not available, falling back to localStorage:', error);
      this.setupLocalStorage();
    }
  }

  private setupLocalStorage() {
    if (typeof window === 'undefined') return;

    const LEADER_KEY = 'presence_leader_tab';

    const tryBecomeLeader = () => {
      try {
        const current = localStorage.getItem(LEADER_KEY);
        const now = Date.now();

        if (!current) {
          // Nenhum líder, tentar assumir
          const leaderInfo: LeaderInfo = { tabId: this.tabId, ts: now };
          localStorage.setItem(LEADER_KEY, JSON.stringify(leaderInfo));
          this.becomeLeader();
        } else {
          try {
            const leader: LeaderInfo = JSON.parse(current);
            
            // Verificar se líder expirou
            if (now - leader.ts > LEADER_TIMEOUT_MS || leader.tabId === this.tabId) {
              // Líder expirado ou sou eu, assumir liderança
              const newLeader: LeaderInfo = { tabId: this.tabId, ts: now };
              localStorage.setItem(LEADER_KEY, JSON.stringify(newLeader));
              this.becomeLeader();
            } else {
              // Outro tab é líder
              this.isLeader = false;
            }
          } catch {
            // Dados corrompidos, assumir liderança
            const leaderInfo: LeaderInfo = { tabId: this.tabId, ts: now };
            localStorage.setItem(LEADER_KEY, JSON.stringify(leaderInfo));
            this.becomeLeader();
          }
        }
      } catch (error) {
        console.error('Error in leader election:', error);
      }
    };

    // Tentar assumir liderança inicialmente
    tryBecomeLeader();

    // Heartbeat do líder (renovar timestamp)
    this.heartbeatInterval = setInterval(() => {
      if (this.isLeader) {
        try {
          const leaderInfo: LeaderInfo = { tabId: this.tabId, ts: Date.now() };
          localStorage.setItem(LEADER_KEY, JSON.stringify(leaderInfo));
        } catch (error) {
          console.error('Error updating leader heartbeat:', error);
        }
      }
    }, LEADER_HEARTBEAT_INTERVAL_MS);

    // Verificar se líder ainda está ativo
    this.leaderCheckInterval = setInterval(() => {
      tryBecomeLeader();
    }, LEADER_CHECK_INTERVAL_MS);

    // Listener para mudanças no localStorage (outras abas)
    window.addEventListener('storage', (e) => {
      if (e.key === LEADER_KEY && this.isLeader) {
        // Verificar se ainda sou líder
        const current = localStorage.getItem(LEADER_KEY);
        if (current) {
          try {
            const leader: LeaderInfo = JSON.parse(current);
            if (leader.tabId !== this.tabId && Date.now() - leader.ts < LEADER_TIMEOUT_MS) {
              // Outro tab assumiu liderança
              this.loseLeadership();
            }
          } catch {
            // Dados corrompidos, tentar assumir
            tryBecomeLeader();
          }
        }
      }
    });
  }

  private becomeLeader() {
    if (this.isLeader) return;
    
    this.isLeader = true;
    this.onBecomeLeader?.();
  }

  private loseLeadership() {
    if (!this.isLeader) return;
    
    this.isLeader = false;
    this.onLoseLeadership?.();
  }

  getLeaderStatus(): boolean {
    return this.isLeader;
  }

  cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.leaderCheckInterval) {
      clearInterval(this.leaderCheckInterval);
    }
    this.broadcastChannel?.close();
    
    // Se for líder via localStorage, limpar
    if (this.isLeader && typeof window !== 'undefined') {
      try {
        const current = localStorage.getItem('presence_leader_tab');
        if (current) {
          const leader: LeaderInfo = JSON.parse(current);
          if (leader.tabId === this.tabId) {
            localStorage.removeItem('presence_leader_tab');
          }
        }
      } catch {
        // Ignorar erros na limpeza
      }
    }
    
    this.isLeader = false;
  }
}

