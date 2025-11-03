/**
 * Store Zustand para estado de presença
 */
import { create } from 'zustand';

export interface PresenceEntry {
  userId: string;
  online: boolean;
  lastSeen: string;
}

interface PresenceState {
  map: Record<string, PresenceEntry>;
  applySnapshot: (entries: PresenceEntry[]) => void;
  applyUpdate: (userId: string, entry: Partial<PresenceEntry>) => void;
  get: (userId: string) => PresenceEntry | undefined;
  isOnline: (userId: string) => boolean;
  getLastSeen: (userId: string) => string;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  map: {},

  applySnapshot: (entries) => {
    set((state) => {
      const newMap: Record<string, PresenceEntry> = {};
      
      entries.forEach((entry) => {
        newMap[entry.userId] = {
          userId: entry.userId,
          online: entry.online,
          lastSeen: entry.lastSeen,
        };
      });

      // Manter entradas existentes que não estão no snapshot
      Object.keys(state.map).forEach((userId) => {
        if (!newMap[userId]) {
          newMap[userId] = state.map[userId];
        }
      });

      return { map: newMap };
    });
  },

  applyUpdate: (userId, entry) => {
    set((state) => {
      const existing = state.map[userId];
      const updated: PresenceEntry = {
        userId,
        online: entry.online ?? existing?.online ?? false,
        lastSeen: entry.lastSeen ?? existing?.lastSeen ?? '',
      };

      return {
        map: {
          ...state.map,
          [userId]: updated,
        },
      };
    });
  },

  get: (userId) => {
    return get().map[userId];
  },

  isOnline: (userId) => {
    const entry = get().map[userId];
    return entry?.online ?? false;
  },

  getLastSeen: (userId) => {
    const entry = get().map[userId];
    return entry?.lastSeen ?? '';
  },
}));

