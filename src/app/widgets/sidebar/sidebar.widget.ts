import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideLayoutDashboard,
  lucideCpu,
  lucideBuilding,
  lucideWrench,
  lucideClipboardCheck,
  lucideUsers,
  lucideSettings,
  lucideLayers,
  lucideX
} from '@ng-icons/lucide';

import { UserDropdownComponent } from '@/core/layout/components/user-dropdown/user-dropdown.component';
import { AuthService } from '@/core/auth/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: string;
  requiredRole?: string;
}

@Component({
  selector: 'app-sidebar-widget',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    NgIconComponent,
    UserDropdownComponent
  ],
  viewProviders: [
    provideIcons({
      lucideLayoutDashboard,
      lucideCpu,
      lucideBuilding,
      lucideWrench,
      lucideClipboardCheck,
      lucideUsers,
      lucideSettings,
      lucideLayers,
      lucideX
    })
  ],
  templateUrl: './sidebar.widget.html',
  styleUrl: './sidebar.widget.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class SidebarWidgetComponent {
  private readonly authService = inject(AuthService);

  readonly isCollapsed = input(false);
  readonly isMobileOpen = input(false);

  readonly closeMobileSidebar = output<void>();

  readonly allNavItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'lucideLayoutDashboard' },
    { label: 'Dispositivos', route: '/devices', icon: 'lucideCpu', badge: 'Active' },
    { label: 'Bloques y Aulas', route: '/locations', icon: 'lucideBuilding' },
    { label: 'Inspecciones', route: '/inspections', icon: 'lucideClipboardCheck' },
    { label: 'Repuestos', route: '/replacements', icon: 'lucideWrench' },
    { label: 'Usuarios', route: '/users', icon: 'lucideUsers', requiredRole: 'admin' },
    { label: 'Configuración', route: '/settings', icon: 'lucideSettings' }
  ];

  readonly visibleNavItems = computed(() => {
    const role = this.authService.userRole();
    return this.allNavItems.filter(item => {
      if (item.requiredRole && item.requiredRole !== role) {
        return false;
      }
      return true;
    });
  });

  onCloseMobile(): void {
    this.closeMobileSidebar.emit();
  }
}
