import { Component, ChangeDetectionStrategy, ViewEncapsulation, signal, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideSearch,
  lucideLayoutDashboard,
  lucideCpu,
  lucideBuilding,
  lucideClipboardCheck,
  lucideWrench,
  lucideUsers,
  lucideSettings,
  lucideSun,
  lucideLogOut,
  lucideX,
  lucideArrowRight
} from '@ng-icons/lucide';

import { ThemeService } from '@/core/theme/theme.service';
import { AuthService } from '@/core/auth/auth.service';

interface CommandAction {
  id: string;
  label: string;
  category: string;
  icon: string;
  action: () => void;
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  viewProviders: [
    provideIcons({
      lucideSearch,
      lucideLayoutDashboard,
      lucideCpu,
      lucideBuilding,
      lucideClipboardCheck,
      lucideWrench,
      lucideUsers,
      lucideSettings,
      lucideSun,
      lucideLogOut,
      lucideX,
      lucideArrowRight
    })
  ],
  templateUrl: './command-palette.component.html',
  styleUrl: './command-palette.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class CommandPaletteComponent {
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);
  private readonly authService = inject(AuthService);

  readonly isOpen = signal(false);
  readonly searchQuery = signal('');

  readonly actions: CommandAction[] = [
    {
      id: 'nav-dashboard',
      label: 'Ir al Panel de Control',
      category: 'Navegación',
      icon: 'lucideLayoutDashboard',
      action: () => this.navigate('/dashboard')
    },
    {
      id: 'nav-devices',
      label: 'Ver Dispositivos IoT',
      category: 'Navegación',
      icon: 'lucideCpu',
      action: () => this.navigate('/devices')
    },
    {
      id: 'nav-locations',
      label: 'Bloques y Aulas del Campus',
      category: 'Navegación',
      icon: 'lucideBuilding',
      action: () => this.navigate('/locations')
    },
    {
      id: 'nav-inspections',
      label: 'Inspecciones Técnicas y Auditorías',
      category: 'Navegación',
      icon: 'lucideClipboardCheck',
      action: () => this.navigate('/inspections')
    },
    {
      id: 'nav-replacements',
      label: 'Repuestos e Insumos',
      category: 'Navegación',
      icon: 'lucideWrench',
      action: () => this.navigate('/replacements')
    },
    {
      id: 'nav-users',
      label: 'Gestión de Usuarios y Roles',
      category: 'Navegación',
      icon: 'lucideUsers',
      action: () => this.navigate('/users')
    },
    {
      id: 'nav-settings',
      label: 'Configuración del Sistema',
      category: 'Navegación',
      icon: 'lucideSettings',
      action: () => this.navigate('/settings')
    },
    {
      id: 'action-theme',
      label: 'Cambiar Modo Claro / Oscuro',
      category: 'Preferencias',
      icon: 'lucideSun',
      action: () => {
        this.themeService.toggleTheme();
        this.close();
      }
    },
    {
      id: 'action-logout',
      label: 'Cerrar Sesión',
      category: 'Cuenta',
      icon: 'lucideLogOut',
      action: () => {
        this.authService.signOut();
        this.navigate('/login');
      }
    }
  ];

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.toggle();
    } else if (event.key === 'Escape' && this.isOpen()) {
      this.close();
    }
  }

  toggle(): void {
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      this.searchQuery.set('');
    }
  }

  open(): void {
    this.isOpen.set(true);
    this.searchQuery.set('');
  }

  close(): void {
    this.isOpen.set(false);
  }

  private navigate(route: string): void {
    this.close();
    this.router.navigate([route]);
  }

  filteredActions(): CommandAction[] {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.actions;
    return this.actions.filter(a => a.label.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));
  }
}
