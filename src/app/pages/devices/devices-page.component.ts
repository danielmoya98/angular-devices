import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideCpu,
  lucidePlus,
  lucideSearch,
  lucideFilter,
  lucideLayoutGrid,
  lucideTable,
  lucidePencil,
  lucideTrash2,
  lucideLayers,
  lucideCheckCircle2,
  lucideWrench,
  lucideAlertTriangle,
  lucideBox,
  lucideDoorOpen,
  lucideBuilding,
  lucideRefreshCw,
  lucideClock,
  lucideRadio,
  lucideTv,
  lucideMonitor
} from '@ng-icons/lucide';
import { toast } from 'ngx-sonner';

import { DeviceService } from '@/entities/device/api/device.service';
import { ClassroomService } from '@/entities/classroom/api/classroom.service';
import { AuthService } from '@/core/auth/auth.service';
import { Device, DeviceStatus } from '@/entities/device/model/device.types';

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

import { DeviceDrawerComponent } from '@/features/devices/components/device-drawer.component';
import { DeviceTypeDrawerComponent } from '@/features/devices/components/device-type-drawer.component';
import { DeleteConfirmDrawerComponent } from '@/features/common/delete-confirm-drawer.component';
import { ReplacementDrawerComponent } from '@/features/replacements/components/replacement-drawer.component';
import { UserService } from '@/entities/user/api/user.service';

type ViewMode = 'grid' | 'table';

