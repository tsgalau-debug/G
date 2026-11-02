import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { runInInjectionContext, Injector } from '@angular/core';
import { GameStateService } from '../../app/game-state.service';
import { TimelineDAGManager } from '../../app/rag/timeline-dag';
import { MultiWorldHologram } from '../../app/rag/multi-world';
import { WorldMergeResolver } from '../../app/rag/world-merge-resolver';
import { AgenticChunkOrchestrator } from '../../app/rag/agentic-chunk-orchestrator';
import { HybridCSRMatrix, RetrievalPipeline } from '../../app/rag/hybrid-pipeline';
import { VSARLPolicyKernel } from '../../app/rag/vsarl-policy-kernel';
import { ContinuousHRR } from '../../app/rag/holographic-memory';

describe('AUD-01 (P0) Regression Suite: Timeline DAG, Multi-World State Branching & 3-Way Merge', () => {
  let injector: Injector;
  let gameState: GameStateService;

  beforeEach(() => {
    injector = Injector.create({
      providers: [{ provide: GameStateService, useClass: GameStateService }]
    });
    gameState = runInInjectionContext(injector, () => new GameStateService());
  });

  it('TimelineDAGManager restores persisted nodes, edges, and activeWorldSlot accurately', () => {
    const dag = new TimelineDAGManager(8);
    const branchNode = dag.addBranchNode('branch_alpha', 'trunk', 1, 'Cabang Alpha', 3, 'Uji coba aliansi');
    expect(branchNode.worldSlot).toBe(1);

    dag.setActiveTimeline('branch_alpha');
    expect(dag.getActiveTimelineId()).toBe('branch_alpha');
    expect(dag.getActiveWorldSlot()).toBe(1);

    const snapshot = dag.getSnapshot();

    // Simulate page reload into a fresh TimelineDAGManager
    const restoredDag = new TimelineDAGManager(8);
    expect(restoredDag.getActiveWorldSlot()).toBe(0);

    restoredDag.restore(snapshot);
    expect(restoredDag.getActiveTimelineId()).toBe('branch_alpha');
    expect(restoredDag.getActiveWorldSlot()).toBe(1);
    expect(restoredDag.getNodes().length).toBe(2);
    expect(restoredDag.getEdges().length).toBe(1);
    expect(restoredDag.findAvailableWorldSlot(8)).toBe(2);
  });

  it('GameStateService isolates branch state on fork/switch and reconciles 3-Way Merge into Trunk', async () => {
    // 1. Setup Trunk baseline state at Turn 1
    gameState.chronicle = [
      { narrative: 'Babak 1 di Trunk: Tiba di Benteng Besi.' }
    ];
    gameState.mcState = {
      name: 'Kaelen',
      title: 'Penjaga',
      level: 1,
      exp: 20,
      maxExp: 100,
      locationName: 'Benteng Besi',
      inventory: ['Pedang Besi', 'Ransum'],
      trust: { 'Kapten Vane': 50 }
    };
    gameState.knowledgeGraph = {
      'Benteng Besi': ['Gerbang utara dijaga ketat']
    };
    gameState.factions = {
      'Garda Besi': { name: 'Garda Besi', description: 'Pasukan kota', reputation: 10 }
    };
    gameState.quests = {
      q_main: { title: 'Investigasi Menara', description: 'Periksa menara', status: 'active', objectives: ['Masuk menara'] }
    };

    // 2. Fork 'branch_shadow' from 'trunk' at Turn 1
    await gameState.forkTimelineBranch('branch_shadow', 'trunk', 1, 'Cabang Bayangan');
    await gameState.switchTimelineBranch('branch_shadow');
    expect(gameState.activeTimelineId()).toBe('branch_shadow');

    // 3. Mutate state exclusively inside 'branch_shadow'
    gameState.chronicle.push({
      narrative: 'Babak 2 (Cabang Bayangan): Menyusup lewat terowongan bawah tanah dan menemukan Kunci Kuno.'
    });
    gameState.mcState.locationName = 'Terowongan Bawah Tanah';
    gameState.mcState.level = 2;
    gameState.mcState.inventory = ['Pedang Besi', 'Ransum', 'Kunci Kuno'];
    gameState.mcState.trust = { 'Kapten Vane': 75, 'Informan Lyra': 40 };
    gameState.knowledgeGraph['Terowongan'] = ['Menghubungkan penjara ke menara utama'];
    gameState.factions['Garda Besi']!.reputation = 30; // +20 delta
    gameState.quests['q_main']!.status = 'completed';

    // 4. Switch back to 'trunk' and verify complete state isolation!
    await gameState.switchTimelineBranch('trunk');
    expect(gameState.activeTimelineId()).toBe('trunk');
    expect(gameState.chronicle.length).toBe(1);
    expect(gameState.mcState.locationName).toBe('Benteng Besi');
    expect(gameState.mcState.level).toBe(1);
    expect(gameState.mcState.inventory).not.toContain('Kunci Kuno');
    expect(gameState.mcState.trust?.['Kapten Vane']).toBe(50);
    expect(gameState.knowledgeGraph['Terowongan']).toBeUndefined();
    expect(gameState.quests['q_main']?.status).toBe('active');

    // 5. Switch back to 'branch_shadow' and verify branch state was preserved!
    await gameState.switchTimelineBranch('branch_shadow');
    expect(gameState.chronicle.length).toBe(2);
    expect(gameState.mcState.locationName).toBe('Terowongan Bawah Tanah');
    expect(gameState.mcState.inventory).toContain('Kunci Kuno');

    // 6. Execute 3-Way Merge from 'branch_shadow' -> 'trunk'
    await gameState.mergeTimelineBranch('branch_shadow', 'trunk', true, {
      autoResolved: 4,
      flaggedForLLM: 0,
      finalCoherence: 0.94
    });

    // Verify 'trunk' is now active and contains reconciled state from 'branch_shadow'
    expect(gameState.activeTimelineId()).toBe('trunk');
    expect(gameState.chronicle.length).toBe(2);
    expect(gameState.chronicle[1]?.narrative).toContain('Cabang Bayangan');
    expect(gameState.mcState.inventory).toContain('Kunci Kuno');
    expect(gameState.mcState.level).toBe(2);
    expect(gameState.mcState.trust?.['Kapten Vane']).toBe(75);
    expect(gameState.mcState.trust?.['Informan Lyra']).toBe(40);
    expect(gameState.knowledgeGraph['Terowongan']).toEqual(['Menghubungkan penjara ke menara utama']);
    expect(gameState.factions['Garda Besi']?.reputation).toBe(30);
    expect(gameState.quests['q_main']?.status).toBe('completed');
  });

  it('AgenticChunkOrchestrator & MultiWorldHologram isolate unmerged branch vectors until 3-Way Merge', () => {
    const dim = 768;
    const maxDocs = 32;
    const docFHRR = new Float32Array(maxDocs * dim);

    const vecTrunkDoc = ContinuousHRR.generateUnitVector(dim, 'trunk_canonical_fact');
    const vecBranchDoc = ContinuousHRR.generateUnitVector(dim, 'branch_exclusive_secret');
    docFHRR.set(vecTrunkDoc, 0 * dim);
    docFHRR.set(vecBranchDoc, 1 * dim);

    const multiWorld = new MultiWorldHologram(8, dim, maxDocs, 64, docFHRR);
    const initWeights = new Float32Array(maxDocs);
    multiWorld.initTrunk(docFHRR, initWeights, 'trunk');

    // Encode doc 0 into trunk (slot 0)
    multiWorld.worlds[0]!.encode(0, vecTrunkDoc, 1.0);

    // Fork slot 0 -> slot 1 ('branch_1')
    expect(multiWorld.fork(0, 1, 'branch_1')).toBe(true);

    // Encode doc 1 ONLY into branch_1 (slot 1)
    multiWorld.worlds[1]!.encode(1, vecBranchDoc, 1.2);
    expect(multiWorld.worlds[0]!.docWeights[1]).toBe(0);
    expect(multiWorld.worlds[1]!.docWeights[1]).toBeCloseTo(1.2, 4);

    const pipeline = new RetrievalPipeline(64, maxDocs, dim, 32, 8);
    pipeline.build(
      new HybridCSRMatrix(64, maxDocs, 0),
      new Float32Array(64),
      new HybridCSRMatrix(64, 64, 0),
      docFHRR
    );
    const rlPolicy = new VSARLPolicyKernel(32, 6, 64);
    const orchestrator = new AgenticChunkOrchestrator(
      pipeline,
      multiWorld.worlds[0]!,
      multiWorld,
      rlPolicy,
      dim,
      maxDocs,
      8,
      32
    );

    // Candidate result containing both doc 0 (trunk) and doc 1 (branch-only)
    const rawCandidate = {
      indices: new Int32Array([1, 0, -1, -1, -1, -1, -1, -1]),
      scores: new Float32Array([0.95, 0.80, -Infinity, -Infinity, -Infinity, -Infinity, -Infinity, -Infinity]),
      count: 2
    };

    // 1. On Trunk (slot 0), doc 1 (branch-exclusive) MUST be filtered out!
    orchestrator.setActiveHologram(multiWorld.worlds[0]!);
    const verifiedOnTrunk = orchestrator.verify(rawCandidate, vecBranchDoc);
    expect(verifiedOnTrunk.validResult.count).toBe(1);
    expect(verifiedOnTrunk.validResult.indices[0]).toBe(0);
    expect(verifiedOnTrunk.anomalyCount).toBe(1);

    // 2. Switch to Branch 1 (slot 1): both doc 1 and inherited doc 0 are valid!
    orchestrator.setActiveHologram(multiWorld.worlds[1]!);
    const verifiedOnBranch = orchestrator.verify(
      {
        indices: new Int32Array([1, 0, -1, -1, -1, -1, -1, -1]),
        scores: new Float32Array([0.95, 0.80, -Infinity, -Infinity, -Infinity, -Infinity, -Infinity, -Infinity]),
        count: 2
      },
      vecBranchDoc
    );
    expect(verifiedOnBranch.validResult.count).toBe(2);
    expect(verifiedOnBranch.validResult.indices[0]).toBe(1);

    // 3. Perform 3-Way Merge (slot 1 -> slot 0) via WorldMergeResolver
    const mergeResolver = new WorldMergeResolver(multiWorld, dim, maxDocs, docFHRR);
    const mergeRes = mergeResolver.resolve(1, 0, 0.15, true);
    expect(mergeRes.success).toBe(true);
    expect(multiWorld.worlds[0]!.docWeights[1]).toBeGreaterThan(0);

    // 4. Now on Trunk (slot 0), doc 1 is part of trunk and no longer filtered out!
    orchestrator.setActiveHologram(multiWorld.worlds[0]!);
    const verifiedAfterMerge = orchestrator.verify(
      {
        indices: new Int32Array([1, 0, -1, -1, -1, -1, -1, -1]),
        scores: new Float32Array([0.95, 0.80, -Infinity, -Infinity, -Infinity, -Infinity, -Infinity, -Infinity]),
        count: 2
      },
      vecBranchDoc
    );
    expect(verifiedAfterMerge.validResult.count).toBe(2);
    expect(verifiedAfterMerge.validResult.indices[0]).toBe(1);
  });

  it('REG-20261024-013: isolates knowledgeWeights across timeline branches, reconciles weights on 3-Way Merge, and clears weights on resetCurrentStory', async () => {
    (gameState as any).db = {
      stories: { put: async () => {}, get: async () => undefined, toArray: async () => [], orderBy: () => ({ reverse: () => ({ toArray: async () => [] }) }) },
      sessions: { put: async () => {}, get: async () => undefined },
      engineState: { put: async () => {}, get: async () => undefined }
    };

    // 1. Bind a Trunk fact with weight 1.0
    gameState.updateKnowledgeGraph([
      {
        action: 'bind',
        entity: 'Benteng Besi',
        fact: 'Gerbang utara dijaga ketat.',
        weight: 1.0
      }
    ]);
    expect(gameState.knowledgeWeights['Benteng Besi::Gerbang utara dijaga ketat.']).toBe(1.0);

    // 2. Fork 'branch_canon' from 'trunk' and switch to it
    await gameState.forkTimelineBranch('branch_canon', 'trunk', 1, 'Cabang Kanon');
    await gameState.switchTimelineBranch('branch_canon');

    // 3. Reweight existing fact to 2.0 (Canon) and bind a new branch-only Canon fact (2.0)
    gameState.updateKnowledgeGraph([
      {
        action: 'reweight',
        entity: 'Benteng Besi',
        fact: 'Gerbang utara dijaga ketat.',
        weight: 2.0
      },
      {
        action: 'bind',
        entity: 'Rahasia Cabang',
        fact: 'Kunci gerbang disimpan oleh Kapten Vane.',
        weight: 2.0
      }
    ]);
    expect(gameState.knowledgeWeights['Benteng Besi::Gerbang utara dijaga ketat.']).toBe(2.0);
    expect(gameState.knowledgeWeights['Rahasia Cabang::Kunci gerbang disimpan oleh Kapten Vane.']).toBe(2.0);

    // 4. Switch back to 'trunk': trunk weight must still be 1.0 and branch weight must not leak
    await gameState.switchTimelineBranch('trunk');
    expect(gameState.knowledgeWeights['Benteng Besi::Gerbang utara dijaga ketat.']).toBe(1.0);
    expect(gameState.knowledgeWeights['Rahasia Cabang::Kunci gerbang disimpan oleh Kapten Vane.']).toBeUndefined();

    // 5. Merge 'branch_canon' into 'trunk': both canon weights (2.0) must reconcile into 'trunk'
    await gameState.mergeTimelineBranch('branch_canon', 'trunk', true, {
      autoResolved: 2,
      flaggedForLLM: 0,
      finalCoherence: 0.96
    });
    expect(gameState.knowledgeWeights['Benteng Besi::Gerbang utara dijaga ketat.']).toBe(2.0);
    expect(gameState.knowledgeWeights['Rahasia Cabang::Kunci gerbang disimpan oleh Kapten Vane.']).toBe(2.0);

    // 6. Fork 'branch_edit' from 'trunk', inline-edit an ancestor fact, and merge back:
    // the superseded ancestor fact and its stale weight key must be pruned from 'trunk'
    await gameState.forkTimelineBranch('branch_edit', 'trunk', 2, 'Cabang Koreksi Lore');
    await gameState.switchTimelineBranch('branch_edit');
    gameState.updateKnowledgeGraph([
      {
        action: 'bind',
        entity: 'Rahasia Cabang',
        fact: 'Kunci gerbang telah dipindahkan ke Menara Utama.',
        previousFact: 'Kunci gerbang disimpan oleh Kapten Vane.',
        weight: 2.0
      }
    ]);
    await gameState.mergeTimelineBranch('branch_edit', 'trunk', true, {
      autoResolved: 1,
      flaggedForLLM: 0,
      finalCoherence: 0.98
    });
    expect(gameState.knowledgeGraph['Rahasia Cabang']).not.toContain('Kunci gerbang disimpan oleh Kapten Vane.');
    expect(gameState.knowledgeGraph['Rahasia Cabang']).toContain('Kunci gerbang telah dipindahkan ke Menara Utama.');
    expect(gameState.knowledgeWeights['Rahasia Cabang::Kunci gerbang disimpan oleh Kapten Vane.']).toBeUndefined();
    expect(gameState.knowledgeWeights['Rahasia Cabang::Kunci gerbang telah dipindahkan ke Menara Utama.']).toBe(2.0);

    // 7. Verify stateVersion reactivity on updateQuests, updateCombat, updateStorySummary, and addItem
    const v0 = gameState.stateVersion();
    gameState.addItem('Lentera Perak');
    expect(gameState.stateVersion()).toBe(v0 + 1);
    gameState.updateQuests({ q1: { title: 'Misi Baru', description: 'Uji', status: 'active', objectives: [] } });
    expect(gameState.stateVersion()).toBe(v0 + 2);
    gameState.updateCombat({ inCombat: true, enemies: [{ name: 'Serigala', hp: 30, status: 'Agresif' }], advantage: 'neutral' });
    expect(gameState.stateVersion()).toBe(v0 + 3);
    gameState.updateStorySummary('Ringkasan baru yang terverifikasi.');
    expect(gameState.stateVersion()).toBe(v0 + 4);
  });
});

