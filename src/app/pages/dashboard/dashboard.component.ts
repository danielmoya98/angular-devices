import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideBarChart3,
  lucideLayers,
  lucideLayoutGrid,
  lucideDatabase,
  lucideCheckCircle2,
  lucideCpu,
  lucideRefreshCw,
  lucideBuilding,
  lucideDollarSign,
  lucideClipboardCheck,
  lucideSearch,
  lucideFilter,
  lucideTable,
  lucidePrinter,
  lucideDoorOpen,
  lucideAlertTriangle,
  lucideWrench,
  lucidePieChart,
  lucideTrendingUp
} from '@ng-icons/lucide';
import { toast } from 'ngx-sonner';

import { BlockService } from '@/entities/block/api/block.service';
import { ClassroomService } from '@/entities/classroom/api/classroom.service';
import { DeviceService } from '@/entities/device/api/device.service';
import { InspectionService } from '@/entities/inspection/api/inspection.service';
import { ReplacementService } from '@/entities/replacement/api/replacement.service';
import { AuthService } from '@/core/auth/auth.service';

import { ZardSheetService } from '@/shared/components/sheet';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardBadgeComponent } from '@/shared/components/badge';
import { ZardInputComponent } from '@/shared/components/input';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import {
  ZardCardComponent,
  ZardCardHeaderComponent,
  ZardCardTitleComponent,
  ZardCardDescriptionComponent,
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

import {
  ExecutiveReportDrawerComponent,
  BlockAnalytics,
  BrandAnalytics
} from '@/features/dashboard/components/executive-report-drawer.component';

import { StatusDonutChartComponent } from '@/features/dashboard/components/status-donut-chart.component';
import { LifespanGaugeChartComponent } from '@/features/dashboard/components/lifespan-gauge-chart.component';
import { BlockBarChartComponent } from '@/features/dashboard/components/block-bar-chart.component';

import { DeviceDrawerComponent } from '@/features/devices/components/device-drawer.component';
import { InspectionDrawerComponent } from '@/features/inspections/components/inspection-drawer.component';
import { ReplacementDrawerComponent } from '@/features/replacements/components/replacement-drawer.component';

type ViewMode = 'grid' | 'table';

@Component({
  selector: 'app-dashboard-page',
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
    ZardCardDescriptionComponent,
    ZardCardContentComponent,
    ZardTableComponent,
    ZardTableHeaderComponent,
    ZardTableBodyComponent,
    ZardTableRowComponent,
    ZardTableHeadComponent,
    ZardTableCellComponent,
    StatusDonutChartComponent,
    LifespanGaugeChartComponent,
    BlockBarChartComponent
  ],
  viewProviders: [
    provideIcons({
      lucideBarChart3,
      lucideLayers,
      lucideLayoutGrid,
      lucideDatabase,
      lucideCheckCircle2,
      lucideCpu,
      lucideRefreshCw,
      lucideBuilding,
      lucideDollarSign,
      lucideClipboardCheck,
      lucideSearch,
      lucideFilter,
      lucideTable,
      lucidePrinter,
      lucideDoorOpen,
      lucideAlertTriangle,
      lucideWrench,
      lucidePieChart,
      lucideTrendingUp
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-6 w-full flex-1 animate-fade-in pb-12" role="region" aria-label="Dashboard Ejecutivo de Reportes y Analytics">
      
      <!-- Executive Banner Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-2xs">
        <div class="flex items-center gap-4">
          <div class="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
            <ng-icon name="lucideBarChart3" class="text-2xl" />
          </div>
          <div>
            <div class="flex items-center gap-2.5 flex-wrap">
              <h1 class="text-xl font-bold tracking-tight text-foreground">Reportes & Analytics Dashboard</h1>
              <z-badge zType="outline" class="text-xs gap-1.5 py-0.5 px-2.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-medium">
                <span class="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Métricas Ejecutivas UNIVALLE
              </z-badge>
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              Indicadores clave de rendimiento (KPIs), disponiblidad de aulas y tasa de fallas de equipos en tiempo real
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          @if (!isViewer()) {
            <button
              type="button"
              z-button
              zType="outline"
              zSize="sm"
              (click)="openInspectionDrawer()"
              class="gap-1.5 text-xs hover:border-amber-500/40"
              title="Iniciar Ronda de Inspección"
            >
              <ng-icon name="lucideClipboardCheck" class="text-xs text-amber-500" />
              <span>+ Ronda</span>
            </button>

            <button
              type="button"
              z-button
              zType="outline"
              zSize="sm"
              (click)="openDeviceDrawer()"
              class="gap-1.5 text-xs hover:border-primary/40"
              title="Registrar Dispositivo IoT"
            >
              <ng-icon name="lucideCpu" class="text-xs text-primary" />
              <span>+ Equipo</span>
            </button>

            <button
              type="button"
              z-button
              zType="outline"
              zSize="sm"
              (click)="openReplacementDrawer()"
              class="gap-1.5 text-xs hover:border-purple-500/40"
              title="Solicitar Repuesto"
            >
              <ng-icon name="lucideWrench" class="text-xs text-purple-500" />
            </button>
          }

          <button
            type="button"
            z-button
            zType="default"
            (click)="openExecutiveReportDrawer()"
            class="gap-2 shadow-2xs text-xs"
            aria-label="Generar informe ejecutivo de infraestructura"
          >
            <ng-icon name="lucidePrinter" class="text-sm" />
            <span>Informe</span>
          </button>
        </div>
      </div>

      <!-- 4 Strategic Executive KPI Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Total Devices -->
        <div class="relative overflow-hidden group p-4.5 rounded-2xl bg-card border border-border/80 flex items-center gap-3.5 shadow-2xs hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 ease-out hover:-translate-y-1">
          <img
            src="assets/images/univalle-logo-red.png"
            alt="UNIVALLE"
            class="absolute -bottom-4 -right-4 size-24 object-contain opacity-[0.05] dark:opacity-[0.08] pointer-events-none transition-all duration-500 group-hover:scale-110 group-hover:opacity-[0.14]"
          />
          <div class="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300 relative z-10">
            <ng-icon name="lucideCpu" class="text-xl" />
          </div>
          <div class="relative z-10">
            <p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Equipos</p>
            <p class="text-xl font-extrabold text-foreground font-mono mt-0.5">{{ totalDevices() }}</p>
          </div>
        </div>

        <!-- Classroom Availability % -->
        <div class="relative overflow-hidden group p-4.5 rounded-2xl bg-card border border-border/80 flex items-center gap-3.5 shadow-2xs hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 ease-out hover:-translate-y-1">
          <img
            src="assets/images/univalle-logo-red.png"
            alt="UNIVALLE"
            class="absolute -bottom-4 -right-4 size-24 object-contain opacity-[0.05] dark:opacity-[0.08] pointer-events-none transition-all duration-500 group-hover:scale-110 group-hover:opacity-[0.14]"
          />
          <div class="size-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300 relative z-10">
            <ng-icon name="lucideDoorOpen" class="text-xl" />
          </div>
          <div class="relative z-10">
            <p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Disponibilidad Aulas</p>
            <p class="text-xl font-extrabold text-foreground font-mono mt-0.5">{{ globalAvailabilityRate() }}%</p>
          </div>
        </div>

        <!-- Total Replacement Budget -->
        <div class="relative overflow-hidden group p-4.5 rounded-2xl bg-card border border-border/80 flex items-center gap-3.5 shadow-2xs hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 ease-out hover:-translate-y-1">
          <img
            src="assets/images/univalle-logo-red.png"
            alt="UNIVALLE"
            class="absolute -bottom-4 -right-4 size-24 object-contain opacity-[0.05] dark:opacity-[0.08] pointer-events-none transition-all duration-500 group-hover:scale-110 group-hover:opacity-[0.14]"
          />
          <div class="size-11 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300 relative z-10">
            <ng-icon name="lucideDollarSign" class="text-xl" />
          </div>
          <div class="relative z-10">
            <p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Inversión Repuestos</p>
            <p class="text-xl font-extrabold text-foreground font-mono mt-0.5">\${{ totalBudget().toFixed(2) }}</p>
          </div>
        </div>

        <!-- Active Inspection Rounds -->
        <div class="relative overflow-hidden group p-4.5 rounded-2xl bg-card border border-border/80 flex items-center gap-3.5 shadow-2xs hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 ease-out hover:-translate-y-1">
          <img
            src="assets/images/univalle-logo-red.png"
            alt="UNIVALLE"
            class="absolute -bottom-4 -right-4 size-24 object-contain opacity-[0.05] dark:opacity-[0.08] pointer-events-none transition-all duration-500 group-hover:scale-110 group-hover:opacity-[0.14]"
          />
          <div class="size-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300 relative z-10">
            <ng-icon name="lucideClipboardCheck" class="text-xl" />
          </div>
          <div class="relative z-10">
            <p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Rondas Activas</p>
            <p class="text-xl font-extrabold text-foreground font-mono mt-0.5">{{ activeInspections() }}</p>
          </div>
        </div>

      </div>

      <!-- Interactive Visual Analytics Grid (Donut, Gauge & Bar Charts) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Donut Chart: Device Status Distribution -->
        <div z-card class="shadow-2xs border border-border/80 lg:col-span-2">
          <div z-card-header class="pb-2">
            <div class="flex items-center justify-between">
              <h3 z-card-title class="text-sm font-bold text-foreground flex items-center gap-2">
                <ng-icon name="lucidePieChart" class="text-primary text-base" />
                Distribución de Equipos por Estado Operativo
              </h3>
              <z-badge zType="outline" class="text-[10px]">Gráfico Donut SVG</z-badge>
            </div>
            <p z-card-description class="text-xs text-muted-foreground">
              Desglose porcentual interactivo de hardware activo, en mantenimiento, dañado y en almacén
            </p>
          </div>

          <div z-card-content class="pt-2">
            <app-status-donut-chart
              [operational]="operationalCount()"
              [maintenance]="maintenanceCount()"
              [damaged]="damagedCount()"
              [stored]="storedCount()"
            ></app-status-donut-chart>
          </div>
        </div>

        <!-- Gauge Chart: Lifespan Health & Capacity -->
        <app-lifespan-gauge-chart
          [totalUsedHours]="totalUsedHours()"
          [totalLifespanCapacity]="totalLifespanCapacity()"
        ></app-lifespan-gauge-chart>

      </div>

      <!-- Bar Chart: Performance & Investment by Block -->
      <app-block-bar-chart
        [blocks]="blockAnalytics()"
      ></app-block-bar-chart>

      <!-- Section: Equipos en Mal Estado / Requieren Atención y Ubicación Exacta -->
      <div z-card class="shadow-2xs border border-destructive/30 bg-destructive/5 overflow-hidden">
        <div z-card-header class="pb-3 border-b border-border/60">
          <div class="flex items-center justify-between">
            <h3 z-card-title class="text-sm font-bold text-foreground flex items-center gap-2">
              <ng-icon name="lucideAlertTriangle" class="text-destructive text-base" />
              Equipos en Mal Estado / En Mantenimiento y su Ubicación Exacta
            </h3>
            <z-badge zType="destructive" class="text-[10px]">
              {{ damagedDevices().length }} Equipos con Reporte
            </z-badge>
          </div>
          <p z-card-description class="text-xs text-muted-foreground">
            Listado de hardware inoperativo, horas de uso acumuladas y localización en aulas y bloques del campus
          </p>
        </div>

        <div z-card-content class="pt-3">
          @if (damagedDevices().length === 0) {
            <div class="p-4 text-center text-xs text-emerald-600 font-medium">
              <ng-icon name="lucideCheckCircle2" class="inline text-sm mr-1" />
              ¡Excelente! No hay equipos reportados en mal estado o dañados actualmente en el campus.
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              @for (d of damagedDevices(); track d.id) {
                <div class="p-3.5 rounded-xl border border-border/80 bg-card space-y-2 shadow-2xs">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-primary font-mono">{{ d.internal_code }}</span>
                    <z-badge [zType]="d.status === 'damaged' ? 'destructive' : 'secondary'" class="text-[9px] uppercase font-bold">
                      {{ d.status === 'damaged' ? 'Dañado' : 'Mantenimiento' }}
                    </z-badge>
                  </div>

                  <div>
                    <p class="text-xs font-bold text-foreground">{{ d.brand }} {{ d.model }}</p>
                    <p class="text-[11px] text-muted-foreground">Tipo: {{ d.type?.name || 'General' }}</p>
                  </div>

                  <div class="pt-2 border-t border-border/40 text-[11px] flex items-center justify-between">
                    <span class="text-muted-foreground font-medium flex items-center gap-1">
                      <ng-icon name="lucideDoorOpen" class="text-xs text-primary" />
                      {{ d.classroom?.code || 'En Almacén' }} (Bloque {{ d.classroom?.block?.code || '-' }})
                    </span>
                    <span class="font-mono text-muted-foreground font-semibold">
                      {{ d.used_hours || 0 }} / {{ d.lifespan_hours || 60000 }}h
                    </span>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Controls Toolbar -->
      <div class="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4" role="search" aria-label="Filtros del dashboard de aulas">
        
        <!-- Real-time Search -->
        <div class="relative flex-1 min-w-[260px]">
          <ng-icon name="lucideSearch" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" aria-hidden="true" />
          <input
            z-input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Buscar por bloque, aula, marca, código de equipo o notas..."
            class="pl-9 pr-3 text-xs w-full"
            aria-label="Buscar aula o equipo"
          />
        </div>

        <!-- Filter Selects & View Toggle -->
        <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          
          <select
            [ngModel]="filterBlockId()"
            (ngModelChange)="filterBlockId.set($event)"
            class="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Filtrar por bloque"
          >
            <option value="ALL">Todos los Bloques</option>
            @for (b of blocks(); track b.id) {
              <option [value]="b.id">{{ b.name }} ({{ b.code }})</option>
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
                <z-skeleton class="h-4 w-24" />
                <z-skeleton class="h-4 w-12" />
              </div>
              <z-skeleton class="h-5 w-3/4" />
              <z-skeleton class="h-3 w-full" />
            </div>
          }
        </div>
      } @else if (filteredClassrooms().length === 0) {
        <div class="py-16 flex flex-col items-center justify-center gap-3 text-center text-muted-foreground border border-dashed border-border/80 rounded-2xl p-8 bg-card">
          <div class="size-12 rounded-full bg-muted flex items-center justify-center">
            <ng-icon name="lucideBarChart3" class="text-xl" />
          </div>
          <p class="text-sm font-semibold text-foreground">No se encontraron aulas para el filtro seleccionado</p>
          <p class="text-xs text-muted-foreground">Ajusta los términos de búsqueda o selecciona otro bloque.</p>
        </div>
      } @else if (viewMode() === 'grid') {
        <!-- Grid View Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (c of filteredClassrooms(); track c.id) {
            <div z-card class="shadow-2xs border border-border/80 hover:border-primary/40 hover:shadow-md transition-all duration-200 rounded-2xl flex flex-col justify-between overflow-hidden">
              
              <div z-card-header class="pb-3">
                <div class="flex items-center justify-between gap-2">
                  <z-badge [zType]="c.is_active ? 'outline' : 'secondary'" class="text-[10px]">
                    {{ c.is_active ? 'Aula Habilitada' : 'Inactiva' }}
                  </z-badge>

                  <span class="text-xs font-bold text-foreground font-mono">
                    {{ c.type }}
                  </span>
                </div>

                <div class="flex items-center gap-3 mt-3">
                  <div class="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                    <ng-icon name="lucideDoorOpen" class="text-lg" />
                  </div>
                  <div>
                    <h3 z-card-title class="text-base font-bold text-foreground">
                      {{ c.code }}
                    </h3>
                    <p class="text-xs text-muted-foreground mt-0.5">
                      {{ c.type }}
                    </p>
                  </div>
                </div>
              </div>

              <div z-card-content class="pt-0 space-y-2">
                <div class="pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                  <span class="text-muted-foreground">Bloque / Edificio:</span>
                  <span class="font-bold text-foreground">
                    Bloque {{ c.block?.code || '-' }} ({{ c.block?.name }})
                  </span>
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
                <th z-table-head class="text-xs font-semibold">Aula</th>
                <th z-table-head class="text-xs font-semibold">Bloque</th>
                <th z-table-head class="text-xs font-semibold">Tipo</th>
                <th z-table-head class="text-xs font-semibold text-right">Estado</th>
              </tr>
            </thead>
            <tbody z-table-body>
              @for (c of filteredClassrooms(); track c.id) {
                <tr z-table-row class="hover:bg-muted/30 transition-colors">
                  <td z-table-cell class="text-xs font-bold text-primary font-mono">{{ c.code }}</td>
                  <td z-table-cell class="text-xs font-medium text-foreground">
                    Bloque {{ c.block?.code }} ({{ c.block?.name }})
                  </td>
                  <td z-table-cell class="text-xs text-muted-foreground">{{ c.type }}</td>
                  <td z-table-cell class="text-right">
                    <z-badge [zType]="c.is_active ? 'outline' : 'secondary'" class="text-[10px]">
                      {{ c.is_active ? 'Habilitada' : 'Inactiva' }}
                    </z-badge>
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
export class DashboardPageComponent implements OnInit {
  private readonly blockService = inject(BlockService);
  private readonly classroomService = inject(ClassroomService);
  private readonly deviceService = inject(DeviceService);
  private readonly inspectionService = inject(InspectionService);
  private readonly replacementService = inject(ReplacementService);
  readonly authService = inject(AuthService);
  private readonly sheetService = inject(ZardSheetService);

  readonly userRole = this.authService.userRole;
  readonly isAdmin = this.authService.isAdmin;
  readonly isTechSupport = this.authService.isTechSupport;
  readonly isViewer = this.authService.isViewer;

  readonly viewMode = signal<ViewMode>('grid');
  readonly searchQuery = signal<string>('');
  readonly filterBlockId = signal<string>('ALL');

  readonly blocks = this.blockService.blocks;
  readonly classrooms = this.classroomService.classrooms;
  readonly devices = this.deviceService.devices;
  readonly inspections = this.inspectionService.inspections;
  readonly replacements = this.replacementService.replacements;

  readonly isLoading = computed(() =>
    this.blockService.loading() ||
    this.classroomService.loading() ||
    this.deviceService.loading()
  );

  readonly totalDevices = computed(() => this.devices().length);
  readonly totalBudget = computed(() => this.replacements().reduce((sum, r) => sum + (Number(r.cost) || 0), 0));
  readonly activeInspections = computed(() => this.inspections().filter(i => !i.completed_at).length);

  readonly operationalCount = computed(() => this.devices().filter(d => d.status === 'operational').length);
  readonly maintenanceCount = computed(() => this.devices().filter(d => d.status === 'under_maintenance').length);
  readonly damagedCount = computed(() => this.devices().filter(d => d.status === 'damaged').length);
  readonly storedCount = computed(() => this.devices().filter(d => d.status === 'stored').length);

  readonly totalUsedHours = computed(() => this.devices().reduce((acc, d) => acc + (d.used_hours || 0), 0));
  readonly totalLifespanCapacity = computed(() => this.devices().reduce((acc, d) => acc + (d.lifespan_hours || 60000), 0));

  readonly damagedDevices = computed(() =>
    this.devices().filter(d => d.status === 'damaged' || d.status === 'under_maintenance')
  );

  readonly globalAvailabilityRate = computed(() => {
    let total = 0;
    let operational = 0;

    for (const insp of this.inspections()) {
      for (const ci of insp.classroom_inspections || []) {
        total++;
        if (ci.is_fully_operational) operational++;
      }
    }

    return total > 0 ? Math.round((operational / total) * 100) : 100;
  });

  readonly blockAnalytics = computed<BlockAnalytics[]>(() => {
    const list: BlockAnalytics[] = [];

    for (const b of this.blocks()) {
      const blockClassrooms = this.classrooms().filter(c => c.block_id === b.id);
      const totalClassrooms = blockClassrooms.length;

      let operationalClassrooms = totalClassrooms;
      let totalCost = 0;

      for (const r of this.replacements()) {
        if (r.device?.classroom?.block_id === b.id) {
          totalCost += Number(r.cost) || 0;
        }
      }

      const availabilityRate = totalClassrooms > 0 ? Math.round((operationalClassrooms / totalClassrooms) * 100) : 100;

      list.push({
        id: b.id,
        name: b.name,
        code: b.code,
        totalClassrooms,
        operationalClassrooms,
        availabilityRate,
        totalMaintenanceCost: totalCost
      });
    }

    return list;
  });

  readonly brandAnalytics = computed<BrandAnalytics[]>(() => {
    const brandsMap = new Map<string, { total: number; operational: number; maintenance: number }>();

    for (const d of this.devices()) {
      const brandName = d.brand || 'Genérico';
      const current = brandsMap.get(brandName) || { total: 0, operational: 0, maintenance: 0 };

      current.total++;
      if (d.status === 'under_maintenance' || d.status === 'damaged') {
        current.maintenance++;
      } else {
        current.operational++;
      }

      brandsMap.set(brandName, current);
    }

    const result: BrandAnalytics[] = [];
    brandsMap.forEach((val, key) => {
      const failureRate = val.total > 0 ? Math.round((val.maintenance / val.total) * 100) : 0;
      result.push({
        brand: key,
        totalDevices: val.total,
        operational: val.operational,
        underMaintenance: val.maintenance,
        failureRate
      });
    });

    return result;
  });

  ngOnInit(): void {
    this.blockService.fetchBlocks();
    this.classroomService.fetchClassrooms();
    this.deviceService.fetchDevices();
    this.inspectionService.fetchInspections();
    this.replacementService.fetchReplacements();
  }

  readonly filteredClassrooms = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const blockFilter = this.filterBlockId();

    return this.classrooms().filter(c => {
      const matchesSearch =
        !query ||
        c.code.toLowerCase().includes(query) ||
        c.type.toLowerCase().includes(query) ||
        (c.block && c.block.name.toLowerCase().includes(query)) ||
        (c.block && c.block.code.toLowerCase().includes(query));

      const matchesBlock = blockFilter === 'ALL' || c.block_id === blockFilter;

      return matchesSearch && matchesBlock;
    });
  });

  openExecutiveReportDrawer(): void {
    this.sheetService.create({
      zContent: ExecutiveReportDrawerComponent,
      zSide: 'right',
      zSize: 'lg',
      zWidth: 'min(720px, 94vw)',
      zHideFooter: true,
      zData: {
        totalDevices: this.totalDevices(),
        availabilityRate: this.globalAvailabilityRate(),
        totalBudget: this.totalBudget(),
        activeInspections: this.activeInspections(),
        blockAnalytics: this.blockAnalytics(),
        brandAnalytics: this.brandAnalytics()
      }
    });
  }

  openDeviceDrawer(): void {
    this.sheetService.create({
      zContent: DeviceDrawerComponent,
      zSide: 'right',
      zSize: 'default',
      zWidth: 'min(480px, 95vw)',
      zHideFooter: true,
      zData: {
        deviceTypes: [],
        classrooms: this.classrooms()
      }
    });
  }

  openInspectionDrawer(): void {
    this.sheetService.create({
      zContent: InspectionDrawerComponent,
      zSide: 'right',
      zSize: 'default',
      zWidth: 'min(480px, 95vw)',
      zHideFooter: true,
      zData: {}
    });
  }

  openReplacementDrawer(): void {
    this.sheetService.create({
      zContent: ReplacementDrawerComponent,
      zSide: 'right',
      zSize: 'default',
      zWidth: 'min(480px, 95vw)',
      zHideFooter: true,
      zData: {}
    });
  }
}
