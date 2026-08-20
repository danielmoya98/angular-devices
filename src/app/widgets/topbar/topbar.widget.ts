import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideMenu, lucidePanelLeft } from '@ng-icons/lucide';

import { BreadcrumbNavComponent } from '@/core/layout/components/breadcrumb-nav/breadcrumb-nav.component';
import { NotificationDropdownComponent } from '@/core/layout/components/notification-dropdown/notification-dropdown.component';
import { ThemeToggleComponent } from '@/core/layout/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-topbar-widget',
  standalone: true,
  imports: [
    CommonModule,
    NgIconComponent,
    BreadcrumbNavComponent,
    NotificationDropdownComponent,
    ThemeToggleComponent
  ],
  viewProviders: [
    provideIcons({ lucideMenu, lucidePanelLeft })
  ],
  templateUrl: './topbar.widget.html',
  styleUrl: './topbar.widget.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class TopbarWidgetComponent {
  readonly isCollapsed = input(false);

  readonly toggleSidebar = output<void>();
  readonly toggleMobileSidebar = output<void>();

  onToggleDesktop(): void {
    this.toggleSidebar.emit();
  }

  onToggleMobile(): void {
    this.toggleMobileSidebar.emit();
  }
}
