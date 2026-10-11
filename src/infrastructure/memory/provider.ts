import type { BrowserProvider, ServerProvider } from "../provider";
import {
  MemoryAuthRepository,
  MemoryFileStorage,
  MemoryPortfolioRepository,
  MemoryReferenceRepository,
  MemoryServiceRepository,
  MemoryWorkerRepository,
} from "./repositories";
import { memoryStore, type MemoryStore } from "./store";

export function createMemoryServerProvider(store: MemoryStore = memoryStore): ServerProvider {
  return {
    createAuth: async () => new MemoryAuthRepository(store),
    createStorage: async () => new MemoryFileStorage(store),
    async createData(_context, resolveUrl) {
      return {
        workers: new MemoryWorkerRepository(store, resolveUrl),
        services: new MemoryServiceRepository(store),
        portfolio: new MemoryPortfolioRepository(store, resolveUrl),
        reference: new MemoryReferenceRepository(store),
      };
    },
    refreshSession: async () => store.currentUserId,
  };
}

export function createMemoryBrowserProvider(store: MemoryStore = memoryStore): BrowserProvider {
  return {
    createAuth: () => new MemoryAuthRepository(store),
    createStorage: () => new MemoryFileStorage(store),
  };
}
