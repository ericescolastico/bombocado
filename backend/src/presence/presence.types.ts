/**
 * Tipos de payloads do módulo de presença
 */
export interface PresenceUpdatePayload {
  userId: string;
  online: boolean;
  lastSeen: string;
}

export interface PresenceSnapshotPayload {
  entries: PresenceEntry[];
}

export interface PresenceEntry {
  userId: string;
  online: boolean;
  lastSeen: string;
}

export interface PresenceBeatResult {
  online: boolean;
  lastSeen: string;
  isNewOnline: boolean;
}

