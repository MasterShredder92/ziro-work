import { MemoryStore } from "./types";

export class InMemoryMemoryStore implements MemoryStore {
  private store: Record<string, unknown> = {};

  async get(key: string) {
    return this.store[key];
  }

  async set(key: string, value: unknown) {
    this.store[key] = value;
  }
}

export const memory = new InMemoryMemoryStore();

