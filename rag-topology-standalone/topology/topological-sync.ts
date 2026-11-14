import {
  SimplicialComplex,
  BettiReport,
  TopologyEntityState,
  getEntityName,
  getEntityLocation,
  getEntityActivity,
  getEntityFaction,
} from './simplicial-complex';

export interface SpatialCommitment {
  npcName: string;
  canonicalLocation: string;
  canonicalActivity: string;
  coLocatedWith: string[];
  factionPeersAtLocation: string[];
  scheduleSource: 'explicit_turn' | 'schedule_clock' | 'fallback_anchor';
}

export interface TopologicalValidationResult {
  isValid: boolean;
  commitments: SpatialCommitment[];
  violations: {
    npcName: string;
    type: 'spatial_teleport_contradiction' | 'schedule_drift' | 'isolated_component';
    expectedLocation: string;
    observedLocation: string;
    repairedLocation: string;
    explanation: string;
  }[];
  homology: BettiReport;
  topologicalDirective: string;
}

/**
 * Built-in spatial location normalizer & building anchor extractor
 * (Decoupled from project-specific world-genesis modules).
 */
export function hasCorruptedSchedulePrefix(text: string): boolean {
  if (!text) return false;
  return /^(sedang\s+berada\s+di|berada\s+di|sedang\s+di|di\s+dalam|menuju\s+ke|pergi\s+ke)\s+/i.test(
    text.trim()
  );
}

export function cleanCorruptedScheduleLocation(raw: string): string {
  if (!raw) return 'Unknown';
  let cleaned = raw.trim();
  while (hasCorruptedSchedulePrefix(cleaned)) {
    cleaned = cleaned
      .replace(
        /^(sedang\s+berada\s+di|berada\s+di|sedang\s+di|di\s+dalam|menuju\s+ke|pergi\s+ke)\s+/i,
        ''
      )
      .trim();
  }
  return cleaned || 'Unknown';
}

export function extractBuildingAnchor(location: string): string {
  const cleaned = cleanCorruptedScheduleLocation(location);
  const parts = cleaned.split(/\s*(?:[-–—,/()]|\bdi\b)\s*/i).filter(Boolean);
  return (parts[0] || cleaned || 'Unknown').trim();
}

export function extractCanonicalRoomOrBuilding(location: string): string {
  const cleaned = cleanCorruptedScheduleLocation(location);
  return cleaned || 'Unknown';
}

/**
 * Topological Pre-Commit Synchronization & Post-Turn Sheaf Validator
 *
 * Menjamin koherensi spasial & relasional:
 * 1. Pre-Commit Sync: Menghitung lokasi kanonik setiap entitas/agen pada slot waktu aktif,
 *    mendeteksi 1-simplex (pasangan di lokasi yang sama) & 2-simplex (klik sosial),
 *    serta menghasilkan Topological Directive.
 * 2. Post-Turn Validator: Memvalidasi mutasi lokasi terhadap komitmen jadwal/tujuan
 *    dan memperbaiki korupsi string atau halusinasi perpindahan tempat.
 */
export class TopologicalSyncEngine {
  private readonly complex = new SimplicialComplex();

  static resolveTimeSlot(timeStr: string): 'pagi' | 'siang' | 'sore' | 'malam' {
    const lower = (timeStr || '').toLowerCase();
    if (lower.includes('malam') || lower.includes('tengah malam') || lower.includes('dini')) {
      return 'malam';
    }
    if (lower.includes('sore') || lower.includes('senja') || lower.includes('petang')) {
      return 'sore';
    }
    if (lower.includes('siang') || lower.includes('tengah hari')) {
      return 'siang';
    }
    const hourMatch = lower.match(/\b(\d{1,2})[:.](\d{2})\b/);
    if (hourMatch) {
      const h = parseInt(hourMatch[1]!, 10);
      if (h >= 19 || h < 5) return 'malam';
      if (h >= 15) return 'sore';
      if (h >= 11) return 'siang';
    }
    return 'pagi';
  }

