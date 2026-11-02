export interface EquippedGear {
  weapon?: string | undefined;
  armor?: string | undefined;
  accessory?: string | undefined;
  bag?: string | undefined;
}

export interface StoryImpact {
  summary?: string | undefined;
  hpDelta?: number | undefined;
  spDelta?: number | undefined;
  expGained?: number | undefined;
  trustChanges?: Record<string, number> | undefined;
  factionChanges?: Record<string, number> | undefined;
  itemsAdded?: string[] | undefined;
  itemsRemoved?: string[] | undefined;
  timestamp?: string | undefined;
}

export interface McState {
  name?: string | undefined;
  title?: string | undefined;
  personality?: string | undefined;
  background?: string | undefined;
  goal?: string | undefined;
  level?: number | undefined;
  exp?: number | undefined;
  maxExp?: number | undefined;
  expGained?: number | undefined;
  inventory?: string[] | undefined;
  equipped?: EquippedGear | undefined;
  status?: string | undefined;
  location?: string | undefined;
  locationName?: string | undefined;
  trust?: Record<string, string | number> | undefined;
  time?: string | undefined;
  day?: number | undefined;
  stats?: Record<string, string | number> | undefined;
  action?: string | undefined;
  dialogue?: string | undefined;
  lastStoryImpact?: StoryImpact | undefined;
}

export interface GraphUpdate {
  action: 'bind' | 'unbind' | 'reweight';
  entity: string;
  fact: string;
  weight?: number | undefined;
  previousFact?: string | undefined;
}

export interface QuestState {
  title: string;
  description: string;
  status: 'active' | 'completed' | 'failed';
  objectives: string[];
}

export interface CombatState {
  inCombat: boolean;
  enemies: { name: string; hp: number | string; status: string }[];
  advantage: 'player' | 'enemy' | 'neutral';
}

export interface NarrativeBlock {
  name: string;
  narration: string;
  dialogue: string;
  action: string;
}

export interface ChronicleEntry {
  narrative_blocks?: NarrativeBlock[];
  narrative?: string;
  mc_state?: Partial<McState>;
  npc_state?: NpcState[];
  factions?: FactionState[];
  room_layout?: string;
  environment?: string;
  choices?: {
    id: string;
    text: string;
    weight?: number;
    requirements?: { inventory?: string[]; trust?: Record<string, number> };
  }[];
  graph_updates?: GraphUpdate[];
  quest_updates?: Record<string, QuestState>;
  combat_updates?: CombatState;
  query_lore_keys?: string[];
  update_story_summary?: string;
}

export interface FactionState {
  name: string;
  description: string;
  reputation: number;
  leader?: string;
}

export type NpcScheduleArchetype =
  | 'resident'
  | 'companion'
  | 'guard'
  | 'merchant'
  | 'scholar'
  | 'shadow'
  | 'wanderer';

export interface NpcState {
  nama: string;
  peran?: string | undefined;
  role?: string | undefined;
  kepribadian?: string | undefined;
  personality?: string | undefined;
  tujuan?: string | undefined;
  goal?: string | undefined;
  gaya_bicara?: string | undefined;
  voiceStyle?: string | undefined;
  scheduleArchetype?: NpcScheduleArchetype | undefined;
  lokasi?: string | undefined;
  location?: string | undefined;
  aktivitas?: string | undefined;
  activity?: string | undefined;
  mood?: string | undefined;
  status?: string | undefined;
  faksi?: string | undefined;
  faction?: string | undefined;
  _lastScheduleTime?: number | undefined; // Internal tracking to prevent overwriting AI customizations
  _fromSchedule?: boolean | undefined;
}

export interface NpcScheduleSlot {
  startHour: number; // 0..23
  endHour: number;   // 0..23
  period: 'early_morning' | 'late_morning' | 'midday' | 'afternoon' | 'evening' | 'night';
  lokasi: string;
  aktivitas: string;
  mood: string;
}

