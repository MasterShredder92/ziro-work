import { MemoryStore } from "./types";

export class InMemoryMemoryStore implements MemoryStore {
  private store: Record<string, any> = {};

  async get(key: string) {
    return this.store[key];
  }

  async set(key: string, value: any) {
    this.store[key] = value;
  }
}

export const memory = new InMemoryMemoryStore();

