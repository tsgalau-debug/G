import {ChangeDetectionStrategy, Component, inject, input, output, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
// eslint-disable-next-line import/no-unresolved
import {MatIconModule} from '@angular/material/icon';
import {GameStateService} from './game-state.service';
import {LoreEngineService} from './rag/lore-engine.service';
import {KnowledgeGraphComponent} from './knowledge-graph.component';
import {TimelineExplorerComponent} from './timeline-explorer/timeline-explorer.component';
import {HomologyVisualizerComponent} from './topology/homology-visualizer/homology-visualizer.component';

export type ActiveModalType = 'none' | 'settings' | 'history' | 'factions' | 'lore' | 'graph' | 'quests' | 'timeline' | 'homology';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-system-modal',
  imports: [CommonModule, MatIconModule, KnowledgeGraphComponent, TimelineExplorerComponent, HomologyVisualizerComponent],
  templateUrl: './system-modal.html',
})
export class SystemModal {
  readonly activeModal = input.required<ActiveModalType>();
  readonly close = output();

  readonly gameState = inject(GameStateService);
  readonly loreEngine = inject(LoreEngineService);

  npcFilter: 'all' | 'local' | 'rolling' = 'all';
  actionFeedback = signal<string | null>(null);
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  closeModal(): void {
    this.close.emit();
  }

  getQuests(): { id: string; title: string; description: string; status: string; objectives?: string[] }[] {
    return Object.entries(this.gameState.quests).map(([id, q]) => ({ id, ...q }));
  }

  getGraphKeys(): string[] {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions
    return Object.keys(this.gameState.knowledgeGraph || {});
  }

  getFactionKeys(): string[] {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions
    return Object.keys(this.gameState.factions || {});
  }

  setNpcFilter(filter: 'all' | 'local' | 'rolling'): void {
    this.npcFilter = filter;
  }

  getNpcKeys(): string[] {
    const allKeys = Object.keys(this.gameState.npcStates);
    if (allKeys.length === 0) return [];

    if (this.npcFilter === 'all') {
      return allKeys;
    }

    if (this.npcFilter === 'local') {
      const loc = (this.gameState.mcState.locationName ?? this.gameState.mcState.location ?? '').toLowerCase();
      const localKeys = allKeys.filter(k => {
        const npc = this.gameState.npcStates[k];
        const npcLoc = (npc.lokasi ?? npc.location ?? '').toLowerCase();
        return loc.length > 0 && npcLoc.length > 0 && (npcLoc.includes(loc) || loc.includes(npcLoc));
      });
      return localKeys.length > 0 ? localKeys : allKeys;
    }

    if (this.npcFilter === 'rolling') {
      if (this.gameState.rollingNpcKeys && this.gameState.rollingNpcKeys.length > 0) {
        const rolling = allKeys.filter(k => this.gameState.rollingNpcKeys.includes(k));
        if (rolling.length > 0) return rolling;
      }
      const latestEntry = this.gameState.chronicle.at(-1);
      if (latestEntry?.npc_state && latestEntry.npc_state.length > 0) {
        const activeNames = latestEntry.npc_state.map(n => n.nama?.toLowerCase());
        const active = allKeys.filter(k => {
          const name = this.gameState.npcStates[k]?.nama?.toLowerCase();
          return Boolean(name && activeNames.includes(name));
        });
        if (active.length > 0) return active;
      }
      return allKeys;
    }

    return allKeys;
  }

  getCleanNpcName(npcKey: string): string {
    const npc = this.gameState.npcStates[npcKey];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return npc?.nama || npcKey.replace(/^NPC_/, '').replace(/_\d+$/, '').replaceAll('_', ' ');
  }

  getFactionTier(reputation: number): { label: string; badgeClass: string; barColor: string; textColor: string } {
    return GameStateService.getFactionReputationTier(reputation);
  }

  getFactionDelta(factionName: string): number | null {
    this.gameState.stateVersion();
    const changes = this.gameState.mcState.lastStoryImpact?.factionChanges;
    if (!changes || changes[factionName] === undefined) return null;
    return changes[factionName];
  }

  getFactionMembers(factionName: string): { key: string; name: string }[] {
    const target = factionName.toLowerCase();
    return Object.entries(this.gameState.npcStates)
      .filter(([_, s]) => {
        const f = (s.faksi ?? '').toLowerCase();
        return f.length > 0 && (f === target || f.includes(target) || target.includes(f));
      })
      .map(([key, s]) => ({
        key,
        name: s.nama || key.replace(/^NPC_/, '').replace(/_\d+$/, '').replaceAll('_', ' ')
      }));
  }

  getNpcTrustInfo(npcKey: string): { value: number; tier: string; badgeClass: string; barColor: string; delta: number | null } {
    this.gameState.stateVersion();
    const npc = this.gameState.npcStates[npcKey];
    const canonicalName = npc?.nama || npcKey.replace(/^NPC_/, '').replace(/_\d+$/, '');
    const val = this.gameState.getNpcTrust(canonicalName);

    let tier = 'Netral';
    let badgeClass = 'bg-zinc-800 text-zinc-300 border border-zinc-700';
    let barColor = 'bg-zinc-500';

    if (val >= 80) {
      tier = 'Sekutu Erat';
      badgeClass = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      barColor = 'bg-emerald-500';
    } else if (val >= 60) {
      tier = 'Sahabat';
      badgeClass = 'bg-teal-500/20 text-teal-300 border border-teal-500/30';
      barColor = 'bg-teal-500';
    } else if (val >= 40) {
      tier = 'Kenalan';
      badgeClass = 'bg-zinc-800 text-zinc-300 border border-zinc-700';
      barColor = 'bg-zinc-500';
    } else if (val >= 20) {
      tier = 'Waspada';
      badgeClass = 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      barColor = 'bg-amber-500';
    } else {
      tier = 'Bermusuhan';
      badgeClass = 'bg-red-500/20 text-red-400 border border-red-500/30';
      barColor = 'bg-red-500';
    }

    const changes = this.gameState.mcState.lastStoryImpact?.trustChanges;
    const delta = changes?.[canonicalName] ?? changes?.[npcKey] ?? null;

    return { value: val, tier, badgeClass, barColor, delta };
  }

  interactWithFaction(factionName: string, actionType: 'support' | 'investigate'): void {
    const prompt = actionType === 'support'
      ? `Aku berinisiatif menghubungi perwakilan ${factionName} untuk menawarkan dukungan dan bantuan bagi kepentingan mereka.`
      : `Secara diam-diam, aku mengamati pergerakan dan menggali informasi intelijen terkait agenda rahasia ${factionName}.`;
    this.gameState.queueStoryAction(prompt);
    this.showFeedback(`Aksi terhadap faksi "${factionName}" telah disiapkan ke prompt cerita.`);
  }

  interactWithNpc(npcKey: string, actionType: 'talk' | 'collaborate'): void {
    const name = this.getCleanNpcName(npcKey);
    const prompt = actionType === 'talk'
      ? `Aku menghampiri ${name} dan mengajaknya berbincang santai untuk mempererat hubungan dan memahami situasi terkini.`
      : `Aku mengajak ${name} bekerja sama dalam menghadapi tantangan yang ada di wilayah ini.`;
    this.gameState.queueStoryAction(prompt);
    this.showFeedback(`Aksi dengan ${name} telah disiapkan ke prompt cerita.`);
  }

  showFeedback(msg: string): void {
    this.actionFeedback.set(msg);
    if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
    this.feedbackTimer = setTimeout(() => {
      this.actionFeedback.set(null);
    }, 3000);
  }
}

export { SystemModal as SystemModalComponent };