export interface NpcDailySchedule {
  npcKey: string;
  npcName: string;
  archetype: NpcScheduleArchetype;
  homeLocation: string;
  faksi?: string | undefined;
  slots: NpcScheduleSlot[];
}

export type CharacterArchetype = 'balanced' | 'warrior' | 'diplomat' | 'scout' | 'scholar';

export interface InitialCustomNpcInput {
  nama: string;
  peran?: string | undefined;
  scheduleArchetype?: NpcScheduleArchetype | undefined;
  kepribadian?: string | undefined;
  tujuan?: string | undefined;
  gaya_bicara?: string | undefined;
  lokasi?: string | undefined;
  aktivitas?: string | undefined;
  faksi?: string | undefined;
  trust?: number | undefined;
}

export interface StoryMetadata {
  id: string;
  title: string;
  mcName: string;
  mcTitle: string;
  mcPersonality?: string | undefined;
  mcBackground?: string | undefined;
  mcGoal?: string | undefined;
  customInventory?: string[] | undefined;
  initialNpcs?: InitialCustomNpcInput[] | undefined;
  worldSetting: string;
  locationName: string;
  initialWeapon?: string | undefined;
  characterArchetype?: CharacterArchetype | undefined;
  createdAt: number;
  updatedAt: number;
  lastPlayedAt: number;
  turnCount: number;
  summary: string;
  tags?: string[] | undefined;
}

export interface CreateStoryPayload {
  title: string;
  mcName: string;
  mcTitle: string;
  mcPersonality?: string | undefined;
  mcBackground?: string | undefined;
  mcGoal?: string | undefined;
  customInventory?: string[] | undefined;
  initialNpcs?: InitialCustomNpcInput[] | undefined;
  worldSetting: string;
  locationName: string;
  initialWeapon: string;
  characterArchetype?: CharacterArchetype | undefined;
  prologuePrompt?: string | undefined;
}

export interface TimelineAncestorSnapshot {
  chronicleLength: number;
  mcState: Partial<McState>;
  npcStates: Record<string, NpcState>;
  npcSchedules?: Record<string, NpcDailySchedule> | undefined;
  factions: Record<string, FactionState>;
  knowledgeGraph: Record<string, string[]>;
  knowledgeWeights?: Record<string, number> | undefined;
  quests: Record<string, QuestState>;
}

export interface TimelineBranchSnapshot {
  chronicle: ChronicleEntry[];
  mcState: Partial<McState>;
  npcStates: Record<string, NpcState>;
  npcSchedules?: Record<string, NpcDailySchedule> | undefined;
  factions: Record<string, FactionState>;
  logs: string[];
  knowledgeGraph: Record<string, string[]>;
  knowledgeWeights?: Record<string, number> | undefined;
  activeLoreKeys: string[];
  storySummary: string;
  quests: Record<string, QuestState>;
  combat: CombatState;
  forkTurn?: number | undefined;
  parentTimelineId?: string | null | undefined;
  ancestorSnapshot?: TimelineAncestorSnapshot | undefined;
}

export interface StorySessionData {
  chronicle: ChronicleEntry[];
  mcState: Partial<McState>;
  npcStates: Record<string, NpcState>;
  npcSchedules?: Record<string, NpcDailySchedule> | undefined;
  factions: Record<string, FactionState>;
  logs: string[];
  knowledgeGraph: Record<string, string[]>;
  knowledgeWeights?: Record<string, number> | undefined;
  activeLoreKeys: string[];
  storySummary: string;
  quests: Record<string, QuestState>;
  combat: CombatState;
  aiModel?: string | undefined;
  activeTimelineId?: string | undefined;
  timelineSnapshots?: Record<string, TimelineBranchSnapshot> | undefined;
  timelineDagState?: unknown | undefined;
  rlPolicySnapshot?: unknown | undefined;
}


