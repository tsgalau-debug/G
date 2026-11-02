import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { runInInjectionContext, Injector } from '@angular/core';
import { GameStateService } from '../app/game-state.service';
import { App } from '../app/app';
import { CharacterComponent } from '../app/character.component';
import { CharacterStatsComponent } from '../app/character/character-stats.component';
import { NpcMapComponent } from '../app/npc-map.component';

// Mock the API key before any imports that depend on it
(globalThis as any).GEMINI_API_KEY = 'test_key';

describe('App Component & Minimalist Line UI Workspace', () => {
  it('should instantiate cleanly in zoneless injection context and manage top bar state', () => {
    const injector = Injector.create({
      providers: [{ provide: GameStateService, useClass: GameStateService }],
    });

    const app = runInInjectionContext(injector, () => new App());
    expect(app).toBeTruthy();
    expect(app.showMap).toBe(false);

    app.toggleMap();
    expect(app.showMap).toBe(true);

    app.toggleSidebar();
    expect(app.showSidebar).toBe(true);

    app.openModal('quests');
    expect(app.activeModal).toBe('quests');
    expect(app.showSidebar).toBe(false);

    app.closeModal();
    expect(app.activeModal).toBe('none');

    app.openStoryManager();
    expect(app.showStoryManager).toBe(true);
    expect(app.showSidebar).toBe(false);

    app.closeStoryManager();
    expect(app.showStoryManager).toBe(false);
  });

  it('should manage CharacterComponent two-column sub-tabs and radar polygon geometry', () => {
    const injector = Injector.create({
      providers: [{ provide: GameStateService, useClass: GameStateService }],
    });

    const charComp = runInInjectionContext(injector, () => new CharacterComponent());
    expect(charComp.desktopRightTab()).toBe('inventory');
    expect(charComp.mobileTab()).toBe('profile');

    charComp.desktopRightTab.set('stats');
    expect(charComp.desktopRightTab()).toBe('stats');

    const statsComp = runInInjectionContext(injector, () => new CharacterStatsComponent());
    const points = statsComp.getRadarPolygonPoints();
    expect(points.split(' ').length).toBe(4);
  });

  it('should default NpcMapComponent to all NPCs and support switching between directory and knowledge graph', () => {
    const injector = Injector.create({
      providers: [{ provide: GameStateService, useClass: GameStateService }],
    });

    const mapComp = runInInjectionContext(injector, () => new NpcMapComponent());
    expect(mapComp.viewMode).toBe('all');
    expect(mapComp.activeSection()).toBe('directory');

    mapComp.activeSection.set('graph');
    expect(mapComp.activeSection()).toBe('graph');
  });
});
