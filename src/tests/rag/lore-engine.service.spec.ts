import { describe, test, expect, beforeEach, vi } from 'vitest';
import { LoreEngineService } from '../../app/rag/lore-engine.service';

vi.mock('@angular/core', () => ({
  Injectable: () => (target: any) => target,
  signal: (v: any) => ({ set: vi.fn(), get: () => v }),
  computed: (fn: any) => ({ get: fn }),
  inject: (token: any) => new token(),
}));

vi.mock('../../app/game-state.service', () => ({
  GameStateService: class {
    knowledgeGraph = {};
    mcState = { trust: {}, inventory: [] };
    factions = {};
    chronicle = [];
    logs = [];
    activeLoreKeys = [];
  },
}));

vi.mock('../../app/system-rules', () => ({
  SYSTEM_RULES: { lorebook_database: { test_lore: 'Test lore content' } },
}));

describe('LoreEngineService', () => {
  let service: LoreEngineService;

  beforeEach(() => {
    service = new LoreEngineService();
  });

  test('scoreChoices validates inventory requirements', () => {
    const choices = [{
      id: 'c1', text: 'Choice 1', weight: 0.5,
      requirements: { inventory: ['sword'] },
    }];
    
    (service as any).gameState.mcState.inventory = [];
    const scored = service.scoreChoices(choices);
    
    expect(scored[0].isValid).toBe(false);
    expect(scored[0].failureReasons[0]).toContain('Missing: sword');
  });

  test('scoreChoices validates trust requirements', () => {
    const choices = [{
      id: 'c1', text: 'Choice 1', weight: 0.5,
      requirements: { trust: { npc1: 50 } },
    }];
    
    (service as any).gameState.mcState.trust = { npc1: 30 };
    const scored = service.scoreChoices(choices);
    
    expect(scored[0].isValid).toBe(false);
    expect(scored[0].failureReasons[0]).toContain('Trust too low');
  });

  test('scoreChoices sorts by weight descending', () => {
    const choices = [
      { id: 'c1', text: 'Low', weight: 0.3 },
      { id: 'c2', text: 'High', weight: 0.9 },
      { id: 'c3', text: 'Mid', weight: 0.6 },
    ];
    
    const scored = service.scoreChoices(choices);
    
    expect(scored[0].id).toBe('c2');
    expect(scored[1].id).toBe('c3');
    expect(scored[2].id).toBe('c1');
  });

  test('scoreChoices caps at 16 results', () => {
    const choices = Array.from({ length: 20 }, (_, i) => ({
      id: `c${i}`, text: `Choice ${i}`, weight: 0.5,
    }));
    
    const scored = service.scoreChoices(choices);
    expect(scored.length).toBe(16);
  });
});
