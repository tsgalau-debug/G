import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {StoryComponent} from './story.component';
import {CharacterComponent} from './character.component';
import {EngineLogComponent} from './engine-log.component';
import {RagDiagnosticsComponent} from './rag-diagnostics.component';
import {NpcMapComponent} from './npc-map.component';
import {SystemModal, type ActiveModalType} from './system-modal';
import {StoryManagerComponent} from './story-manager.component';
// eslint-disable-next-line import/no-unresolved
import {MatIconModule} from '@angular/material/icon';
import {GameStateService} from './game-state.service';
import {CommonModule} from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [
    StoryComponent,
    CharacterComponent,
    EngineLogComponent,
    RagDiagnosticsComponent,
    NpcMapComponent,
    SystemModal,
    StoryManagerComponent,
    MatIconModule,
    CommonModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  showMap = false;
  showSidebar = false;
  get showStoryManager(): boolean {
    return this.gameState.showStoryManagerModal();
  }
  set showStoryManager(value: boolean) {
    this.gameState.showStoryManagerModal.set(value);
  }

  activeModal: ActiveModalType = 'none';

  readonly gameState = inject(GameStateService);

  get activeTab(): string {
    return this.gameState.activeTab();
  }
  set activeTab(tab: string) {
    this.gameState.activeTab.set(tab);
  }

  toggleMap(): void {
    this.showMap = !this.showMap;
  }

  toggleSidebar(): void {
    this.showSidebar = !this.showSidebar;
  }

  openStoryManager(): void {
    this.gameState.showStoryManagerModal.set(true);
    this.showSidebar = false;
  }

  closeStoryManager(): void {
    this.gameState.showStoryManagerModal.set(false);
  }

  openModal(modal: Exclude<ActiveModalType, 'none'>): void {
    this.activeModal = modal;
    this.showSidebar = false;
  }

  closeModal(): void {
    this.activeModal = 'none';
  }
}
