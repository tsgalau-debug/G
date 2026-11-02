import type {
  TimelineAncestorSnapshot,
  TimelineBranchSnapshot
} from '../game-state.types';

export function cloneDeep<T>(obj: T): T {
  if (obj === undefined || obj === null) return obj;
  return JSON.parse(JSON.stringify(obj));
}

export function buildForkedBranchSnapshot(
  sourceSnap: TimelineBranchSnapshot,
  branchId: string,
  parentId: string,
  forkTurn: number,
  branchName: string
): TimelineBranchSnapshot {
  const ancestor: TimelineAncestorSnapshot = {
    chronicleLength: sourceSnap.chronicle.length,
    mcState: cloneDeep(sourceSnap.mcState),
    npcStates: cloneDeep(sourceSnap.npcStates),
    npcSchedules: cloneDeep(sourceSnap.npcSchedules || {}),
    factions: cloneDeep(sourceSnap.factions),
    knowledgeGraph: cloneDeep(sourceSnap.knowledgeGraph),
    knowledgeWeights: cloneDeep(sourceSnap.knowledgeWeights || {}),
    quests: cloneDeep(sourceSnap.quests)
  };

  return {
    ...sourceSnap,
    knowledgeWeights: cloneDeep(sourceSnap.knowledgeWeights || {}),
    logs: [
      ...(sourceSnap.logs || []),
      `[Timeline] Garis waktu "${branchName}" (${branchId}) dicabangkan dari "${parentId}" pada Giliran ${forkTurn}.`
    ],
    forkTurn,
    parentTimelineId: parentId,
    ancestorSnapshot: ancestor
  };
}