  /**
   * Mengekstrak lokasi dari entri jadwal (mis. "Menjaga Gerbang Utara di Benteng Besi" -> "Gerbang Utara").
   */
  static extractScheduledLocation(
    scheduleEntry: string | undefined,
    fallbackLoc: string
  ): {
    location: string;
    activity: string;
  } {
    const cleanFallback = extractCanonicalRoomOrBuilding(
      cleanCorruptedScheduleLocation(fallbackLoc || 'Area Utama')
    );

    if (!scheduleEntry || scheduleEntry.trim().length === 0) {
      return { location: cleanFallback, activity: 'Beraktivitas rutin' };
    }

    const raw = scheduleEntry.trim();
    const diMatch = raw.match(/\bdi\s+([A-Z0-9][A-Za-z0-9\s'_-]{2,40})/i);
    if (diMatch && diMatch[1]) {
      const candidateLoc = extractCanonicalRoomOrBuilding(
        cleanCorruptedScheduleLocation(diMatch[1].trim())
      );
      const actPart = raw.slice(0, diMatch.index).trim() || raw;
      if (candidateLoc && candidateLoc !== 'Unknown' && !hasCorruptedSchedulePrefix(candidateLoc)) {
        return {
          location: candidateLoc,
          activity: actPart,
        };
      }
    }

    return {
      location: cleanFallback,
      activity: raw,
    };
  }

  /**
   * Fase Pre-Commit: Menghitung komitmen spasial, kompleks simplisial, dan direktif topologi.
   */
  synchronizePreTurn(
    entities: TopologyEntityState[],
    knowledgeGraph: Record<string, string[]>,
    knowledgeWeights: Record<string, number>,
    currentTimeStr: string,
    activeContextLocation: string
  ): {
    syncedNpcs: TopologyEntityState[];
    commitments: SpatialCommitment[];
    homology: BettiReport;
    topologicalDirective: string;
  } {
    const slot = TopologicalSyncEngine.resolveTimeSlot(currentTimeStr);
    const syncedNpcs: TopologyEntityState[] = (entities || []).map((n) => ({ ...n }));

    for (const ent of syncedNpcs) {
      const scheduleObj = ent.schedule ?? ent.jadwal;
      const schedEntry = scheduleObj ? scheduleObj[slot] : undefined;
      const rawLoc = cleanCorruptedScheduleLocation(
        getEntityLocation(ent) || activeContextLocation
      );
      const currentCleanLoc = extractCanonicalRoomOrBuilding(rawLoc);

      if (schedEntry) {
        const parsed = TopologicalSyncEngine.extractScheduledLocation(schedEntry, currentCleanLoc);
        if (!rawLoc || rawLoc === 'Unknown' || hasCorruptedSchedulePrefix(getEntityLocation(ent))) {
          if ('lokasi' in ent || !('location' in ent)) ent.lokasi = parsed.location;
          if ('location' in ent) ent.location = parsed.location;
        } else {
          if ('lokasi' in ent || !('location' in ent)) ent.lokasi = currentCleanLoc;
          if ('location' in ent) ent.location = currentCleanLoc;
        }
        const curAct = getEntityActivity(ent);
        if (!curAct || curAct.length < 3) {
          if ('aktivitas' in ent || !('activity' in ent)) ent.aktivitas = parsed.activity;
          if ('activity' in ent) ent.activity = parsed.activity;
        }
      } else {
        if ('lokasi' in ent || !('location' in ent)) ent.lokasi = currentCleanLoc;
        if ('location' in ent) ent.location = currentCleanLoc;
      }
    }

    const byAnchor = new Map<string, TopologyEntityState[]>();
    for (const ent of syncedNpcs) {
      const anchor = extractBuildingAnchor(getEntityLocation(ent)).toLowerCase();
      const list = byAnchor.get(anchor) || [];
      list.push(ent);
      byAnchor.set(anchor, list);
    }

    const commitments: SpatialCommitment[] = syncedNpcs.map((ent) => {
      const name = getEntityName(ent);
      const loc = getEntityLocation(ent);
      const act = getEntityActivity(ent) || 'Mengamati situasi sekitar';
      const fac = getEntityFaction(ent);

      const anchor = extractBuildingAnchor(loc).toLowerCase();
      const peers = (byAnchor.get(anchor) || []).filter((p) => getEntityName(p) !== name);
      const scheduleObj = ent.schedule ?? ent.jadwal;
      return {
        npcName: name,
        canonicalLocation: loc,
        canonicalActivity: act,
        coLocatedWith: peers.map((p) => getEntityName(p)),
        factionPeersAtLocation: peers
          .filter((p) => getEntityFaction(p) && getEntityFaction(p) === fac)
          .map((p) => getEntityName(p)),
        scheduleSource: scheduleObj?.[slot] ? 'schedule_clock' : 'fallback_anchor',
      };
    });

    this.complex.buildFromWorldState(knowledgeGraph, syncedNpcs, knowledgeWeights);
    const homology = this.complex.computeHomology();

    const activeAnchor = extractBuildingAnchor(activeContextLocation).toLowerCase();
    const presentCommitments = commitments.filter(
      (c) => extractBuildingAnchor(c.canonicalLocation).toLowerCase() === activeAnchor
    );

    let directive = `\n[TOPOLOGICAL SPATIAL & HOMOLOGY INVARIANTS (β₀=${homology.beta0}, β₁=${homology.beta1})]:\n`;
    if (presentCommitments.length > 0) {
      directive += `- Entitas di Lokasi Aktif (${activeContextLocation}): ${presentCommitments
        .map((c) => `${c.npcName} [di ${c.canonicalLocation}: ${c.canonicalActivity}]`)
        .join('; ')}.\n`;
    }
    const remoteCommitments = commitments
      .filter((c) => extractBuildingAnchor(c.canonicalLocation).toLowerCase() !== activeAnchor)
      .slice(0, 6);
    if (remoteCommitments.length > 0) {
      directive += `- Entitas di Lokasi Lain (JANGAN dimunculkan tiba-tiba tanpa transisi eksplisit): ${remoteCommitments
        .map((c) => `${c.npcName} @ ${c.canonicalLocation}`)
        .join(', ')}.\n`;
    }
    if (homology.topologicalHoles.length > 0) {
      directive += `- Celah Topologi (β₁): ${homology.topologicalHoles[0]!.description}\n`;
    }

    return {
      syncedNpcs,
      commitments,
      homology,
      topologicalDirective: directive,
    };
  }

  /**
   * Fase Post-Turn: Memvalidasi dan memperbaiki mutasi entitas agar konsisten secara topologis.
   */
  validateAndRepairPostTurn(
    preCommitments: SpatialCommitment[],
    postTurnEntities: TopologyEntityState[],
    knowledgeGraph: Record<string, string[]>,
    knowledgeWeights: Record<string, number>,
    activeContextLocation: string,
    narrativeText: string
  ): {
    repairedNpcs: TopologyEntityState[];
    validation: TopologicalValidationResult;
  } {
    const commitmentMap = new Map<string, SpatialCommitment>();
    for (const c of preCommitments) {
      commitmentMap.set(c.npcName.toLowerCase(), c);
    }

    const violations: TopologicalValidationResult['violations'] = [];
    const narrLower = (narrativeText || '').toLowerCase();

    const repairedNpcs: TopologyEntityState[] = (postTurnEntities || []).map((ent) => {
      const copy: TopologyEntityState = { ...ent };
      const rawObserved = getEntityLocation(copy);
      const cleanedObserved = extractCanonicalRoomOrBuilding(
        cleanCorruptedScheduleLocation(rawObserved)
      );
      const entName = getEntityName(copy);

      if (hasCorruptedSchedulePrefix(rawObserved) || rawObserved !== cleanedObserved) {
        violations.push({
          npcName: entName,
          type: 'schedule_drift',
          expectedLocation: cleanedObserved,
          observedLocation: rawObserved,
          repairedLocation: cleanedObserved,
          explanation: `Korupsi kalimat aktivitas pada field lokasi diperbaiki menjadi "${cleanedObserved}".`,
        });
        if ('lokasi' in copy || !('location' in copy)) copy.lokasi = cleanedObserved;
        if ('location' in copy) copy.location = cleanedObserved;
      }

      const prev = commitmentMap.get(entName.toLowerCase());
      if (prev) {
        const prevAnchor = extractBuildingAnchor(prev.canonicalLocation).toLowerCase();
        const obsAnchor = extractBuildingAnchor(getEntityLocation(copy)).toLowerCase();
        const activeAnchor = extractBuildingAnchor(activeContextLocation).toLowerCase();

        const isMentionedInNarrative = narrLower.includes(entName.toLowerCase());
        if (
          prevAnchor !== obsAnchor &&
          !isMentionedInNarrative &&
          obsAnchor !== activeAnchor &&
          prev.canonicalLocation !== 'Unknown'
        ) {
          violations.push({
            npcName: entName,
            type: 'spatial_teleport_contradiction',
            expectedLocation: prev.canonicalLocation,
            observedLocation: getEntityLocation(copy),
            repairedLocation: prev.canonicalLocation,
            explanation: `Entitas "${entName}" berpindah gedung tanpa keterlibatan di narasi aktif; dikembalikan ke "${prev.canonicalLocation}".`,
          });
          if ('lokasi' in copy || !('location' in copy)) copy.lokasi = prev.canonicalLocation;
          if ('location' in copy) copy.location = prev.canonicalLocation;
        }
      }

      return copy;
    });

    this.complex.buildFromWorldState(knowledgeGraph, repairedNpcs, knowledgeWeights);
    const homology = this.complex.computeHomology();

    return {
      repairedNpcs,
      validation: {
        isValid: violations.length === 0,
        commitments: preCommitments,
        violations,
        homology,
        topologicalDirective: `Homology β₀=${homology.beta0}, β₁=${homology.beta1}, Violations=${violations.length}`,
      },
    };
  }
}
