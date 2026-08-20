import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideClipboardCheck,
  lucidePlus,
  lucideSearch,
  lucideFilter,
  lucideLayoutGrid,
  lucideTable,
  lucideTrash2,
  lucideUserCheck,
  lucideCheckCircle2,
  lucideClock,
  lucideAlertCircle,
  lucideCheckSquare,
  lucideDoorOpen,
  lucideRefreshCw
} from '@ng-icons/lucide';
import { toast } from 'ngx-sonner';

import { InspectionService } from '@/entities/inspection/api/inspection.service';
import { ClassroomService } from '@/entities/classroom/api/classroom.service';
import { DeviceService } from '@/entities/device/api/device.service';
import { UserService } from '@/entities/user/api/user.service';
import { AuthService } from '@/core/auth/auth.service';
import { Inspection } from '@/entities/inspection/model/inspection.types';

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

import { InspectionDrawerComponent } from '@/features/inspections/components/inspection-drawer.component';
import { ChecklistDrawerComponent } from '@/features/inspections/components/checklist-drawer.component';
import { DeleteConfirmDrawerComponent } from '@/features/common/delete-confirm-drawer.component';

type ViewMode = 'grid' | 'table';

@Component({
  selector: 'app-inspections-page',
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
      lucideClipboardCheck,
      lucidePlus,
      lucideSearch,
      lucideFilter,
      lucideLayoutGrid,
      lucideTable,
      lucideTrash2,
      lucideUserCheck,
      lucideCheckCircle2,
      lucideClock,
      lucideAlertCircle,
      lucideCheckSquare,
      lucideDoorOpen,
      lucideRefreshCw
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-6 w-full flex-1 animate-fade-in pb-12" role="region" aria-label="Módulo de Inspecciones Técnicas y Auditorías de Aulas">
      
      <!-- Module Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-2xs">
        <div class="flex items-center gap-4">
          <div class="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
            <ng-icon name="lucideClipboardCheck" class="text-2xl" />
          </div>
          <div>
            <div class="flex items-center gap-2.5 flex-wrap">
              <h1 class="text-xl font-bold tracking-tight text-foreground">Inspecciones Técnicas y Auditorías de Aulas</h1>
              <z-badge zType="outline" class="text-xs gap-1.5 py-0.5 px-2.5 border-blue-500/30 bg-blue-500/10 text-blue-500 font-medium">
                Auditorías en Vivo
              </z-badge>
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              Rondas periódicas de revisión con checklist interactivo por aula y estado operativo del hardware
            </p>
          </div>
        </div>

        @if (canEdit()) {
          <div class="flex items-center gap-3 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              z-button
              zType="default"
              (click)="openInspectionDrawer()"
              class="gap-2 shadow-2xs text-xs"
              aria-label="Programar nueva ronda de inspección"
            >
              <ng-icon name="lucidePlus" class="text-sm" />
              <span>Programar Ronda</span>
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
            <ng-icon name="lucideClipboardCheck" class="text-lg" />
          </div>
          <div>
            <p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Rondas</p>
            <p class="text-lg font-bold text-foreground">{{ inspections().length }}</p>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-card border border-border/80 flex items-center gap-3.5 shadow-2xs">
          <div class="size-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <ng-icon name="lucideCheckCircle2" class="text-lg" />
          </div>
          <div>
            <p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Operatividad Aulas</p>
            <p class="text-lg font-bold text-foreground">{{ operationalRate() }}%</p>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-card border border-border/80 flex items-center gap-3.5 shadow-2xs">
          <div class="size-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <ng-icon name="lucideClock" class="text-lg" />
          </div>
          <div>
            <p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Rondas En Curso</p>
            <p class="text-lg font-bold text-foreground">{{ inProgressCount() }}</p>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-card border border-border/80 flex items-center gap-3.5 shadow-2xs">
          <div class="size-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <ng-icon name="lucideUserCheck" class="text-lg" />
          </div>
          <div>
            <p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Completadas</p>
            <p class="text-lg font-bold text-foreground">{{ completedCount() }}</p>
          </div>
        </div>

      </div>

      <!-- Controls Toolbar -->
      <div class="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4" role="search" aria-label="Filtros de búsqueda de inspecciones">
        
        <!-- Real-time Search -->
        <div class="relative flex-1 min-w-[260px]">
          <ng-icon name="lucideSearch" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" aria-hidden="true" />
          <input
            z-input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Buscar por inspector, fecha, notas o aula auditada..."
            class="pl-9 pr-3 text-xs w-full"
            aria-label="Buscar inspección por inspector, fecha o aula"
          />
        </div>

        <!-- Filter Selects & View Toggle -->
        <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          
          <select
            [ngModel]="filterInspectorId()"
            (ngModelChange)="filterInspectorId.set($event)"
            class="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring max-w-[160px] truncate"
            aria-label="Filtrar por inspector"
          >
            <option value="ALL">Todos los Inspectores</option>
            @for (u of inspectors(); track u.id) {
              <option [value]="u.id">{{ u.name }}</option>
            }
          </select>

          <select
            [ngModel]="filterStatus()"
            (ngModelChange)="filterStatus.set($event)"
            class="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Filtrar por estado de ronda"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="IN_PROGRESS">En Curso</option>
            <option value="COMPLETED">Completadas</option>
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
              <div class="pt-2 border-t border-border/40 space-y-2">
                <z-skeleton class="h-3 w-full" />
                <z-skeleton class="h-3 w-2/3" />
              </div>
            </div>
          }
        </div>
      } @else if (filteredInspections().length === 0) {
        <div class="py-16 flex flex-col items-center justify-center gap-3 text-center text-muted-foreground border border-dashed border-border/80 rounded-2xl p-8 bg-card">
          <div class="size-12 rounded-full bg-muted flex items-center justify-center">
            <ng-icon name="lucideClipboardCheck" class="text-xl" />
          </div>
          <p class="text-sm font-semibold text-foreground">No se encontraron rondas de inspección</p>
          <p class="text-xs text-muted-foreground">Prueba modificando la búsqueda o programando una nueva ronda.</p>
          <button z-button zType="outline" zSize="sm" (click)="openInspectionDrawer()" class="mt-2 gap-2">
            <ng-icon name="lucidePlus" class="text-xs" />
            <span>Programar Nueva Ronda</span>
          </button>
        </div>
      } @else if (viewMode() === 'grid') {
        <!-- Grid View Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (i of filteredInspections(); track i.id) {
            <div z-card class="relative overflow-hidden group border border-border/80 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 ease-out hover:-translate-y-1.5 rounded-2xl bg-card flex flex-col justify-between">
              
              <!-- UNIVALLE Watermark Background -->
              <img
                src="assets/images/univalle-logo-red.png"
                alt="UNIVALLE"
                class="absolute -bottom-4 -right-4 size-28 object-contain opacity-[0.04] dark:opacity-[0.07] pointer-events-none transition-all duration-300 group-hover:scale-105 group-hover:opacity-[0.10]"
              />

              <div z-card-header class="p-5 pb-3 relative z-10">
                <div class="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <div class="flex items-center gap-2">
                    <div class="size-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 shadow-2xs group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                      <ng-icon name="lucideClipboardCheck" class="text-sm" />
                    </div>
                    <z-badge [zType]="i.completed_at ? 'outline' : 'default'" class="text-[10px] font-bold uppercase">
                      {{ i.completed_at ? 'Completada' : 'En Curso' }}
                    </z-badge>
                  </div>

                  <div class="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      z-button
                      zType="ghost"
                      zSize="icon-sm"
                      (click)="deleteInspection(i)"
                      title="Eliminar Ronda"
                      aria-label="Eliminar ronda"
                      class="hover:bg-destructive/10"
                    >
                      <ng-icon name="lucideTrash2" class="text-xs text-destructive" />
                    </button>
                  </div>
                </div>

                <div class="mt-3">
                  <h3 z-card-title class="text-base font-bold text-foreground">
                    Ronda: {{ i.scheduled_date }}
                  </h3>
                  <p class="text-xs text-muted-foreground mt-0.5">
                    Inspector: <strong class="text-foreground">{{ i.inspector?.name || 'Técnico' }}</strong>
                  </p>
                </div>
              </div>

              <div z-card-content class="px-5 pb-5 pt-0 space-y-3 relative z-10">
                <!-- Inspection Progress Meter -->
                <div class="space-y-1.5 pt-2 border-t border-border/40">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-muted-foreground font-medium">Progreso Auditoría:</span>
                    <span class="font-bold text-amber-500 font-mono">{{ getInspectionProgress(i) }}% ({{ i.classroom_inspections?.length || 0 }} aulas)</span>
                  </div>
                  <div class="w-full bg-muted rounded-full h-2 overflow-hidden border border-border/40">
                    <div
                      class="h-full bg-amber-500 rounded-full transition-all duration-500"
                      [style.width.%]="getInspectionProgress(i)"
                    ></div>
                  </div>
                </div>

                <div class="space-y-1.5">
                  @for (ci of i.classroom_inspections || []; track ci.id) {
                    <div class="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-xs">
                      <div class="flex items-center gap-1.5">
                        <ng-icon name="lucideDoorOpen" class="text-xs text-primary" />
                        <span class="font-bold font-mono text-foreground">{{ ci.classroom?.code }}</span>
                      </div>
                      <z-badge [zType]="ci.is_fully_operational ? 'outline' : 'destructive'" class="text-[9px]">
                        {{ ci.is_fully_operational ? 'OK' : 'Falla' }}
                      </z-badge>
                    </div>
                  }
                </div>

                @if (i.general_notes) {
                  <p class="text-xs text-muted-foreground italic line-clamp-2">
                    "{{ i.general_notes }}"
                  </p>
                }

                <div class="pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    z-button
                    zType="outline"
                    zSize="sm"
                    (click)="openChecklistDrawer(i)"
                    class="w-full gap-1.5 text-xs"
                    aria-label="Abrir checklist de aula"
                  >
                    <ng-icon name="lucideCheckSquare" class="text-xs" />
                    <span>Auditar Aula</span>
                  </button>

                  @if (!i.completed_at) {
                    <button
                      type="button"
                      z-button
                      zType="default"
                      zSize="sm"
                      (click)="completeInspection(i)"
                      class="shrink-0 text-xs"
                      title="Cerrar Ronda"
                      aria-label="Marcar ronda como completada"
                    >
                      <ng-icon name="lucideCheckCircle2" class="text-xs" />
                    </button>
                  }
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
                <th z-table-head class="text-xs font-semibold">Fecha Programada</th>
                <th z-table-head class="text-xs font-semibold">Inspector</th>
                <th z-table-head class="text-xs font-semibold text-center">Aulas Auditadas</th>
                <th z-table-head class="text-xs font-semibold">Estado Ronda</th>
                <th z-table-head class="text-xs font-semibold">Notas</th>
                <th z-table-head class="text-xs font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody z-table-body>
              @for (i of filteredInspections(); track i.id) {
                <tr z-table-row class="hover:bg-muted/30 transition-colors">
                  <td z-table-cell class="font-mono text-xs font-bold text-foreground">{{ i.scheduled_date }}</td>
                  <td z-table-cell class="text-xs font-medium text-foreground">{{ i.inspector?.name || '-' }}</td>
                  <td z-table-cell class="text-xs font-bold text-center text-foreground font-mono">
                    {{ i.classroom_inspections?.length || 0 }}
                  </td>
                  <td z-table-cell>
                    <z-badge [zType]="i.completed_at ? 'outline' : 'default'" class="text-[10px] font-bold uppercase">
                      {{ i.completed_at ? 'Completada' : 'En Curso' }}
                    </z-badge>
                  </td>
                  <td z-table-cell class="text-xs text-muted-foreground max-w-xs truncate">{{ i.general_notes || '-' }}</td>
                  <td z-table-cell class="text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        z-button
                        zType="outline"
                        zSize="sm"
                        (click)="openChecklistDrawer(i)"
                        class="gap-1 text-[11px]"
                        aria-label="Checklist de aula"
                      >
                        <ng-icon name="lucideCheckSquare" class="text-xs" />
                        <span>Checklist</span>
                      </button>
                      @if (!i.completed_at) {
                        <button
                          type="button"
                          z-button
                          zType="ghost"
                          zSize="icon-sm"
                          (click)="completeInspection(i)"
                          title="Cerrar Ronda"
                          aria-label="Completar ronda"
                        >
                          <ng-icon name="lucideCheckCircle2" class="text-xs text-emerald-500" />
                        </button>
                      }
                      <button
                        type="button"
                        z-button
                        zType="ghost"
                        zSize="icon-sm"
                        (click)="deleteInspection(i)"
                        title="Eliminar Ronda"
                        aria-label="Eliminar ronda"
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
export class InspectionsPageComponent implements OnInit {
  private readonly inspectionService = inject(InspectionService);
  private readonly classroomService = inject(ClassroomService);
  private readonly deviceService = inject(DeviceService);
  private readonly userService = inject(UserService);
  readonly authService = inject(AuthService);
  private readonly sheetService = inject(ZardSheetService);

  readonly canEdit = this.authService.canEdit;
  readonly canDelete = this.authService.canDelete;
  readonly isViewer = this.authService.isViewer;

  readonly viewMode = signal<ViewMode>('grid');
  readonly searchQuery = signal<string>('');
  readonly filterInspectorId = signal<string>('ALL');
  readonly filterStatus = signal<string>('ALL');

  readonly inspections = this.inspectionService.inspections;
  readonly classrooms = this.classroomService.classrooms;
  readonly devices = this.deviceService.devices;
  readonly inspectors = this.userService.users;
  readonly isLoading = computed(() => this.inspectionService.loading());

  readonly inProgressCount = computed(() => this.inspections().filter(i => !i.completed_at).length);
  readonly completedCount = computed(() => this.inspections().filter(i => !!i.completed_at).length);
  readonly operationalRate = computed(() => {
    let totalAulas = 0;
    let totalOperational = 0;

    for (const insp of this.inspections()) {
      for (const ci of insp.classroom_inspections || []) {
        totalAulas++;
        if (ci.is_fully_operational) totalOperational++;
      }
    }

    return totalAulas > 0 ? Math.round((totalOperational / totalAulas) * 100) : 100;
  });

  ngOnInit(): void {
    this.inspectionService.fetchInspections();
    this.classroomService.fetchClassrooms();
    this.deviceService.fetchDevices();
    this.userService.fetchUsers();
  }

  readonly filteredInspections = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const inspectorFilter = this.filterInspectorId();
    const statusFilter = this.filterStatus();

    return this.inspections().filter(i => {
      const matchesSearch =
        !query ||
        i.scheduled_date.includes(query) ||
        (i.inspector && i.inspector.name.toLowerCase().includes(query)) ||
        (i.general_notes && i.general_notes.toLowerCase().includes(query)) ||
        (i.classroom_inspections && i.classroom_inspections.some(ci => ci.classroom?.code.toLowerCase().includes(query)));

      const matchesInspector = inspectorFilter === 'ALL' || i.inspector_id === inspectorFilter;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'IN_PROGRESS' && !i.completed_at) ||
        (statusFilter === 'COMPLETED' && !!i.completed_at);

      return matchesSearch && matchesInspector && matchesStatus;
    });
  });

  openInspectionDrawer(): void {
    this.sheetService.create({
      zContent: InspectionDrawerComponent,
      zSide: 'right',
      zSize: 'default',
      zWidth: '450px',
      zHideFooter: true,
      zData: { inspectors: this.inspectors() }
    });
  }

  openChecklistDrawer(inspection: Inspection): void {
    this.sheetService.create({
      zContent: ChecklistDrawerComponent,
      zSide: 'right',
      zSize: 'lg',
      zWidth: 'min(580px, 95vw)',
      zHideFooter: true,
      zData: {
        inspection,
        classrooms: this.classrooms(),
        devices: this.devices()
      }
    });
  }

  async completeInspection(inspection: Inspection): Promise<void> {
    const success = await this.inspectionService.completeInspection(inspection.id);
    if (success) {
      toast.success(`Ronda del ${inspection.scheduled_date} marcada como completada.`);
    } else {
      toast.error('Error al completar la inspección.');
    }
  }

  deleteInspection(inspection: Inspection): void {
    this.sheetService.create({
      zContent: DeleteConfirmDrawerComponent,
      zSide: 'right',
      zSize: 'default',
      zWidth: 'min(440px, 95vw)',
      zHideFooter: true,
      zData: {
        title: 'Eliminar Ronda de Inspección',
        description: '¿Estás seguro de eliminar esta ronda y todas sus auditorías de aula asociadas?',
        itemName: `Ronda del ${inspection.scheduled_date} (${inspection.inspector?.name || 'Técnico'})`,
        onDelete: () => this.inspectionService.deleteInspection(inspection.id)
      }
    });
  }

  getInspectionProgress(i: Inspection): number {
    if (i.completed_at) return 100;
    const total = i.classroom_inspections?.length || 0;
    if (total === 0) return 0;
    const completedClassrooms = (i.classroom_inspections || []).filter(ci => ci.is_fully_operational !== undefined).length;
    return Math.round((completedClassrooms / total) * 100);
  }
}
