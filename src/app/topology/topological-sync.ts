import { NpcState } from "../game-state.types";
import { SimplicialComplexTracker, HomologyAnalysisResult } from "./simplicial-complex";
import {
  cleanCorruptedScheduleLocation,
  extractBuildingAnchor,
  extractCanonicalRoomOrBuilding,
  hasCorruptedSchedulePrefix
} from "../world-genesis/npc-schedule-synthesizer";

/**
 * Laporan anomali untuk membantu AI memperbaiki relasi di giliran berikutnya.
 */
export interface AnomalyReport {
  npcA: string;
  npcB: string;
  reason: string;
  type?: 'euclidean_desync' | 'topological_cavity' | 'faction_split';
}

/**
 * Menghapus penyebutan nama tempat/kediaman dari teks aktivitas sebelum menguji keterlibatan sosial
 * agar nama bangunan seperti "Kediaman Takeshi" tidak memicu false-positive bahwa karakter sedang bersama Takeshi.
 */
function stripPlaceReferencesFromActivity(
  activityLower: string,
  escapedTargetName: string,
  locationsToStrip: string[]
): string {
  let cleaned = activityLower;
  for (const loc of locationsToStrip) {
    const normLoc = loc.toLowerCase().replaceAll('_', ' ').trim();
    if (normLoc.length >= 4) {
      cleaned = cleaned.replaceAll(normLoc, ' ');
    }
  }
  const placeOwnershipRe = new RegExp(
    String.raw`\b(?:kediaman|rumah|vila|pondok|paviliun|kamar|ruang|ruangan|aula|kastil|istana|toko|bengkel|kedai|penginapan|menara|kuil|makam|patung|gerbang|desa|distrik|wilayah|jalan|jalur)\s+(?:[\w\s]{0,20}\s+)?${escapedTargetName}\b`,
    'gi'
  );
  return cleaned.replace(placeOwnershipRe, ' ');
}

/**
 * Mengecek apakah dua deskripsi lokasi merujuk pada ruangan/area yang kompatibel
 * (mis. "Sudut Ruang Tamu Kediaman Takeshi" dan "Lantai Tatami Ruang Tamu Kediaman Takeshi").
 */
export function areLocationsSpatiallyCompatible(rawLocA: string, rawLocB: string): boolean {
  const locA = (rawLocA || '').toLowerCase().trim();
  const locB = (rawLocB || '').toLowerCase().trim();
  if (!locA || !locB || locA === 'unknown' || locB === 'unknown') {
    return true;
  }
  if (locA === locB || locA.includes(locB) || locB.includes(locA)) {
    return true;
  }
  const canonA = extractCanonicalRoomOrBuilding(locA).toLowerCase();
  const canonB = extractCanonicalRoomOrBuilding(locB).toLowerCase();
  if (canonA && canonB && (canonA === canonB || canonA.includes(canonB) || canonB.includes(canonA))) {
    return true;
  }
  return false;
}

/**
 * Menyelesaikan anomali topologi (desync antar karakter) dan menghitung Persistent Homology.
 */
