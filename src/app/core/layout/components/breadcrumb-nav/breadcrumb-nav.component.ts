import { Component, ChangeDetectionStrategy, ViewEncapsulation, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ZardBreadcrumbImports } from '@/shared/components/breadcrumb/breadcrumb.imports';

interface BreadcrumbItem {
  label: string;
  url: string;
  isLast: boolean;
}

@Component({
  selector: 'app-breadcrumb-nav',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ZardBreadcrumbImports
  ],
  templateUrl: './breadcrumb-nav.component.html',
  styleUrl: './breadcrumb-nav.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class BreadcrumbNavComponent {
  private readonly router = inject(Router);
  readonly breadcrumbs = signal<BreadcrumbItem[]>([]);

  private readonly routeMap: Record<string, string> = {
    'dashboard': 'Panel de Control',
    'devices': 'Dispositivos IoT',
    'locations': 'Bloques y Aulas',
    'inspections': 'Inspecciones Técnicas',
    'replacements': 'Repuestos y Mantenimiento',
    'users': 'Gestión de Usuarios',
    'settings': 'Configuración del Sistema'
  };

  constructor() {
    this.updateBreadcrumbs(this.router.url);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        this.updateBreadcrumbs(event.urlAfterRedirects || event.url);
      });
  }

  private updateBreadcrumbs(url: string): void {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const segments = cleanUrl.split('/').filter(Boolean);

    const items: BreadcrumbItem[] = [
      { label: 'Inicio', url: '/dashboard', isLast: segments.length === 0 || (segments.length === 1 && segments[0] === 'dashboard') }
    ];

    let currentPath = '';
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentPath += `/${segment}`;

      if (segment === 'dashboard' && i === 0) continue;

      const label = this.routeMap[segment] || (segment.charAt(0).toUpperCase() + segment.slice(1));
      const isLast = i === segments.length - 1;

      items.push({ label, url: currentPath, isLast });
    }

    this.breadcrumbs.set(items);
  }
}
