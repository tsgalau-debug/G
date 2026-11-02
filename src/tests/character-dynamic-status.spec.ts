import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameStateService } from '../app/game-state.service';

vi.mock('@angular/core', () => {
  let val = 0;
  return {
    Injectable: () => (target: unknown) => target,
    inject: () => ({}),
    signal: (initialVal: unknown) => {
      let state = initialVal;
      const fn = () => state;
      fn.set = (newVal: unknown) => { state = newVal; };
      fn.update = (updater: (v: unknown) => unknown) => { state = updater(state); };
      return fn;
    },
    computed: (fn: () => unknown) => ({ get: fn }),
    ApplicationRef: class {
      tick = vi.fn();
    },
    Injector: class {
      get = vi.fn();
    },
  };
});

describe('Character Dynamic Status & Story Impact', () => {
  let gameState: GameStateService;

  beforeEach(() => {
    gameState = new GameStateService();
    gameState.logs = [];
    gameState.mcState = {
      name: 'Kuro',
      title: 'Pengembara',
      level: 1,
      exp: 30,
      maxExp: 100,
      status: 'Healthy',
      stats: {
        hp: 80,
        maxHp: 100,
        sp: 40,
        maxSp: 50,
        strength: 75,
        charisma: 70,
        stamina: 75,
        agility: 70,
      },
      trust: {
        'Hana': 50,
      },
      inventory: ['Pisau Berkarat'],
      equipped: {},
    };
    vi.spyOn(gameState, 'saveState').mockResolvedValue();
  });

  it('calculates story impact deltas when HP and SP change during story', () => {
    gameState.updateMcState({
      status: 'Terluka Ringan',
      expGained: 25,
      stats: {
        hp: 65,
        sp: 30,
      },
    }, 'Kuro terkena sabetan pedang perampok namun berhasil menangkisnya.');

    expect(gameState.mcState.stats?.['hp']).toBe(65);
    expect(gameState.mcState.stats?.['sp']).toBe(30);
    expect(gameState.mcState.exp).toBe(55);
    expect(gameState.mcState.status).toBe('Terluka Ringan');

    const impact = gameState.mcState.lastStoryImpact;
    expect(impact).toBeDefined();
    expect(impact?.hpDelta).toBe(-15);
    expect(impact?.spDelta).toBe(-10);
    expect(impact?.expGained).toBe(25);
    expect(impact?.summary).toContain('Kuro terkena sabetan');
  });

  it('triggers level up when EXP exceeds maxExp', () => {
    gameState.updateMcState({
      expGained: 80, // 30 + 80 = 110 >= 100
    }, 'Menyelesaikan misi penyelamatan desa.');

    expect(gameState.mcState.level).toBe(2);
    expect(gameState.mcState.exp).toBe(10);
    expect(gameState.mcState.maxExp).toBe(135);
    // Stat rewards on level up (+15 maxHp, full HP restore to new maxHp, +2 core stats)
    expect(gameState.mcState.stats?.['maxHp']).toBe(115);
    expect(gameState.mcState.stats?.['hp']).toBe(115);
    expect(gameState.mcState.stats?.['strength']).toBe(77);
  });

  it('tracks NPC trust deltas and registers newly encountered NPCs', () => {
    gameState.updateNpcStates([
      {
        nama: 'Ryu',
        lokasi: 'Gerbang Desa',
        aktivitas: 'Berjaga',
        mood: 'Waspada',
        status: 'Aktif',
      },
    ]);

    expect(gameState.mcState.trust?.['Ryu']).toBe(50);

    gameState.updateMcState({
      trust: {
        'Hana': 65, // +15
        'Ryu': 55,  // +5
      },
    }, 'Hana tersenyum hangat setelah dibantu, Ryu mengangguk respek.');

    expect(gameState.mcState.trust?.['Hana']).toBe(65);
    expect(gameState.mcState.trust?.['Ryu']).toBe(55);
    expect(gameState.mcState.lastStoryImpact?.trustChanges?.['Hana']).toBe(15);
    expect(gameState.mcState.lastStoryImpact?.trustChanges?.['Ryu']).toBe(5);
  });

  it('increments stateVersion when items are equipped or consumed', () => {
    gameState.mcState.inventory = ['Ramuan Penyembuh', 'Pedang Besi'];
    const initialVersion = gameState.stateVersion();

    gameState.equipItem('Pedang Besi', 'weapon');
    expect(gameState.stateVersion()).toBeGreaterThan(initialVersion);

    const afterEquipVersion = gameState.stateVersion();
    gameState.useItem('Ramuan Penyembuh');
    expect(gameState.stateVersion()).toBeGreaterThan(afterEquipVersion);
  });
});
