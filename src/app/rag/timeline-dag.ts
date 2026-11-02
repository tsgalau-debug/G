/* eslint-disable */
import { MergeResult } from './world-merge-resolver';

export type TimelineNodeStatus = 'active' | 'merged' | 'pruned' | 'simulating';

export interface WhatIfScenarioData {
  prompt: string;
  projectedImpact: string;
  contradictionRisk: number; // 0.0 - 1.0
  coherenceForecast: number; // 0.0 - 1.0
  affectedEntities: string[];
  suggestedAction: 'safe_to_branch' | 'high_paradox_risk' | 'destructive_retcon';
}

export interface TimelineNode {
  id: string;
  worldSlot: number;
  name: string;
  parentTimelineId: string | null;
  forkTurn: number;
  createdTimestamp: number;
  status: TimelineNodeStatus;
  coherence: number;
  superpositionWeight: number;
  divergenceScore: number;
  notes?: string | undefined;
  whatIfScenario?: WhatIfScenarioData | undefined;
  mergeResult?: MergeResult | undefined;
}

export interface TimelineEdge {
  from: string;
  to: string;
  label?: string | undefined;
  weight?: number | undefined;
}

export interface TimelineDAGState {
  nodes: TimelineNode[];
  edges: TimelineEdge[];
  activeTimelineId: string;
  trunkCoherence: number;
  totalWorldSlots: number;
  usedWorldSlots: number;
}

/**
 * Timeline DAG Manager
 * Mengelola struktur graf acyclic berarah dari percabangan realitas multi-world.
 */
export class TimelineDAGManager {
  private nodes = new Map<string, TimelineNode>();
  private edges: TimelineEdge[] = [];
  private activeTimelineId = 'trunk';
  private readonly maxWorlds: number;

  constructor(maxWorlds = 8) {
    this.maxWorlds = maxWorlds;
    this._initDefaultTrunk();
  }

  private _initDefaultTrunk(): void {
    const trunkNode: TimelineNode = {
      id: 'trunk',
      worldSlot: 0,
      name: 'Realitas Utama (Trunk)',
      parentTimelineId: null,
      forkTurn: 1,
      createdTimestamp: Date.now(),
      status: 'active',
      coherence: 1.0,
      superpositionWeight: 1.0,
      divergenceScore: 0.0,
      notes: 'Garis waktu kanonik utama tempat peristiwa nyata berlangsung.'
    };

    this.nodes.set('trunk', trunkNode);
  }

  getNodes(): TimelineNode[] {
    return Array.from(this.nodes.values());
  }

  getNode(id: string): TimelineNode | undefined {
    return this.nodes.get(id);
  }

  getEdges(): TimelineEdge[] {
    return [...this.edges];
  }

  getActiveTimeline(): TimelineNode | undefined {
    return this.nodes.get(this.activeTimelineId) ?? this.nodes.get('trunk');
  }

  getActiveTimelineId(): string {
    return this.activeTimelineId;
  }

  getActiveWorldSlot(): number {
    return this.getActiveTimeline()?.worldSlot ?? 0;
  }

  setActiveTimeline(id: string): boolean {
    const node = this.nodes.get(id);
    if (node && node.status !== 'pruned') {
      this.activeTimelineId = id;
      return true;
    }
    return false;
  }

  findAvailableWorldSlot(maxSlots = this.maxWorlds): number | null {
    const occupied = new Set<number>();
    for (const node of this.nodes.values()) {
      if (node.status === 'active' || node.status === 'simulating') {
        occupied.add(node.worldSlot);
      }
    }
    for (let slot = 1; slot < maxSlots; slot++) {
      if (!occupied.has(slot)) return slot;
    }
    return null;
  }

  addBranchNode(
    id: string,
    parentId: string,
    worldSlot: number,
    name: string,
    forkTurn: number,
    notes?: string,
    whatIf?: WhatIfScenarioData
  ): TimelineNode {
    const node: TimelineNode = {
      id,
      worldSlot,
      name,
      parentTimelineId: parentId,
      forkTurn,
      createdTimestamp: Date.now(),
      status: whatIf ? 'simulating' : 'active',
      coherence: whatIf ? Math.max(0.2, whatIf.coherenceForecast) : 0.95,
      superpositionWeight: 0.85,
      divergenceScore: whatIf ? whatIf.contradictionRisk : 0.15,
      notes,
      whatIfScenario: whatIf
    };

    this.nodes.set(id, node);
    this.edges.push({
      from: parentId,
      to: id,
      label: `Fork @ Turn ${forkTurn}`
    });

    return node;
  }

  recordMerge(branchId: string, targetId: string, result: MergeResult) {
    const branch = this.nodes.get(branchId);
    if (branch) {
      branch.status = 'merged';
      branch.mergeResult = result;
      branch.superpositionWeight = 0;
    }
    const target = this.nodes.get(targetId);
    if (target) {
      target.coherence = result.finalCoherence;
    }

    if (this.activeTimelineId === branchId) {
      this.activeTimelineId = targetId;
    }

    this.edges.push({
      from: branchId,
      to: targetId,
      label: `3-Way Merged (${result.autoResolved} resolved, ${result.flaggedForLLM} flagged)`
    });
  }

  pruneNode(id: string): boolean {
    if (id === 'trunk') return false;
    const node = this.nodes.get(id);
    if (node) {
      node.status = 'pruned';
      node.superpositionWeight = 0;
      if (this.activeTimelineId === id) {
        this.activeTimelineId = 'trunk';
      }
      return true;
    }
    return false;
  }

  restore(snapshot?: TimelineDAGState | null): void {
    if (!snapshot || !Array.isArray(snapshot.nodes) || snapshot.nodes.length === 0) {
      return;
    }

    this.nodes.clear();
    for (const rawNode of snapshot.nodes) {
      if (rawNode && typeof rawNode.id === 'string') {
        this.nodes.set(rawNode.id, { ...rawNode });
      }
    }
    if (!this.nodes.has('trunk')) {
      this._initDefaultTrunk();
    }

    this.edges = Array.isArray(snapshot.edges)
      ? snapshot.edges.map(e => ({ ...e }))
      : [];

    if (
      typeof snapshot.activeTimelineId === 'string' &&
      this.nodes.has(snapshot.activeTimelineId) &&
      this.nodes.get(snapshot.activeTimelineId)?.status !== 'pruned'
    ) {
      this.activeTimelineId = snapshot.activeTimelineId;
    } else {
      this.activeTimelineId = 'trunk';
    }
  }

  getSnapshot(): TimelineDAGState {
    const nodes = this.getNodes();
    const activeSlots = nodes.filter(n => n.status === 'active' || n.status === 'simulating').length;
    const trunk = this.nodes.get('trunk');

    return {
      nodes,
      edges: this.getEdges(),
      activeTimelineId: this.activeTimelineId,
      trunkCoherence: trunk?.coherence ?? 1.0,
      totalWorldSlots: this.maxWorlds,
      usedWorldSlots: Math.max(1, activeSlots)
    };
  }
}
