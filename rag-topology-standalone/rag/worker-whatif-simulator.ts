/* eslint-disable */
import type { BaseIndexer } from './base-indexer';
import type { ChunkStore } from './chunk-store';
import type { MultiWorldHologram } from './multi-world';
import type { TimelineDAGManager, WhatIfScenarioData } from './timeline-dag';
import { _canonicalTokens, _getEmbeddingProof } from './worker-tokenizer-embedder';

export interface WhatIfSimulationContext {
  prompt: string;
  parentId?: string | undefined;
  currentTurn?: number | undefined;
  createBranch?: boolean | undefined;
  dim: number;
  timelineDAG: TimelineDAGManager;
  multiWorld: MultiWorldHologram;
  docIdMap: Map<string, number>;
  docFHRR: Float32Array;
  indexer: BaseIndexer;
  store: ChunkStore;
  syncActiveWorldPointers: () => void;
}

export async function evaluateWhatIfScenario(ctx: WhatIfSimulationContext): Promise<{
  scenario: WhatIfScenarioData;
  simNode: unknown;
  dag: ReturnType<TimelineDAGManager['getSnapshot']>;
}> {
  const {
    prompt,
    parentId,
    currentTurn,
    createBranch = false,
    dim,
    timelineDAG,
    multiWorld,
    docIdMap,
    docFHRR,
    indexer,
    store,
    syncActiveWorldPointers,
  } = ctx;

  if (!prompt || typeof prompt !== 'string') {
    throw new Error('What-if prompt cannot be empty');
  }

  const queryProof = await _getEmbeddingProof(prompt, dim);
  const tempRecon = new Float32Array(dim);
  const parentNode =
    timelineDAG.getNodes().find((n) => n.id === (parentId || timelineDAG.getActiveTimelineId())) ||
    timelineDAG.getActiveTimeline();
  const parentSlot = parentNode ? parentNode.worldSlot : 0;
  const parentWorld = multiWorld.worlds[parentSlot] ?? multiWorld.worlds[0]!;

  let localCoherence = 0.65;
  if (parentWorld.totalWeight > 1e-10) {
    const rawCoh = parentWorld.reconstruct(queryProof.vector, tempRecon);
    const expectedCoh = 1 / Math.sqrt(Math.max(1, parentWorld.totalWeight));
    localCoherence = Math.max(0.08, Math.min(0.98, rawCoh / Math.max(0.001, expectedCoh)));
  }

  multiWorld.queryAll();
  const epistemic = multiWorld.epistemicQuery(queryProof.vector, tempRecon);
  syncActiveWorldPointers();

  const tokens = _canonicalTokens(prompt);
  const entitySet = new Set<string>();
  const matchedChunks: { key: string; text: string; score: number }[] = [];

  for (const [docKey, numericId] of docIdMap.entries()) {
    if (parentWorld.totalWeight > 1e-10 && parentWorld.docWeights[numericId] <= 1e-10) {
      continue;
    }
    const lowerKey = docKey.toLowerCase();
    const tokenMatches = tokens.filter((t) => t.length >= 3 && lowerKey.includes(t)).length;

    const dOff = numericId * dim;
    let dot = 0;
    for (let i = 0; i < dim; i++) {
      dot += queryProof.vector[i] * docFHRR[dOff + i];
    }

    if (tokenMatches > 0 || dot > 0.25) {
      if (docKey.startsWith('kg_')) {
        const parts = docKey.slice(3).split('_');
        parts.pop();
        const entName = parts.join('_').trim();
        if (entName) entitySet.add(entName);
      } else if (docKey.startsWith('static_')) {
        entitySet.add(docKey.replace(/^static_/, ''));
      }
      const cids = indexer.getDocumentChunkIds(docKey);
      if (cids && cids.length > 0) {
        matchedChunks.push({ key: cids[0]!, text: docKey, score: dot + tokenMatches * 0.35 });
      }
    }
  }

  matchedChunks.sort((a, b) => b.score - a.score);
  const topChunkIds = matchedChunks.slice(0, 3).map((m) => m.key);
  const resolvedEvidence = topChunkIds.length > 0 ? await store.resolveChunks(topChunkIds) : [];

  const properNouns = prompt.match(/\b[A-Z][a-zA-Z0-9_-]{2,}\b/g) || [];
  const stopWords = new Set([
    'Bagaimana', 'Jika', 'Ketika', 'Apabila', 'Apakah', 'Misal', 'Saat', 'Dengan', 'Untuk', 'Dalam',
    'What', 'When', 'Where', 'Which', 'While', 'With',
  ]);
  for (const noun of properNouns) {
    if (!stopWords.has(noun) && entitySet.size < 6) {
      entitySet.add(noun);
    }
  }
  const affectedEntities = Array.from(entitySet).slice(0, 6);

  const blendedCoherence = Math.max(
    0.15,
    Math.min(0.96, localCoherence * 0.65 + epistemic.coherence * 0.35)
  );
  const contradictionRisk = Math.max(
    0.05,
    Math.min(
      0.95,
      epistemic.fractured ? Math.max(0.68, 1.0 - blendedCoherence) : 1.0 - blendedCoherence
    )
  );
  const coherenceForecast = Math.max(0.15, 1.0 - contradictionRisk * 0.85);

  const evidenceSummary =
    resolvedEvidence.length > 0
      ? ` Bukti terkait di "${parentNode?.name || 'Trunk'}": ${resolvedEvidence
          .map((c) => `"${c.text.slice(0, 90).replace(/\s+/g, ' ').trim()}..."`)
          .join(' | ')}`
      : '';
  const entityLabel =
    affectedEntities.length > 0
      ? `Entitas terdampak (${affectedEntities.join(', ')})`
      : 'Struktur pengetahuan saat ini';

  let suggestedAction: WhatIfScenarioData['suggestedAction'] = 'safe_to_branch';
  let impactDesc: string;

  if (contradictionRisk > 0.65) {
    suggestedAction = 'destructive_retcon';
    impactDesc = `${entityLabel} mengalami benturan langsung terhadap memori holografik aktif (risiko kontradiksi ${(
      contradictionRisk * 100
    ).toFixed(1)}%, prakiraan koherensi ${(coherenceForecast * 100).toFixed(
      1
    )}%). Disarankan membuat cabang (fork) terpisah.${evidenceSummary}`;
  } else if (contradictionRisk > 0.35) {
    suggestedAction = 'high_paradox_risk';
    impactDesc = `${entityLabel} memicu pergeseran relasi tingkat menengah (risiko divergensi ${(
      contradictionRisk * 100
    ).toFixed(1)}%, koherensi ${(coherenceForecast * 100).toFixed(
      1
    )}%). Masih dapat direkonsiliasi melalui 3-Way Merge.${evidenceSummary}`;
  } else {
    impactDesc = `${entityLabel} selaras dengan memori dunia aktif "${
      parentNode?.name || 'Trunk'
    }" (koherensi ${(coherenceForecast * 100).toFixed(1)}%, risiko kontradiksi rendah ${(
      contradictionRisk * 100
    ).toFixed(1)}%). Skenario aman dieksplorasi.${evidenceSummary}`;
  }

  const scenarioData: WhatIfScenarioData = {
    prompt,
    projectedImpact: impactDesc,
    contradictionRisk,
    coherenceForecast,
    affectedEntities,
    suggestedAction,
  };

  let simNode = null;
  if (createBranch) {
    const targetSlot = timelineDAG.findAvailableWorldSlot(multiWorld.maxWorlds);
    if (targetSlot !== null) {
      const simId = `whatif_${Date.now().toString(36)}`;
      const parent = parentNode ? parentNode.id : 'trunk';
      multiWorld.fork(parentSlot, targetSlot, `What-If: ${prompt.slice(0, 24)}...`);

      simNode = timelineDAG.addBranchNode(
        simId,
        parent,
        targetSlot,
        `Simulasi: ${prompt.slice(0, 30)}...`,
        currentTurn || 1,
        impactDesc,
        scenarioData
      );
    }
  }

  return {
    scenario: scenarioData,
    simNode,
    dag: timelineDAG.getSnapshot(),
  };
}
