/**
 * Constantes de eventos do módulo de presença (frontend)
 */
export const PRESENCE_EVENTS = {
  // Cliente → Servidor
  HEARTBEAT: 'presence:heartbeat',
  
  // Servidor → Cliente
  UPDATE: 'presence:update',
  SNAPSHOT: 'presence:snapshot',
} as const;