export const TopologicalSyncSystem = {
  /**
   * Evaluasi state global dengan state baru (parsial dari AI)
   *
   * @param currentGlobalState State NPC global saat ini
   * @param incomingAIState State NPC terbaru dari output AI
   * @param mcTrust Skor trust MC saat ini
   * @param factions Data faksi saat ini
   * @returns State NPC global yang sudah dikoreksi, daftar anomali, dan hasil analisis homologi
   */
  resolveState(
    currentGlobalState: Record<string, NpcState>,
    incomingAIState: NpcState[],
    mcTrust: Record<string, number> = {},
    factions: Record<string, { reputation: number }> = {}
  ): {
    resolvedState: Record<string, NpcState>;
    anomalies: AnomalyReport[];
    homology: HomologyAnalysisResult;
  } {
    const normalizeName = (str: string) => str.replaceAll('_', ' ').toLowerCase().trim();
    const escapeRegex = (str: string) => str.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

    // 1. Merge terlebih dahulu (simulasikan update state)
    const mergedState: Record<string, NpcState> = JSON.parse(
      JSON.stringify(currentGlobalState || {})
    );

    const incomingNormSet = new Set<string>();

    for (const incoming of incomingAIState || []) {
      if (incoming && incoming.nama) {
        const normalizedIncoming = normalizeName(incoming.nama);
        incomingNormSet.add(normalizedIncoming);
        let existingKey = incoming.nama;
        for (const key of Object.keys(mergedState)) {
          const existingNpcName = mergedState[key]?.nama ? normalizeName(mergedState[key].nama) : '';
          if (normalizeName(key) === normalizedIncoming || existingNpcName === normalizedIncoming) {
            existingKey = key;
            break;
          }
        }

        const prev = mergedState[existingKey] || ({} as NpcState);
        const sanitizedIncoming: Partial<NpcState> = {};
        for (const [k, v] of Object.entries(incoming)) {
          if (v !== undefined && v !== null && (typeof v !== 'string' || v.trim().length > 0)) {
            (sanitizedIncoming as Record<string, unknown>)[k] = v;
          }
        }
        mergedState[existingKey] = { ...prev, ...sanitizedIncoming, nama: prev.nama || incoming.nama };
      }
    }

    // 1b. Bersihkan lokasi yang tercemar prefix jadwal (cth: "Penginapan & Kedai Sudut Ruang Tamu...")
    for (const npc of Object.values(mergedState)) {
      if (!npc) continue;
      const rawLoc = (npc.lokasi || npc.location || '').trim();
      if (rawLoc && hasCorruptedSchedulePrefix(rawLoc)) {
        const cleanRoom = extractCanonicalRoomOrBuilding(rawLoc);
        npc.lokasi = cleanRoom;
        npc.location = cleanRoom;
        const rawAct = (npc.aktivitas || npc.activity || '').trim();
        if (
          rawAct.toLowerCase().includes(rawLoc.toLowerCase()) ||
          rawAct === 'Berada sendirian setelah ditinggalkan.'
        ) {
          const restoredAct = `Beraktivitas di ${cleanRoom}.`;
          npc.aktivitas = restoredAct;
          npc.activity = restoredAct;
        }
      }
    }

    const anomalies: AnomalyReport[] = [];
    const npcList = Object.values(mergedState);

    // 2. Pre-compute and index
    interface NpcIndex {
      npc: NpcState;
      normName: string;
      escapedName: string;
      loc: string;
      canonLoc: string;
      buildingLoc: string;
      matcher: RegExp;
    }

    const index: NpcIndex[] = npcList.map(npc => {
      const normalizedName = normalizeName(npc.nama || '');
      const escapedName = escapeRegex(normalizedName);
      const rawLoc = (npc.lokasi || npc.location || '').trim();
      const canonLoc = extractCanonicalRoomOrBuilding(rawLoc);
      const buildingLoc = extractBuildingAnchor(canonLoc);
      return {
        npc,
        normName: normalizedName,
        escapedName,
        loc: rawLoc.toLowerCase(),
        canonLoc,
        buildingLoc,
        matcher: new RegExp(String.raw`(?:^|\W)${escapedName}(?:\W|$)`)
      };
    });

    // 3. Deteksi Anomali - O(N * M)
    for (const dataA of index) {
      const npcA = dataA.npc;
      if (!npcA.aktivitas && !npcA.activity) continue;

      const rawActA = (npcA.aktivitas || npcA.activity || '').toLowerCase().replaceAll('_', ' ');

      for (const dataB of index) {
        if (dataA.npc === dataB.npc || !dataB.normName) continue;

        const actAForSocialCheck = stripPlaceReferencesFromActivity(
          rawActA,
          dataB.escapedName,
          [
            dataA.loc,
            dataB.loc,
            dataA.canonLoc,
            dataB.canonLoc,
            dataA.buildingLoc,
            dataB.buildingLoc,
            cleanCorruptedScheduleLocation(dataA.loc),
            cleanCorruptedScheduleLocation(dataB.loc)
          ]
        );

        if (dataB.matcher.test(actAForSocialCheck)) {
          // A menyebut B secara sosial dalam aktivitasnya
          const locA = (npcA.lokasi || npcA.location || '').trim();
          const locB = (dataB.npc.lokasi || dataB.npc.location || '').trim();

          const isLocationCompatible = areLocationsSpatiallyCompatible(locA, locB);

          if (isLocationCompatible) {
            // Jika keduanya berada di sub-spot dari ruangan kanonis yang sama, selaraskan ke ruangan kanonis
            if (locA && locB && locA.toLowerCase() !== locB.toLowerCase() && dataA.canonLoc) {
              npcA.lokasi = dataA.canonLoc;
              npcA.location = dataA.canonLoc;
              dataB.npc.lokasi = dataB.canonLoc || dataA.canonLoc;
              dataB.npc.location = dataB.canonLoc || dataA.canonLoc;
              dataA.loc = dataA.canonLoc.toLowerCase();
              dataB.loc = (dataB.canonLoc || dataA.canonLoc).toLowerCase();
            }
          } else if (locA && locB) {
            const bothInCurrentScene =
              incomingNormSet.has(dataA.normName) && incomingNormSet.has(dataB.normName);

            if (bothInCurrentScene) {
              // Kedua NPC baru saja disebut aktif berinteraksi di adegan ini: satukan lokasi npcA ke lokasi npcB
              const targetLoc = dataB.canonLoc || locB;
              anomalies.push({
                npcA: npcA.nama,
                npcB: dataB.npc.nama,
                reason: `${npcA.nama} beraktivitas melibatkan ${dataB.npc.nama} di [${locA.toLowerCase()}], tapi ${dataB.npc.nama} berada di [${locB.toLowerCase()}]. Lokasi ${npcA.nama} diselaraskan ke [${targetLoc}].`,
                type: 'euclidean_desync'
              });
              npcA.lokasi = targetLoc;
              npcA.location = targetLoc;
              dataA.loc = targetLoc.toLowerCase();
            } else {
              anomalies.push({
                npcA: npcA.nama,
                npcB: dataB.npc.nama,
                reason: `${npcA.nama} beraktivitas melibatkan ${dataB.npc.nama} di [${locA.toLowerCase()}], tapi ${dataB.npc.nama} berada di [${locB.toLowerCase()}].`,
                type: 'euclidean_desync'
              });

              // AUTO-CORRECT: Putuskan joint karena npcB telah berpindah tempat.
              npcA.aktivitas = "Berada sendirian setelah ditinggalkan.";
              npcA.activity = "Berada sendirian setelah ditinggalkan.";
              npcA.mood = "Bertanya-tanya / Netral";
            }
          }
        }
      }
    }

    // 4. Hitung Simplicial Complex & Persistent Homology
    const homology = SimplicialComplexTracker.analyzeHomology(mergedState, mcTrust, factions);

    // Konversi topological formation kritis menjadi topological anomalies
    for (const formation of homology.formations) {
      if (formation.severity === 'critical') {
        anomalies.push({
          npcA: formation.members[0] || 'System',
          npcB: formation.members[1] || 'Network',
          reason: `[Topological Split] ${formation.title}: ${formation.description}`,
          type: 'faction_split'
        });
      }
    }

    return { resolvedState: mergedState, anomalies, homology };
  },
};
