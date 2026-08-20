import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideUsers,
  lucideUserPlus,
  lucideSearch,
  lucideFilter,
  lucideLayoutGrid,
  lucideTable,
  lucidePencil,
  lucideTrash2,
  lucideShield,
  lucideWrench,
  lucideEye,
  lucideCheckCircle2,
  lucideXCircle,
  lucideMail,
  lucideRefreshCw
} from '@ng-icons/lucide';
import { toast } from 'ngx-sonner';

import { UserService } from '@/entities/user/api/user.service';
import { AuthService } from '@/core/auth/auth.service';
import { User, UserRole } from '@/entities/user/model/user.types';

import { ZardSheetService } from '@/shared/components/sheet';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardBadgeComponent } from '@/shared/components/badge';
import { ZardInputComponent } from '@/shared/components/input';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import {
  ZardCardComponent,
  ZardCardHeaderComponent,
  ZardCardTitleComponent,
  ZardCardContentComponent
} from '@/shared/components/card';
import {
  ZardTableComponent,
  ZardTableHeaderComponent,
  ZardTableBodyComponent,
  ZardTableRowComponent,
  ZardTableHeadComponent,
  ZardTableCellComponent
} from '@/shared/components/table';

import { UserDrawerComponent } from '@/features/users/components/user-drawer.component';
import { DeleteConfirmDrawerComponent } from '@/features/common/delete-confirm-drawer.component';

