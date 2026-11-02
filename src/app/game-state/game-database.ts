import Dexie, { type Table } from 'dexie';
import type { StoryMetadata, StorySessionData } from '../game-state.types';

export class GameDatabase extends Dexie {
  engineState!: Table<{ id: string; state: unknown }, string>;
  stories!: Table<StoryMetadata, string>;
  sessions!: Table<{ id: string; state: StorySessionData }, string>;

  constructor() {
    super('GuardianEngineDB');
    this.version(1).stores({
      engineState: 'id',
    });
    this.version(2).stores({
      engineState: 'id',
      stories: 'id, title, mcName, createdAt, updatedAt, lastPlayedAt',
      sessions: 'id',
    });
  }
}

export const VALID_AI_MODELS = new Set([
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.1-pro-preview',
  'gemini-flash-latest'
]);