export function reconcileThreeWayBranchMerge(
  branchSnap: TimelineBranchSnapshot | undefined,
  baseTargetSnap: TimelineBranchSnapshot,
  branchId: string,
  targetId: string,
  trunkPriority: boolean,
  mergeResult?: { autoResolved?: number; flaggedForLLM?: number; finalCoherence?: number }
): TimelineBranchSnapshot {
  const targetSnap = cloneDeep(baseTargetSnap);
  if (!targetSnap.knowledgeWeights) {
    targetSnap.knowledgeWeights = {};
  }

  if (branchSnap) {
    const ancestor = branchSnap.ancestorSnapshot;
    const forkLen = ancestor?.chronicleLength ?? 0;

    // 1. Reconcile Chronicle: append branch episodes created after forkTurn
    const branchNewEntries = branchSnap.chronicle.slice(forkLen);
    for (const entry of branchNewEntries) {
      const clonedEntry = cloneDeep(entry);
      targetSnap.chronicle.push(clonedEntry);
    }

    // 2. Reconcile Knowledge Graph & Priority Weights (3-way union + branch unbind/edit pruning + weight reconciliation)
    const ancestorKg = ancestor?.knowledgeGraph || {};
    const branchKg = branchSnap.knowledgeGraph || {};

    for (const [entity, aFacts] of Object.entries(ancestorKg)) {
      if (!Array.isArray(aFacts) || !targetSnap.knowledgeGraph[entity]) continue;
      const bFactSet = new Set(branchKg[entity] || []);
      targetSnap.knowledgeGraph[entity] = targetSnap.knowledgeGraph[entity]!.filter(f => {
        const wasInAncestor = aFacts.includes(f);
        const removedInBranch = wasInAncestor && !bFactSet.has(f);
        if (!removedInBranch) return true;
        const wKey = `${entity}::${f}`;
        const aW = ancestor?.knowledgeWeights?.[wKey] ?? 1.0;
        const tW = targetSnap.knowledgeWeights?.[wKey] ?? aW;
        const targetModifiedWeight = tW !== aW;
        if (!targetModifiedWeight || !trunkPriority) {
          if (targetSnap.knowledgeWeights) delete targetSnap.knowledgeWeights[wKey];
          return false;
        }
        return true;
      });
      if (targetSnap.knowledgeGraph[entity]!.length === 0) {
        delete targetSnap.knowledgeGraph[entity];
      }
    }

    for (const [entity, facts] of Object.entries(branchKg)) {
      if (!targetSnap.knowledgeGraph[entity]) {
        targetSnap.knowledgeGraph[entity] = [];
      }
      const existingFacts = new Set(targetSnap.knowledgeGraph[entity]);
      for (const f of facts) {
        if (!existingFacts.has(f)) {
          targetSnap.knowledgeGraph[entity]!.push(f);
          existingFacts.add(f);
        }
      }
    }
    for (const [wKey, bWeight] of Object.entries(branchSnap.knowledgeWeights || {})) {
      const [entity, ...factParts] = wKey.split('::');
      const factStr = factParts.join('::');
      if (entity && factStr && !targetSnap.knowledgeGraph[entity]?.includes(factStr)) {
        continue;
      }
      const tWeight = targetSnap.knowledgeWeights[wKey];
      const aWeight = ancestor?.knowledgeWeights?.[wKey];
      if (tWeight === undefined) {
        targetSnap.knowledgeWeights[wKey] = bWeight;
      } else {
        const targetUnchanged = aWeight !== undefined && tWeight === aWeight;
        if (targetUnchanged || !trunkPriority || bWeight > tWeight) {
          targetSnap.knowledgeWeights[wKey] = bWeight;
        }
      }
    }

    // 3. Reconcile Quests (3-way diff against ancestor)
    for (const [qId, bQuest] of Object.entries(branchSnap.quests || {})) {
      const tQuest = targetSnap.quests[qId];
      const aQuest = ancestor?.quests?.[qId];
      if (!tQuest) {
        targetSnap.quests[qId] = cloneDeep(bQuest);
      } else {
        const targetUnchanged = aQuest && JSON.stringify(tQuest) === JSON.stringify(aQuest);
        if (targetUnchanged || !trunkPriority || bQuest.status === 'completed') {
          targetSnap.quests[qId] = cloneDeep(bQuest);
        }
      }
    }

    // 4. Reconcile NPC States, Schedules & Factions (3-way diff + reputation delta)
    if (!targetSnap.npcSchedules) {
      targetSnap.npcSchedules = {};
    }
    for (const [npcKey, bNpc] of Object.entries(branchSnap.npcStates || {})) {
      const tNpc = targetSnap.npcStates[npcKey];
      const aNpc = ancestor?.npcStates?.[npcKey];
      if (!tNpc) {
        targetSnap.npcStates[npcKey] = cloneDeep(bNpc);
      } else {
        const targetUnchanged = aNpc && JSON.stringify(tNpc) === JSON.stringify(aNpc);
        if (targetUnchanged || !trunkPriority) {
          targetSnap.npcStates[npcKey] = cloneDeep(bNpc);
        }
      }
    }
    for (const [schedKey, bSched] of Object.entries(branchSnap.npcSchedules || {})) {
      if (!targetSnap.npcSchedules[schedKey] || !trunkPriority) {
        targetSnap.npcSchedules[schedKey] = cloneDeep(bSched);
      }
    }

    for (const [fKey, bFac] of Object.entries(branchSnap.factions || {})) {
      const tFac = targetSnap.factions[fKey];
      const aFac = ancestor?.factions?.[fKey];
      if (!tFac) {
        targetSnap.factions[fKey] = cloneDeep(bFac);
      } else if (aFac) {
        const deltaBranch = (bFac.reputation ?? 0) - (aFac.reputation ?? 0);
        const deltaTarget = (tFac.reputation ?? 0) - (aFac.reputation ?? 0);
        if (deltaBranch !== 0 && deltaTarget === 0) {
          tFac.reputation = Math.max(-100, Math.min(100, (tFac.reputation ?? 0) + deltaBranch));
        } else if (deltaBranch !== 0 && !trunkPriority) {
          tFac.reputation = bFac.reputation;
        }
      }
    }

    // 5. Reconcile MC State (Inventory additions, Trust deltas, Level/EXP progression)
    const ancestorInv = new Set(ancestor?.mcState?.inventory || []);
    const targetInv = new Set(targetSnap.mcState.inventory || []);
    for (const item of branchSnap.mcState.inventory || []) {
      if (!ancestorInv.has(item) && !targetInv.has(item)) {
        targetSnap.mcState.inventory = [...(targetSnap.mcState.inventory || []), item];
        targetInv.add(item);
      }
    }

    const branchTrust = branchSnap.mcState.trust || {};
    const ancestorTrust = ancestor?.mcState?.trust || {};
    const targetTrust = { ...(targetSnap.mcState.trust || {}) };
    for (const [k, bVal] of Object.entries(branchTrust)) {
      const bNum = Number(bVal) || 0;
      const aNum = ancestorTrust[k] !== undefined ? (Number(ancestorTrust[k]) || 0) : bNum;
      const tNum = targetTrust[k] !== undefined ? (Number(targetTrust[k]) || 0) : aNum;
      const delta = bNum - aNum;
      if (delta !== 0) {
        if (tNum === aNum || !trunkPriority) {
          targetTrust[k] = Math.max(0, Math.min(100, tNum + delta));
        }
      } else if (targetTrust[k] === undefined) {
        targetTrust[k] = bNum;
      }
    }
    targetSnap.mcState.trust = targetTrust;

    if ((branchSnap.mcState.level ?? 1) > (targetSnap.mcState.level ?? 1)) {
      targetSnap.mcState.level = branchSnap.mcState.level;
      targetSnap.mcState.exp = branchSnap.mcState.exp;
      targetSnap.mcState.maxExp = branchSnap.mcState.maxExp;
    }
    if (!trunkPriority && branchSnap.storySummary) {
      targetSnap.storySummary = branchSnap.storySummary;
    }
  }

  const cohPct = (((mergeResult?.finalCoherence ?? 1) * 100)).toFixed(1);
  targetSnap.logs = [
    ...(targetSnap.logs || []),
    `[3-Way Merge] Cabang "${branchId}" direkonsiliasi ke "${targetId}" (${mergeResult?.autoResolved ?? 0} otomatis, ${mergeResult?.flaggedForLLM ?? 0} konflik, koherensi ${cohPct}%).`
  ];

  return targetSnap;
}
