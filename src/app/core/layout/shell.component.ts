import { Component, ChangeDetectionStrategy, ViewEncapsulation, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { SidebarWidgetComponent } from '@/widgets/sidebar';
import { TopbarWidgetComponent } from '@/widgets/topbar';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarWidgetComponent,
    TopbarWidgetComponent
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ShellComponent {
  // Global Layout Signals
  readonly isCollapsed = signal(false);
  readonly isMobileOpen = signal(false);

  toggleSidebar(): void {
    this.isCollapsed.update(collapsed => !collapsed);
  }

  toggleMobileSidebar(): void {
    this.isMobileOpen.update(open => !open);
  }

  closeMobileSidebar(): void {
    this.isMobileOpen.set(false);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    const activeElement = document.activeElement;
    const isTyping = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement || activeElement instanceof HTMLSelectElement;

    if (event.key === '/' && !isTyping) {
      event.preventDefault();
      const searchInput = document.querySelector('input[z-input], input[type="text"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    } else if (event.key === 'Escape') {
      if (this.isMobileOpen()) {
        this.closeMobileSidebar();
      }
    }
  }
}