type ViewMode = 'grid' | 'table';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIconComponent,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardInputComponent,
    ZardSkeletonComponent,
    ZardCardComponent,
    ZardCardHeaderComponent,
    ZardCardTitleComponent,
    ZardCardContentComponent,
    ZardTableComponent,
    ZardTableHeaderComponent,
    ZardTableBodyComponent,
    ZardTableRowComponent,
    ZardTableHeadComponent,
    ZardTableCellComponent
  ],
  viewProviders: [
    provideIcons({
      lucideUsers,
      lucideUserPlus,
      lucideSearch,
      lucideFilter,
      lucideLayoutGrid,
      lucideTable,
      lucidePencil,
      lucideTrash2,
      lucideShield,
      lucideWrench,
      lucideEye,
      lucideCheckCircle2,
      lucideXCircle,
      lucideMail,
      lucideRefreshCw
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-6 w-full flex-1 animate-fade-in pb-12" role="region" aria-label="Módulo de Usuarios y Roles">
      
      <!-- Module Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-2xs">
        <div class="flex items-center gap-4">
          <div class="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
            <ng-icon name="lucideUsers" class="text-2xl" />
          </div>
          <div>
            <div class="flex items-center gap-2.5 flex-wrap">
              <h1 class="text-xl font-bold tracking-tight text-foreground">Gestión de Usuarios y Roles</h1>
              <z-badge zType="outline" class="text-xs gap-1.5 py-0.5 px-2.5 border-primary/30 bg-primary/10 text-primary font-medium">
                Personal Campus
              </z-badge>
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              Administración de cuentas, roles de inspección técnica y auditoría de accesos
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            z-button
            zType="default"
            (click)="openUserDrawer()"
            class="gap-2 shadow-2xs text-xs"
            aria-label="Registrar nuevo usuario"
          >
            <ng-icon name="lucideUserPlus" class="text-sm" />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      <!-- Quick Metrics Summary -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div class="p-4 rounded-xl bg-card border border-border/80 flex items-center gap-3.5 shadow-2xs">
          <div class="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ng-icon name="lucideUsers" class="text-lg" />
          </div>
          <div>
            <p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Cuentas</p>
            <p class="text-lg font-bold text-foreground">{{ users().length }}</p>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-card border border-border/80 flex items-center gap-3.5 shadow-2xs">
          <div class="size-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
            <ng-icon name="lucideShield" class="text-lg" />
          </div>
          <div>
            <p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Administradores</p>
            <p class="text-lg font-bold text-foreground">{{ adminCount() }}</p>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-card border border-border/80 flex items-center gap-3.5 shadow-2xs">
          <div class="size-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <ng-icon name="lucideWrench" class="text-lg" />
          </div>
          <div>
            <p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Técnicos / Inspectores</p>
            <p class="text-lg font-bold text-foreground">{{ techCount() }}</p>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-card border border-border/80 flex items-center gap-3.5 shadow-2xs">
          <div class="size-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <ng-icon name="lucideCheckCircle2" class="text-lg" />
          </div>
          <div>
            <p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Cuentas Activas</p>
            <p class="text-lg font-bold text-foreground">{{ activeCount() }}</p>
          </div>
        </div>

      </div>

      <!-- Controls Toolbar -->
      <div class="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4" role="search" aria-label="Filtros de búsqueda de usuarios">
        
        <!-- Real-time Search -->
        <div class="relative flex-1 min-w-[260px]">
          <ng-icon name="lucideSearch" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" aria-hidden="true" />
          <input
            z-input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Buscar por nombre o correo en tiempo real..."
            class="pl-9 pr-3 text-xs w-full"
            aria-label="Buscar usuario por nombre o correo"
          />
        </div>

        <!-- Filter Selects & View Toggle -->
        <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          
          <select
            [ngModel]="filterRole()"
            (ngModelChange)="filterRole.set($event)"
            class="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Filtrar por rol de usuario"
          >
            <option value="ALL">Todos los Roles</option>
            <option value="admin">Administrador</option>
            <option value="tech_support">Técnico / Inspector</option>
            <option value="viewer">Visualizador</option>
          </select>

          <select
            [ngModel]="filterStatus()"
            (ngModelChange)="filterStatus.set($event)"
            class="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Filtrar por estado de cuenta"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
          </select>

          <div class="flex items-center gap-1 p-1 rounded-lg bg-muted/60 border border-border/40 shrink-0" role="group" aria-label="Cambiar vista">
            <button
              type="button"
              (click)="viewMode.set('grid')"
              [class.bg-background]="viewMode() === 'grid'"
              [class.text-foreground]="viewMode() === 'grid'"
              [class.text-muted-foreground]="viewMode() !== 'grid'"
              class="p-1.5 rounded-md transition-all"
              title="Vista de Tarjetas"
              aria-label="Vista de tarjetas"
            >
              <ng-icon name="lucideLayoutGrid" class="text-sm" />
            </button>
            <button
              type="button"
              (click)="viewMode.set('table')"
              [class.bg-background]="viewMode() === 'table'"
              [class.text-foreground]="viewMode() === 'table'"
              [class.text-muted-foreground]="viewMode() !== 'table'"
              class="p-1.5 rounded-md transition-all"
              title="Vista de Tabla"
              aria-label="Vista de tabla"
            >
              <ng-icon name="lucideTable" class="text-sm" />
            </button>
          </div>

        </div>

      </div>

      <!-- Main Display Container -->
      @if (isLoading()) {
        <!-- Skeleton Shimmers -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" aria-busy="true">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div z-card class="shadow-2xs border border-border/80 rounded-2xl p-5 space-y-4">
              <div class="flex items-center justify-between">
                <z-skeleton class="h-4 w-20" />
                <z-skeleton class="h-4 w-12" />
              </div>
              <div class="flex items-center gap-3">
                <z-skeleton class="size-10 rounded-full" />
                <div class="space-y-1.5 flex-1">
                  <z-skeleton class="h-4 w-3/4" />
                  <z-skeleton class="h-3 w-1/2" />
                </div>
              </div>
            </div>
          }
        </div>
      } @else if (filteredUsers().length === 0) {
        <div class="py-16 flex flex-col items-center justify-center gap-3 text-center text-muted-foreground border border-dashed border-border/80 rounded-2xl p-8 bg-card">
          <div class="size-12 rounded-full bg-muted flex items-center justify-center">
            <ng-icon name="lucideUsers" class="text-xl" />
          </div>
          <p class="text-sm font-semibold text-foreground">No se encontraron usuarios</p>
          <p class="text-xs text-muted-foreground">Prueba modificando la búsqueda o los filtros aplicados.</p>
          <button z-button zType="outline" zSize="sm" (click)="openUserDrawer()" class="mt-2 gap-2">
            <ng-icon name="lucideUserPlus" class="text-xs" />
            <span>Registrar Usuario</span>
          </button>
        </div>
      } @else if (viewMode() === 'grid') {
        <!-- Grid View Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (u of filteredUsers(); track u.id) {
            <div z-card class="shadow-2xs border border-border/80 hover:border-primary/40 hover:shadow-md transition-all duration-200 rounded-2xl flex flex-col justify-between overflow-hidden">
              
              <div z-card-header class="pb-3">
                <div class="flex items-center justify-between gap-2">
                  <z-badge [zType]="getRoleBadgeType(u.role)" class="text-[10px] uppercase font-bold">
                    {{ getRoleLabel(u.role) }}
                  </z-badge>

                  <div class="flex items-center gap-1">
                    <button
                      type="button"
                      z-button
                      zType="ghost"
                      zSize="icon-sm"
                      (click)="toggleStatus(u)"
                      [title]="u.is_active ? 'Desactivar Cuenta' : 'Habilitar Cuenta'"
                      aria-label="Alternar estado de cuenta"
                    >
                      <ng-icon [name]="u.is_active ? 'lucideCheckCircle2' : 'lucideXCircle'" [class]="u.is_active ? 'text-xs text-emerald-500' : 'text-xs text-muted-foreground'" />
                    </button>

                    <button
                      type="button"
                      z-button
                      zType="ghost"
                      zSize="icon-sm"
                      (click)="openUserDrawer(u)"
                      title="Editar Usuario"
                      aria-label="Editar usuario"
                    >
                      <ng-icon name="lucidePencil" class="text-xs text-muted-foreground hover:text-foreground" />
                    </button>

                    <button
                      type="button"
                      z-button
                      zType="ghost"
                      zSize="icon-sm"
                      (click)="deleteUser(u)"
                      title="Eliminar Usuario"
                      aria-label="Eliminar usuario"
                    >
                      <ng-icon name="lucideTrash2" class="text-xs text-destructive" />
                    </button>
                  </div>
                </div>

                <div class="flex items-center gap-3 mt-3">
                  <div class="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {{ getInitials(u.name) }}
                  </div>
                  <div class="overflow-hidden">
                    <h3 z-card-title class="text-base font-bold text-foreground truncate">
                      {{ u.name }}
                    </h3>
                    <p class="text-xs text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                      <ng-icon name="lucideMail" class="text-xs shrink-0" />
                      {{ u.email }}
                    </p>
                  </div>
                </div>
              </div>

              <div z-card-content class="pt-0 space-y-2">
                <div class="pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                  <span class="text-muted-foreground">Estado de Acceso:</span>
                  <z-badge [zType]="u.is_active ? 'outline' : 'secondary'" class="text-[10px]">
                    {{ u.is_active ? 'Habilitado' : 'Inactivo' }}
                  </z-badge>
                </div>
              </div>

            </div>
          }
        </div>
      } @else {
        <!-- Table View -->
        <div class="overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-2xs">
          <table z-table class="w-full">
            <thead z-table-header class="bg-muted/40">
              <tr z-table-row>
                <th z-table-head class="text-xs font-semibold">Usuario</th>
                <th z-table-head class="text-xs font-semibold">Correo Electrónico</th>
                <th z-table-head class="text-xs font-semibold">Rol</th>
                <th z-table-head class="text-xs font-semibold">Estado</th>
                <th z-table-head class="text-xs font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody z-table-body>
              @for (u of filteredUsers(); track u.id) {
                <tr z-table-row class="hover:bg-muted/30 transition-colors">
                  <td z-table-cell class="text-xs font-bold text-foreground flex items-center gap-2.5">
                    <div class="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                      {{ getInitials(u.name) }}
                    </div>
                    <span>{{ u.name }}</span>
                  </td>
                  <td z-table-cell class="text-xs font-mono text-muted-foreground">{{ u.email }}</td>
                  <td z-table-cell>
                    <z-badge [zType]="getRoleBadgeType(u.role)" class="text-[10px] uppercase font-bold">
                      {{ getRoleLabel(u.role) }}
                    </z-badge>
                  </td>
                  <td z-table-cell>
                    <z-badge [zType]="u.is_active ? 'outline' : 'secondary'" class="text-[10px]">
                      {{ u.is_active ? 'Activo' : 'Inactivo' }}
                    </z-badge>
                  </td>
                  <td z-table-cell class="text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        z-button
                        zType="ghost"
                        zSize="icon-sm"
                        (click)="toggleStatus(u)"
                        aria-label="Alternar estado de cuenta"
                      >
                        <ng-icon [name]="u.is_active ? 'lucideCheckCircle2' : 'lucideXCircle'" [class]="u.is_active ? 'text-xs text-emerald-500' : 'text-xs text-muted-foreground'" />
                      </button>
                      <button
                        type="button"
                        z-button
                        zType="ghost"
                        zSize="icon-sm"
                        (click)="openUserDrawer(u)"
                        aria-label="Editar usuario"
                      >
                        <ng-icon name="lucidePencil" class="text-xs" />
                      </button>
                      <button
                        type="button"
                        z-button
                        zType="ghost"
                        zSize="icon-sm"
                        (click)="deleteUser(u)"
                        aria-label="Eliminar usuario"
                      >
                        <ng-icon name="lucideTrash2" class="text-xs text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

    </div>
  `
})
export class UsersPageComponent implements OnInit {
  private readonly userService = inject(UserService);
  readonly authService = inject(AuthService);
  private readonly sheetService = inject(ZardSheetService);

  readonly canManageUsers = this.authService.canManageUsers;
  readonly canEdit = this.authService.canEdit;
  readonly canDelete = this.authService.canDelete;
  readonly isViewer = this.authService.isViewer;

  readonly viewMode = signal<ViewMode>('grid');
  readonly searchQuery = signal<string>('');
  readonly filterRole = signal<string>('ALL');
  readonly filterStatus = signal<string>('ALL');

  readonly users = this.userService.users;
  readonly isLoading = computed(() => this.userService.loading());

  readonly adminCount = computed(() => this.users().filter(u => u.role === 'admin').length);
  readonly techCount = computed(() => this.users().filter(u => u.role === 'tech_support').length);
  readonly activeCount = computed(() => this.users().filter(u => u.is_active).length);

  ngOnInit(): void {
    this.userService.fetchUsers();
  }

  readonly filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const roleFilter = this.filterRole();
    const statusFilter = this.filterStatus();

    return this.users().filter(u => {
      const matchesSearch =
        !query ||
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query);

      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && u.is_active) ||
        (statusFilter === 'INACTIVE' && !u.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  });

  openUserDrawer(user?: User): void {
    this.sheetService.create({
      zContent: UserDrawerComponent,
      zSide: 'right',
      zSize: 'lg',
      zWidth: 'min(460px, 95vw)',
      zHideFooter: true,
      zData: { user }
    });
  }

  async toggleStatus(user: User): Promise<void> {
    const updated = await this.userService.toggleUserStatus(user.id, user.is_active);
    if (updated) {
      toast.success(`Cuenta de "${updated.name}" ${updated.is_active ? 'habilitada' : 'deshabilitada'}.`);
    } else {
      toast.error('Error al cambiar estado de la cuenta.');
    }
  }

  deleteUser(user: User): void {
    this.sheetService.create({
      zContent: DeleteConfirmDrawerComponent,
      zSide: 'right',
      zSize: 'default',
      zWidth: 'min(440px, 95vw)',
      zHideFooter: true,
      zData: {
        title: 'Eliminar Usuario',
        description: '¿Estás seguro de eliminar este usuario? La cuenta ya no podrá acceder al sistema.',
        itemName: `${user.name} (${user.email})`,
        onDelete: () => this.userService.deleteUser(user.id)
      }
    });
  }

  getRoleBadgeType(role: UserRole): 'default' | 'secondary' | 'outline' | 'destructive' {
    switch (role) {
      case 'admin':
        return 'default';
      case 'tech_support':
        return 'outline';
      case 'viewer':
        return 'secondary';
      default:
        return 'outline';
    }
  }

  getRoleLabel(role: UserRole): string {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'tech_support':
        return 'Técnico';
      case 'viewer':
        return 'Visualizador';
      default:
        return role;
    }
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