@Component({
  selector: 'app-devices-page',
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
      lucideCpu,
      lucidePlus,
      lucideSearch,
      lucideFilter,
      lucideLayoutGrid,
      lucideTable,
      lucidePencil,
      lucideTrash2,
      lucideLayers,
      lucideCheckCircle2,
      lucideWrench,
      lucideAlertTriangle,
      lucideBox,
      lucideDoorOpen,
      lucideBuilding,
      lucideRefreshCw,
      lucideClock,
      lucideRadio,
      lucideTv,
      lucideMonitor
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-6 w-full flex-1 animate-fade-in pb-12" role="region" aria-label="Módulo de Dispositivos">
      
      <!-- Module Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-2xs">
        <div class="flex items-center gap-4">
          <div class="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
            <ng-icon name="lucideCpu" class="text-2xl" />
          </div>
          <div>
            <div class="flex items-center gap-2.5 flex-wrap">
              <h1 class="text-xl font-bold tracking-tight text-foreground">Inventario de Dispositivos</h1>
              <z-badge zType="outline" class="text-xs gap-1.5 py-0.5 px-2.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-medium">
                Hardware Campus
              </z-badge>
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              Catálogo de equipos, proyectores, computadores de aula e insumos de red
            </p>
          </div>
        </div>

        @if (canEdit()) {
          <div class="flex items-center gap-3 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              z-button
              zType="outline"
              (click)="openDeviceTypeDrawer()"
              class="gap-2 shadow-2xs text-xs"
              aria-label="Crear nuevo tipo de dispositivo"
            >
              <ng-icon name="lucideLayers" class="text-sm" />
              <span>Tipos de Equipo</span>
            </button>

            <button
              type="button"
              z-button
              zType="default"
              (click)="openDeviceDrawer()"
              class="gap-2 shadow-2xs text-xs"
              aria-label="Registrar nuevo dispositivo"
            >
              <ng-icon name="lucidePlus" class="text-sm" />
              <span>Nuevo Dispositivo</span>
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
          <div class="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ng-icon name="lucideCpu" class="text-lg" />
          </div>
          <div>
            <p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Equipos</p>
            <p class="text-lg font-bold text-foreground">{{ totalCount() }}</p>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-card border border-border/80 flex items-center gap-3.5 shadow-2xs">
          <div class="size-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <ng-icon name="lucideCheckCircle2" class="text-lg" />
          </div>
          <div>
            <p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Operativos</p>
            <p class="text-lg font-bold text-foreground">{{ operationalCount() }}</p>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-card border border-border/80 flex items-center gap-3.5 shadow-2xs">
          <div class="size-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <ng-icon name="lucideWrench" class="text-lg" />
          </div>
          <div>
            <p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Mantenimiento</p>
            <p class="text-lg font-bold text-foreground">{{ maintenanceCount() }}</p>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-card border border-border/80 flex items-center gap-3.5 shadow-2xs">
          <div class="size-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
            <ng-icon name="lucideBox" class="text-lg" />
          </div>
          <div>
            <p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">En Almacén</p>
            <p class="text-lg font-bold text-foreground">{{ storedCount() }}</p>
          </div>
        </div>

      </div>

      <!-- Controls Toolbar -->
      <div class="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4" role="search" aria-label="Filtros de búsqueda de dispositivos">
        
        <!-- Real-time Search -->
        <div class="relative flex-1 min-w-[260px]">
          <ng-icon name="lucideSearch" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" aria-hidden="true" />
          <input
            z-input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Buscar por código, marca, modelo, serie o aula..."
            class="pl-9 pr-3 text-xs w-full"
            aria-label="Buscar dispositivos por código, marca o aula"
          />
        </div>

        <!-- Filter Selects & View Toggle -->
        <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          
          <!-- Filter by Status -->
          <select
            [ngModel]="filterStatus()"
            (ngModelChange)="filterStatus.set($event)"
            class="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Filtrar por estado del dispositivo"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="operational">Operativos</option>
            <option value="under_maintenance">En Mantenimiento</option>
            <option value="damaged">Dañados</option>
            <option value="stored">En Almacén</option>
          </select>

          <!-- Filter by Classroom -->
          <select
            [ngModel]="filterClassroomId()"
            (ngModelChange)="filterClassroomId.set($event)"
            class="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring max-w-[160px] truncate"
            aria-label="Filtrar por aula de instalación"
          >
            <option value="ALL">Todas las Aulas</option>
            @for (c of classrooms(); track c.id) {
              <option [value]="c.id">{{ c.code }} ({{ c.block?.code }})</option>
            }
          </select>

          <!-- View Switcher -->
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
        <!-- Skeleton Shimmer Loaders -->
        @if (viewMode() === 'grid') {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" aria-busy="true">
            @for (i of [1,2,3,4,5,6]; track i) {
              <div z-card class="shadow-2xs border border-border/80 rounded-2xl p-5 space-y-4">
                <div class="flex items-center justify-between">
                  <z-skeleton class="h-4 w-24" />
                  <z-skeleton class="h-4 w-16" />
                </div>
                <div class="space-y-2 pt-2">
                  <z-skeleton class="h-5 w-3/4" />
                  <z-skeleton class="h-3 w-1/2" />
                </div>
                <div class="pt-3 border-t border-border/40 space-y-2">
                  <z-skeleton class="h-3 w-full" />
                  <z-skeleton class="h-3 w-2/3" />
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="rounded-2xl border border-border/80 bg-card p-4 space-y-3" aria-busy="true">
            @for (i of [1,2,3,4,5]; track i) {
              <div class="flex items-center justify-between gap-4 py-2 border-b border-border/40">
                <z-skeleton class="h-4 w-28" />
                <z-skeleton class="h-4 w-32" />
                <z-skeleton class="h-4 w-20" />
                <z-skeleton class="h-4 w-16" />
              </div>
            }
          </div>
        }
      } @else if (filteredDevices().length === 0) {
        <div class="py-16 flex flex-col items-center justify-center gap-3 text-center text-muted-foreground border border-dashed border-border/80 rounded-2xl p-8 bg-card">
          <div class="size-12 rounded-full bg-muted flex items-center justify-center">
            <ng-icon name="lucideCpu" class="text-xl" />
          </div>
          <p class="text-sm font-semibold text-foreground">No se encontraron dispositivos</p>
          <p class="text-xs text-muted-foreground">Prueba modificando la búsqueda o los filtros aplicados.</p>
          <button z-button zType="outline" zSize="sm" (click)="openDeviceDrawer()" class="mt-2 gap-2">
            <ng-icon name="lucidePlus" class="text-xs" />
            <span>Registrar Dispositivo</span>
          </button>
        </div>
      } @else if (viewMode() === 'grid') {
        <!-- Grid View Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (d of filteredDevices(); track d.id) {
            <div z-card class="relative overflow-hidden group border border-border/80 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 ease-out hover:-translate-y-1.5 rounded-2xl bg-card flex flex-col justify-between">
              
              <!-- UNIVALLE Watermark Background -->
              <img
                src="assets/images/univalle-logo-red.png"
                alt="UNIVALLE"
                class="absolute -bottom-4 -right-4 size-28 object-contain opacity-[0.04] dark:opacity-[0.07] pointer-events-none transition-all duration-300 group-hover:scale-105 group-hover:opacity-[0.10]"
              />

              <div z-card-header class="p-5 pb-3 relative z-10">
                <div class="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <z-badge [zType]="getStatusBadgeType(d.status)" class="text-[10px] uppercase font-bold flex items-center gap-1">
                    @if (d.status === 'operational') {
                      <span class="relative flex size-1.5 mr-0.5">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full size-1.5 bg-emerald-500"></span>
                      </span>
                    }
                    {{ getStatusLabel(d.status) }}
                  </z-badge>

                  <div class="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      z-button
                      zType="ghost"
                      zSize="icon-sm"
                      (click)="openReplacementForDevice(d)"
                      title="Registrar Repuesto / Mantenimiento"
                      aria-label="Registrar repuesto para dispositivo"
                      class="hover:bg-emerald-500/10"
                    >
                      <ng-icon name="lucideWrench" class="text-xs text-emerald-500" />
                    </button>

                    @if (canEdit()) {
                      <button
                        type="button"
                        z-button
                        zType="ghost"
                        zSize="icon-sm"
                        (click)="openDeviceDrawer(d)"
                        title="Editar Dispositivo"
                        aria-label="Editar dispositivo"
                        class="hover:bg-primary/10 hover:text-primary"
                      >
                        <ng-icon name="lucidePencil" class="text-xs text-muted-foreground" />
                      </button>
                    }

                    @if (canDelete()) {
                      <button
                        type="button"
                        z-button
                        zType="ghost"
                        zSize="icon-sm"
                        (click)="deleteDevice(d)"
                        title="Eliminar Dispositivo"
                        aria-label="Eliminar dispositivo"
                        class="hover:bg-destructive/10"
                      >
                        <ng-icon name="lucideTrash2" class="text-xs text-destructive" />
                      </button>
                    }
                  </div>
                </div>

                <div class="flex items-center gap-3.5 mt-3.5">
                  <div class="size-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-base shrink-0 shadow-2xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <ng-icon [name]="getDeviceIconName(d)" />
                  </div>
                  <div class="overflow-hidden">
                    <h3 z-card-title class="text-base font-bold text-foreground font-mono truncate">
                      {{ d.internal_code }}
                    </h3>
                    <p class="text-xs text-muted-foreground truncate">
                      {{ d.brand }} {{ d.model }}
                    </p>
                  </div>
                </div>
              </div>

              <div z-card-content class="px-5 pb-5 pt-0 space-y-2.5 relative z-10">
                <div class="flex items-center justify-between gap-2 text-xs">
                  <span class="text-muted-foreground shrink-0">Tipo:</span>
                  <span class="font-bold text-foreground text-right truncate">{{ d.type?.name || 'General' }}</span>
                </div>

                <div class="flex items-center justify-between gap-2 text-xs">
                  <span class="text-muted-foreground shrink-0">Ubicación / Aula:</span>
                  <span class="font-bold text-foreground text-right flex items-center gap-1 truncate">
                    <ng-icon name="lucideDoorOpen" class="text-xs text-primary shrink-0" />
                    {{ d.classroom?.code || 'En Almacén' }} ({{ d.classroom?.block?.code || '-' }})
                  </span>
                </div>

                <div class="flex items-center justify-between gap-2 text-xs">
                  <span class="text-muted-foreground shrink-0">Nº de Serie:</span>
                  <span class="font-mono text-muted-foreground text-[11px] text-right truncate max-w-[170px]">{{ d.serial_number || 'No Requiere / N/A' }}</span>
                </div>

                <div class="flex items-center justify-between gap-2 text-xs pt-1 border-t border-border/30">
                  <span class="text-muted-foreground shrink-0">Antigüedad:</span>
                  <span class="font-semibold text-foreground text-[11px] text-right truncate">{{ getDeviceInstallationAge(d) }}</span>
                </div>

                @if (getAssociatedDeviceName(d)) {
                  <div class="p-2 rounded-lg bg-primary/5 border border-primary/20 text-[11px] flex items-center justify-between">
                    <span class="text-muted-foreground flex items-center gap-1 font-semibold">
                      <ng-icon name="lucideRadio" class="text-primary text-xs" />
                      Vinculado a:
                    </span>
                    <span class="font-bold text-primary truncate max-w-[170px]">{{ getAssociatedDeviceName(d) }}</span>
                  </div>
                }

                <!-- Métricas de Horas de Uso y Proyección -->
                <div class="pt-2.5 border-t border-border/40 space-y-1.5">
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="text-muted-foreground flex items-center gap-1 font-medium">
                      <ng-icon name="lucideClock" class="text-xs text-primary" />
                      Uso: <strong class="text-foreground font-mono">{{ d.used_hours || 0 }} hrs</strong> / {{ d.lifespan_hours || 60000 }} hrs
                    </span>
                    <span
                      class="font-bold text-xs font-mono"
                      [class.text-emerald-500]="getLifePercentage(d) > 50"
                      [class.text-amber-500]="getLifePercentage(d) <= 50 && getLifePercentage(d) > 20"
                      [class.text-destructive]="getLifePercentage(d) <= 20"
                    >
                      {{ getLifePercentage(d) }}% Vida Restante ({{ getRemainingHours(d) }}h)
                    </span>
                  </div>
                  <div class="w-full bg-muted rounded-full h-2 overflow-hidden border border-border/40">
                    <div
                      class="h-full rounded-full transition-all duration-300"
                      [style.width.%]="getLifePercentage(d)"
                      [class.bg-emerald-500]="getLifePercentage(d) > 50"
                      [class.bg-amber-500]="getLifePercentage(d) <= 50 && getLifePercentage(d) > 20"
                      [class.bg-destructive]="getLifePercentage(d) <= 20"
                    ></div>
                  </div>
                </div>

                @if (d.notes) {
                  <p class="text-[11px] text-muted-foreground pt-2 border-t border-border/40 line-clamp-2">
                    {{ d.notes }}
                  </p>
                }
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
                <th z-table-head class="text-xs font-semibold">Código</th>
                <th z-table-head class="text-xs font-semibold">Marca / Modelo</th>
                <th z-table-head class="text-xs font-semibold">Tipo</th>
                <th z-table-head class="text-xs font-semibold">Aula / Bloque</th>
                <th z-table-head class="text-xs font-semibold">Horas Uso / Vida</th>
                <th z-table-head class="text-xs font-semibold">Estado</th>
                <th z-table-head class="text-xs font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody z-table-body>
              @for (d of filteredDevices(); track d.id) {
                <tr z-table-row class="hover:bg-muted/30 transition-colors">
                  <td z-table-cell class="text-xs font-bold text-primary font-mono">{{ d.internal_code }}</td>
                  <td z-table-cell class="text-xs font-medium text-foreground">{{ d.brand }} {{ d.model }}</td>
                  <td z-table-cell class="text-xs text-muted-foreground">{{ d.type?.name || '-' }}</td>
                  <td z-table-cell class="text-xs font-bold text-foreground">
                    {{ d.classroom?.code || 'Almacén' }} ({{ d.classroom?.block?.code || '-' }})
                  </td>
                  <td z-table-cell class="text-xs font-mono">
                    <div class="flex flex-col gap-0.5">
                      <span class="text-foreground font-bold">{{ d.used_hours || 0 }} / {{ d.lifespan_hours || 60000 }} hrs</span>
                      <span
                        class="text-[10px] font-semibold"
                        [class.text-emerald-500]="getLifePercentage(d) > 50"
                        [class.text-amber-500]="getLifePercentage(d) <= 50 && getLifePercentage(d) > 20"
                        [class.text-destructive]="getLifePercentage(d) <= 20"
                      >
                        {{ getLifePercentage(d) }}% Restante ({{ getRemainingHours(d) }}h)
                      </span>
                    </div>
                  </td>
                  <td z-table-cell>
                    <z-badge [zType]="getStatusBadgeType(d.status)" class="text-[10px] uppercase font-bold">
                      {{ getStatusLabel(d.status) }}
                    </z-badge>
                  </td>
                  <td z-table-cell class="text-right">
                    <div class="flex items-center justify-end gap-1">
                      @if (canEdit()) {
                        <button
                          type="button"
                          z-button
                          zType="ghost"
                          zSize="icon-sm"
                          (click)="openReplacementForDevice(d)"
                          title="Registrar Repuesto"
                          aria-label="Registrar repuesto"
                        >
                          <ng-icon name="lucideWrench" class="text-xs text-emerald-500" />
                        </button>
                        <button
                          type="button"
                          z-button
                          zType="ghost"
                          zSize="icon-sm"
                          (click)="openDeviceDrawer(d)"
                          title="Editar Dispositivo"
                          aria-label="Editar dispositivo"
                        >
                          <ng-icon name="lucidePencil" class="text-xs" />
                        </button>
                      }

                      @if (canDelete()) {
                        <button
                          type="button"
                          z-button
                          zType="ghost"
                          zSize="icon-sm"
                          (click)="deleteDevice(d)"
                          title="Eliminar Dispositivo"
                          aria-label="Eliminar dispositivo"
                        >
                          <ng-icon name="lucideTrash2" class="text-xs text-destructive" />
                        </button>
                      }

                      @if (isViewer()) {
                        <span class="text-[10px] text-muted-foreground italic px-2">Solo lectura</span>
                      }
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
export class DevicesPageComponent implements OnInit {
  private readonly deviceService = inject(DeviceService);
  private readonly classroomService = inject(ClassroomService);
  private readonly userService = inject(UserService);
  readonly authService = inject(AuthService);
  private readonly sheetService = inject(ZardSheetService);

  readonly canEdit = this.authService.canEdit;
  readonly canDelete = this.authService.canDelete;
  readonly isViewer = this.authService.isViewer;

  readonly viewMode = signal<ViewMode>(this.authService.preferredViewMode());
  readonly searchQuery = signal<string>('');
  readonly filterStatus = signal<string>('ALL');
  readonly filterClassroomId = signal<string>('ALL');

  readonly devices = this.deviceService.devices;
  readonly classrooms = this.classroomService.classrooms;
  readonly isLoading = computed(() => this.deviceService.loading());

  // Metrics
  readonly totalCount = computed(() => this.devices().length);
  readonly operationalCount = computed(() => this.devices().filter(d => d.status === 'operational').length);
  readonly maintenanceCount = computed(() => this.devices().filter(d => d.status === 'under_maintenance' || d.status === 'damaged').length);
  readonly storedCount = computed(() => this.devices().filter(d => d.status === 'stored').length);

  ngOnInit(): void {
    this.deviceService.fetchDevices();
    this.classroomService.fetchClassrooms();
    this.deviceService.fetchDeviceTypes();
    this.userService.fetchUsers();
  }

  readonly filteredDevices = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const statusFilter = this.filterStatus();
    const classroomFilter = this.filterClassroomId();

    return this.devices().filter(d => {
      const matchesSearch =
        !query ||
        d.internal_code.toLowerCase().includes(query) ||
        d.brand.toLowerCase().includes(query) ||
        d.model.toLowerCase().includes(query) ||
        (d.serial_number && d.serial_number.toLowerCase().includes(query)) ||
        (d.classroom && d.classroom.code.toLowerCase().includes(query));

      const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
      const matchesClassroom = classroomFilter === 'ALL' || d.classroom_id === classroomFilter;

      return matchesSearch && matchesStatus && matchesClassroom;
    });
  });

  openDeviceDrawer(device?: Device): void {
    this.sheetService.create({
      zContent: DeviceDrawerComponent,
      zSide: 'right',
      zSize: 'lg',
      zWidth: 'min(500px, 95vw)',
      zHideFooter: true,
      zData: {
        device,
        classrooms: this.classrooms(),
        deviceTypes: this.deviceService.deviceTypes()
      }
    });
  }

  openDeviceTypeDrawer(): void {
    this.sheetService.create({
      zContent: DeviceTypeDrawerComponent,
      zSide: 'right',
      zSize: 'default',
      zWidth: 'min(440px, 95vw)',
      zHideFooter: true
    });
  }

  openReplacementForDevice(device: Device): void {
    this.sheetService.create({
      zContent: ReplacementDrawerComponent,
      zSide: 'right',
      zSize: 'lg',
      zWidth: 'min(500px, 95vw)',
      zHideFooter: true,
      zData: {
        replacement: {
          id: '',
          device_id: device.id,
          registered_by: '',
          item_type: 'cable_hdmi',
          quantity: 1,
          cost: 15.0,
          reason: `Sustitución para dispositivo ${device.internal_code}`,
          replaced_at: new Date().toISOString().substring(0, 10)
        },
        devices: this.devices(),
        users: this.userService.users()
      }
    });
  }

  deleteDevice(device: Device): void {
    this.sheetService.create({
      zContent: DeleteConfirmDrawerComponent,
      zSide: 'right',
      zSize: 'default',
      zWidth: 'min(440px, 95vw)',
      zHideFooter: true,
      zData: {
        title: 'Eliminar Dispositivo',
        description: '¿Estás seguro de eliminar este dispositivo del inventario?',
        itemName: `${device.internal_code} - ${device.brand} ${device.model}`,
        onDelete: () => this.deviceService.deleteDevice(device.id)
      }
    });
  }

  getStatusBadgeType(status: DeviceStatus): 'default' | 'outline' | 'secondary' | 'destructive' {
    switch (status) {
      case 'operational':
        return 'outline';
      case 'under_maintenance':
        return 'secondary';
      case 'damaged':
        return 'destructive';
      case 'stored':
        return 'default';
      default:
        return 'outline';
    }
  }

  getStatusLabel(status: DeviceStatus): string {
    switch (status) {
      case 'operational':
        return 'Operativo';
      case 'under_maintenance':
        return 'Mantenimiento';
      case 'damaged':
        return 'Dañado';
      case 'stored':
        return 'En Almacén';
      default:
        return status;
    }
  }

  getRemainingHours(d: Device): number {
    const total = d.lifespan_hours ?? 60000;
    const used = d.used_hours ?? 0;
    return Math.max(0, total - used);
  }

  getLifePercentage(d: Device): number {
    const total = d.lifespan_hours ?? 60000;
    if (total <= 0) return 100;
    const remaining = this.getRemainingHours(d);
    return Math.round((remaining / total) * 100);
  }

  getAssociatedDeviceName(d: Device): string | null {
    if (!d.classroom_id) return null;
    const typeName = (d.type?.name || '').toUpperCase();
    const typeCode = (d.type?.code || '').toUpperCase();
    const isControl = typeName.includes('CONTROL') || typeCode.includes('CON');

    if (isControl) {
      const classroomDevices = this.deviceService.devices().filter(other => other.classroom_id === d.classroom_id && other.id !== d.id);
      const targetDevice = classroomDevices.find(other => {
        const tName = (other.type?.name || '').toUpperCase();
        return tName.includes('TELEVISOR') || tName.includes('TV') || tName.includes('DATA');
      });

      if (targetDevice) {
        return `${targetDevice.brand} ${targetDevice.model} (${targetDevice.internal_code})`;
      }
      return `TV/Pantalla en Aula ${d.classroom?.code || '-'}`;
    }

    return null;
  }

  getDeviceIconName(d: Device): string {
    const typeName = (d.type?.name || '').toUpperCase();
    const typeCode = (d.type?.code || '').toUpperCase();
    if (typeName.includes('CONTROL') || typeCode.includes('CON')) return 'lucideRadio';
    if (typeName.includes('TELEVISOR') || typeName.includes('TV')) return 'lucideTv';
    if (typeName.includes('DATA') || typeName.includes('DISPLAY')) return 'lucideMonitor';
    return 'lucideCpu';
  }

  getDeviceInstallationAge(d: Device): string {
    if (!d.created_at) return 'Reciente';
    const installed = new Date(d.created_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - installed.getTime()) / (1000 * 3600 * 24));
    if (diffDays < 30) return 'Reciente (< 1 mes)';
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} m. en campus`;
    const diffYears = (diffMonths / 12).toFixed(1);
    return `${diffYears} a. en campus`;
  }
}
