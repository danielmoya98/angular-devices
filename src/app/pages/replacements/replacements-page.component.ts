import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideWrench,
  lucidePlus,
  lucideSearch,
  lucideFilter,
  lucideLayoutGrid,
  lucideTable,
  lucidePencil,
  lucideTrash2,
  lucideDollarSign,
  lucidePackage,
  lucideCpu,
  lucideUser,
  lucideCalendar,
  lucideDoorOpen,
  lucideRefreshCw
} from '@ng-icons/lucide';
import { toast } from 'ngx-sonner';

import { ReplacementService } from '@/entities/replacement/api/replacement.service';
import { DeviceService } from '@/entities/device/api/device.service';
import { UserService } from '@/entities/user/api/user.service';
import { AuthService } from '@/core/auth/auth.service';
import { DeviceReplacement, ReplacementItemType } from '@/entities/replacement/model/replacement.types';

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

import { ReplacementDrawerComponent } from '@/features/replacements/components/replacement-drawer.component';
import { DeleteConfirmDrawerComponent } from '@/features/common/delete-confirm-drawer.component';

type ViewMode = 'grid' | 'table';

@Component({
  selector: 'app-replacements-page',
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
      lucideWrench,
      lucidePlus,
      lucideSearch,
      lucideFilter,
      lucideLayoutGrid,
      lucideTable,
      lucidePencil,
      lucideTrash2,
      lucideDollarSign,
      lucidePackage,
      lucideCpu,
      lucideUser,
      lucideCalendar,
      lucideDoorOpen,
      lucideRefreshCw
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-6 w-full flex-1 animate-fade-in pb-12" role="region" aria-label="Módulo de Repuestos y Mantenimiento">
      
      <!-- Module Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-2xs">
        <div class="flex items-center gap-4">
          <div class="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
            <ng-icon name="lucideWrench" class="text-2xl" />
          </div>
          <div>
            <div class="flex items-center gap-2.5 flex-wrap">
              <h1 class="text-xl font-bold tracking-tight text-foreground">Repuestos y Mantenimiento</h1>
              <z-badge zType="outline" class="text-xs gap-1.5 py-0.5 px-2.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-medium">
                Control de Insumos
              </z-badge>
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              Registro histórico de sustitución de piezas, insumos, cables, accesorios y presupuestos de mantenimiento
            </p>
          </div>
        </div>

        @if (canEdit()) {
          <div class="flex items-center gap-3 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              z-button
              zType="default"
              (click)="openReplacementDrawer()"
              class="gap-2 shadow-2xs text-xs"
              aria-label="Registrar nuevo repuesto"
            >
              <ng-icon name="lucidePlus" class="text-sm" />
              <span>Registrar Repuesto</span>
            </button>
          </div>
        } @else {
          <z-badge zType="secondary" class="text-xs py-1.5 px-3 border border-border/60">
            Modo Consulta / Auditoría
          </z-badge>
        }
      </div>

      <!-- Quick Metrics Summary -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div class="p-4 rounded-xl bg-card border border-border/80 flex items-center gap-3.5 shadow-2xs">
          <div class="size-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <ng-icon name="lucideDollarSign" class="text-lg" />
          </div>
          <div>
            <p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Presupuesto Invertido</p>
            <p class="text-lg font-bold text-foreground">\${{ totalCost().toFixed(2) }}</p>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-card border border-border/80 flex items-center gap-3.5 shadow-2xs">
          <div class="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ng-icon name="lucidePackage" class="text-lg" />
          </div>
          <div>
            <p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Insumos Reemplazados</p>
            <p class="text-lg font-bold text-foreground">{{ totalQuantity() }} unidades</p>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-card border border-border/80 flex items-center gap-3.5 shadow-2xs">
          <div class="size-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <ng-icon name="lucideWrench" class="text-lg" />
          </div>
          <div>
            <p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Intervenciones</p>
            <p class="text-lg font-bold text-foreground">{{ replacements().length }} registros</p>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-card border border-border/80 flex items-center gap-3.5 shadow-2xs">
          <div class="size-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
            <ng-icon name="lucideDollarSign" class="text-lg" />
          </div>
          <div>
            <p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Costo Promedio</p>
            <p class="text-lg font-bold text-foreground">\${{ averageCost().toFixed(2) }}</p>
          </div>
        </div>

      </div>

      <!-- Controls Toolbar -->
      <div class="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4" role="search" aria-label="Filtros de búsqueda de repuestos">
        
        <!-- Real-time Search -->
        <div class="relative flex-1 min-w-[260px]">
          <ng-icon name="lucideSearch" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" aria-hidden="true" />
          <input
            z-input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Buscar por código de equipo, motivo, repuesto o técnico..."
            class="pl-9 pr-3 text-xs w-full"
            aria-label="Buscar repuesto por código, motivo o técnico"
          />
        </div>

        <!-- Filter Selects & View Toggle -->
        <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          
          <select
            [ngModel]="filterItemType()"
            (ngModelChange)="filterItemType.set($event)"
            class="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Filtrar por tipo de insumo"
          >
            <option value="ALL">Todos los Insumos</option>
            <option value="cable_hdmi">Cable HDMI</option>
            <option value="cable_power">Cable de Poder</option>
            <option value="cable_vga">Cable VGA</option>
            <option value="lamp_bulb">Lámpara de Proyector</option>
            <option value="remote_control_unit">Control Remoto</option>
            <option value="battery_remote">Pilas / Baterías</option>
            <option value="other">Otros Insumos</option>
          </select>

          <select
            [ngModel]="filterDeviceId()"
            (ngModelChange)="filterDeviceId.set($event)"
            class="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring max-w-[160px] truncate"
            aria-label="Filtrar por dispositivo"
          >
            <option value="ALL">Todos los Equipos</option>
            @for (d of devices(); track d.id) {
              <option [value]="d.id">{{ d.internal_code }}</option>
            }
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
                <z-skeleton class="h-4 w-28" />
                <z-skeleton class="h-4 w-16" />
              </div>
              <z-skeleton class="h-5 w-3/4" />
              <div class="pt-2 border-t border-border/40 space-y-2">
                <z-skeleton class="h-3 w-full" />
                <z-skeleton class="h-3 w-2/3" />
              </div>
            </div>
          }
        </div>
      } @else if (filteredReplacements().length === 0) {
        <div class="py-16 flex flex-col items-center justify-center gap-3 text-center text-muted-foreground border border-dashed border-border/80 rounded-2xl p-8 bg-card">
          <div class="size-12 rounded-full bg-muted flex items-center justify-center">
            <ng-icon name="lucideWrench" class="text-xl" />
          </div>
          <p class="text-sm font-semibold text-foreground">No se encontraron sustituciones registradas</p>
          <p class="text-xs text-muted-foreground">Ajusta los términos del buscador o los filtros aplicados.</p>
          <button z-button zType="outline" zSize="sm" (click)="openReplacementDrawer()" class="mt-2 gap-2">
            <ng-icon name="lucidePlus" class="text-xs" />
            <span>Registrar Primer Repuesto</span>
          </button>
        </div>
      } @else if (viewMode() === 'grid') {
        <!-- Grid View Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (r of filteredReplacements(); track r.id) {
            <div z-card class="relative overflow-hidden group border border-border/80 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 ease-out hover:-translate-y-1.5 rounded-2xl bg-card flex flex-col justify-between">
              
              <!-- UNIVALLE Watermark Background -->
              <img
                src="assets/images/univalle-logo-red.png"
                alt="UNIVALLE"
                class="absolute -bottom-4 -right-4 size-28 object-contain opacity-[0.04] dark:opacity-[0.07] pointer-events-none transition-all duration-300 group-hover:scale-105 group-hover:opacity-[0.10]"
              />

              <div z-card-header class="p-5 pb-3 relative z-10">
                <div class="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <div class="flex items-center gap-2">
                    <div class="size-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 shrink-0 shadow-2xs group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
                      <ng-icon name="lucideWrench" class="text-sm" />
                    </div>
                    <z-badge zType="default" class="text-xs font-semibold">
                      {{ getItemTypeLabel(r.item_type) }}
                    </z-badge>
                  </div>

                  <div class="flex items-center gap-1 shrink-0">
                    <span class="text-xs font-bold text-emerald-500 font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      \${{ r.cost.toFixed(2) }}
                    </span>

                    <button
                      type="button"
                      z-button
                      zType="ghost"
                      zSize="icon-sm"
                      (click)="openReplacementDrawer(r)"
                      title="Editar Registro"
                      aria-label="Editar repuesto"
                      class="hover:bg-primary/10 hover:text-primary"
                    >
                      <ng-icon name="lucidePencil" class="text-xs text-muted-foreground" />
                    </button>

                    <button
                      type="button"
                      z-button
                      zType="ghost"
                      zSize="icon-sm"
                      (click)="deleteReplacement(r)"
                      title="Eliminar Registro"
                      aria-label="Eliminar repuesto"
                      class="hover:bg-destructive/10"
                    >
                      <ng-icon name="lucideTrash2" class="text-xs text-destructive" />
                    </button>
                  </div>
                </div>

                <h3 z-card-title class="text-sm font-bold text-foreground mt-3 flex items-center gap-2">
                  <ng-icon name="lucideCpu" class="text-primary text-xs shrink-0" />
                  {{ r.device?.internal_code || 'Equipo' }} ({{ r.device?.brand }} {{ r.device?.model }})
                </h3>
              </div>

              <div z-card-content class="px-5 pb-5 pt-0 space-y-2.5 relative z-10">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-muted-foreground">Ubicación (Aula):</span>
                  <span class="font-medium text-foreground flex items-center gap-1">
                    <ng-icon name="lucideDoorOpen" class="text-xs text-primary" />
                    {{ r.device?.classroom?.code || 'En Almacén' }}
                  </span>
                </div>

                <div class="flex items-center justify-between text-xs">
                  <span class="text-muted-foreground">Cantidad Cambiada:</span>
                  <span class="font-bold text-foreground">{{ r.quantity }} unidad(es)</span>
                </div>

                <div class="flex items-center justify-between text-xs">
                  <span class="text-muted-foreground">Técnico Responsable:</span>
                  <span class="font-medium text-foreground flex items-center gap-1">
                    <ng-icon name="lucideUser" class="text-xs" />
                    {{ r.user?.name || 'Técnico' }}
                  </span>
                </div>

                <div class="flex items-center justify-between text-xs">
                  <span class="text-muted-foreground">Fecha de Cambio:</span>
                  <span class="font-mono text-muted-foreground flex items-center gap-1">
                    <ng-icon name="lucideCalendar" class="text-xs" />
                    {{ r.replaced_at }}
                  </span>
                </div>

                <p class="text-xs text-muted-foreground pt-2 border-t border-border/40 line-clamp-2">
                  <strong>Motivo:</strong> {{ r.reason }}
                </p>
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
                <th z-table-head class="text-xs font-semibold">Fecha</th>
                <th z-table-head class="text-xs font-semibold">Dispositivo</th>
                <th z-table-head class="text-xs font-semibold">Aula / Bloque</th>
                <th z-table-head class="text-xs font-semibold">Insumo Reemplazado</th>
                <th z-table-head class="text-xs font-semibold text-center">Cant.</th>
                <th z-table-head class="text-xs font-semibold">Costo ($)</th>
                <th z-table-head class="text-xs font-semibold">Motivo</th>
                <th z-table-head class="text-xs font-semibold">Técnico</th>
                <th z-table-head class="text-xs font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody z-table-body>
              @for (r of filteredReplacements(); track r.id) {
                <tr z-table-row class="hover:bg-muted/30 transition-colors">
                  <td z-table-cell class="font-mono text-xs text-muted-foreground">{{ r.replaced_at }}</td>
                  <td z-table-cell class="text-xs font-bold text-primary font-mono">{{ r.device?.internal_code || '-' }}</td>
                  <td z-table-cell class="text-xs font-medium text-foreground">
                    {{ r.device?.classroom?.code || 'Almacén' }} ({{ r.device?.classroom?.block?.code || '-' }})
                  </td>
                  <td z-table-cell>
                    <z-badge zType="outline" class="text-[10px] font-semibold">
                      {{ getItemTypeLabel(r.item_type) }}
                    </z-badge>
                  </td>
                  <td z-table-cell class="text-xs font-bold text-center text-foreground">{{ r.quantity }}</td>
                  <td z-table-cell class="text-xs font-bold text-emerald-500 font-mono">\${{ r.cost.toFixed(2) }}</td>
                  <td z-table-cell class="text-xs text-muted-foreground max-w-xs truncate">{{ r.reason }}</td>
                  <td z-table-cell class="text-xs font-medium text-foreground">{{ r.user?.name || '-' }}</td>
                  <td z-table-cell class="text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        z-button
                        zType="ghost"
                        zSize="icon-sm"
                        (click)="openReplacementDrawer(r)"
                        aria-label="Editar repuesto"
                      >
                        <ng-icon name="lucidePencil" class="text-xs" />
                      </button>
                      <button
                        type="button"
                        z-button
                        zType="ghost"
                        zSize="icon-sm"
                        (click)="deleteReplacement(r)"
                        aria-label="Eliminar repuesto"
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
export class ReplacementsPageComponent implements OnInit {
  private readonly replacementService = inject(ReplacementService);
  private readonly deviceService = inject(DeviceService);
  private readonly userService = inject(UserService);
  readonly authService = inject(AuthService);
  private readonly sheetService = inject(ZardSheetService);

  readonly canEdit = this.authService.canEdit;
  readonly canDelete = this.authService.canDelete;
  readonly isViewer = this.authService.isViewer;

  readonly viewMode = signal<ViewMode>('grid');
  readonly searchQuery = signal<string>('');
  readonly filterItemType = signal<string>('ALL');
  readonly filterDeviceId = signal<string>('ALL');

  readonly replacements = this.replacementService.replacements;
  readonly devices = this.deviceService.devices;
  readonly users = this.userService.users;
  readonly isLoading = computed(() => this.replacementService.loading());

  readonly totalCost = computed(() => this.replacements().reduce((sum, r) => sum + (Number(r.cost) || 0), 0));
  readonly totalQuantity = computed(() => this.replacements().reduce((sum, r) => sum + (Number(r.quantity) || 0), 0));
  readonly averageCost = computed(() => {
    const total = this.replacements().length;
    return total > 0 ? this.totalCost() / total : 0;
  });

  ngOnInit(): void {
    this.replacementService.fetchReplacements();
    this.deviceService.fetchDevices();
    this.userService.fetchUsers();
  }

  readonly filteredReplacements = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const typeFilter = this.filterItemType();
    const deviceFilter = this.filterDeviceId();

    return this.replacements().filter(r => {
      const matchesSearch =
        !query ||
        r.reason.toLowerCase().includes(query) ||
        (r.device && r.device.internal_code.toLowerCase().includes(query)) ||
        (r.device && r.device.brand.toLowerCase().includes(query)) ||
        (r.device && r.device.model.toLowerCase().includes(query)) ||
        (r.user && r.user.name.toLowerCase().includes(query)) ||
        (r.device?.classroom && r.device.classroom.code.toLowerCase().includes(query));

      const matchesType = typeFilter === 'ALL' || r.item_type === typeFilter;
      const matchesDevice = deviceFilter === 'ALL' || r.device_id === deviceFilter;

      return matchesSearch && matchesType && matchesDevice;
    });
  });

  openReplacementDrawer(replacement?: DeviceReplacement): void {
    this.sheetService.create({
      zContent: ReplacementDrawerComponent,
      zSide: 'right',
      zSize: 'lg',
      zWidth: 'min(500px, 95vw)',
      zHideFooter: true,
      zData: {
        replacement,
        devices: this.devices(),
        users: this.users()
      }
    });
  }

  deleteReplacement(replacement: DeviceReplacement): void {
    this.sheetService.create({
      zContent: DeleteConfirmDrawerComponent,
      zSide: 'right',
      zSize: 'default',
      zWidth: 'min(440px, 95vw)',
      zHideFooter: true,
      zData: {
        title: 'Eliminar Registro de Repuesto',
        description: '¿Estás seguro de eliminar este registro del historial de repuestos?',
        itemName: `${this.getItemTypeLabel(replacement.item_type)} - ${replacement.device?.internal_code || 'Equipo'} (\$${replacement.cost.toFixed(2)})`,
        onDelete: () => this.replacementService.deleteReplacement(replacement.id)
      }
    });
  }

  getItemTypeLabel(type: ReplacementItemType): string {
    switch (type) {
      case 'cable_hdmi':
        return 'Cable HDMI';
      case 'cable_power':
        return 'Cable de Poder';
      case 'cable_vga':
        return 'Cable VGA';
      case 'lamp_bulb':
        return 'Lámpara Proyector';
      case 'remote_control_unit':
        return 'Control Remoto';
      case 'battery_remote':
        return 'Pilas / Baterías';
      case 'other':
        return 'Otro Insumo';
      default:
        return type;
    }
  }
}
