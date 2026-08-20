import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideBuilding,
  lucideDoorOpen,
  lucidePlus,
  lucideSearch,
  lucideFilter,
  lucideLayoutGrid,
  lucideTable,
  lucidePencil,
  lucideTrash2,
  lucideLayers,
  lucideCheckCircle2,
  lucideXCircle,
  lucideUsers,
  lucideRefreshCw
} from '@ng-icons/lucide';
import { toast } from 'ngx-sonner';

import { BlockService } from '@/entities/block/api/block.service';
import { ClassroomService } from '@/entities/classroom/api/classroom.service';
import { DeviceService } from '@/entities/device/api/device.service';
import { AuthService } from '@/core/auth/auth.service';
import { Block } from '@/entities/block/model/block.types';
import { Classroom } from '@/entities/classroom/model/classroom.types';

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

import { BlockDrawerComponent } from '@/features/blocks/components/block-drawer.component';
import { ClassroomDrawerComponent } from '@/features/classrooms/components/classroom-drawer.component';
import { DeleteConfirmDrawerComponent } from '@/features/common/delete-confirm-drawer.component';

type ActiveTab = 'blocks' | 'classrooms';
type ViewMode = 'grid' | 'table';

@Component({
  selector: 'app-blocks-classrooms-page',
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
      lucideBuilding,
      lucideDoorOpen,
      lucidePlus,
      lucideSearch,
      lucideFilter,
      lucideLayoutGrid,
      lucideTable,
      lucidePencil,
      lucideTrash2,
      lucideLayers,
      lucideCheckCircle2,
      lucideXCircle,
      lucideUsers,
      lucideRefreshCw
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-6 w-full flex-1 animate-fade-in pb-12" role="region" aria-label="Módulo de Bloques y Aulas">
      
      <!-- Module Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-2xs">
        <div class="flex items-center gap-4">
          <div class="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
            <ng-icon [name]="activeTab() === 'blocks' ? 'lucideBuilding' : 'lucideDoorOpen'" class="text-2xl" />
          </div>
          <div>
            <div class="flex items-center gap-2.5 flex-wrap">
              <h1 class="text-xl font-bold tracking-tight text-foreground">Gestión de Bloques y Aulas</h1>
              <z-badge zType="outline" class="text-xs gap-1.5 py-0.5 px-2.5 border-primary/30 bg-primary/10 text-primary font-medium">
                Infraestructura Campus
              </z-badge>
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              Administración de pabellones, laboratorios, auditorios y capacidad de aulas
            </p>
          </div>
        </div>

        @if (canEdit()) {
          <div class="flex items-center gap-3 self-start sm:self-auto flex-wrap">
            @if (activeTab() === 'blocks') {
              <button
                type="button"
                z-button
                zType="default"
                (click)="openBlockDrawer()"
                class="gap-2 shadow-2xs text-xs"
                aria-label="Crear nuevo bloque"
              >
                <ng-icon name="lucidePlus" class="text-sm" />
                <span>Nuevo Bloque</span>
              </button>
            } @else {
              <button
                type="button"
                z-button
                zType="default"
                (click)="openClassroomDrawer()"
                class="gap-2 shadow-2xs text-xs"
                aria-label="Registrar nueva aula"
              >
                <ng-icon name="lucidePlus" class="text-sm" />
                <span>Nueva Aula</span>
              </button>
            }
          </div>
        } @else {
          <z-badge zType="secondary" class="text-xs py-1.5 px-3 border border-border/60">
            Modo Consulta / Auditoría
          </z-badge>
        }
      </div>

      <!-- Module Navigation Tabs -->
      <div class="flex items-center border-b border-border/80 gap-2 overflow-x-auto" role="tablist" aria-label="Pestañas de navegación">
        <button
          type="button"
          (click)="activeTab.set('blocks')"
          [class.border-primary]="activeTab() === 'blocks'"
          [class.text-primary]="activeTab() === 'blocks'"
          [class.border-transparent]="activeTab() !== 'blocks'"
          [class.text-muted-foreground]="activeTab() !== 'blocks'"
          class="flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs transition-colors cursor-pointer"
          role="tab"
          [attr.aria-selected]="activeTab() === 'blocks'"
        >
          <ng-icon name="lucideBuilding" class="text-sm" />
          <span>Edificios y Bloques ({{ blocks().length }})</span>
        </button>

        <button
          type="button"
          (click)="activeTab.set('classrooms')"
          [class.border-primary]="activeTab() === 'classrooms'"
          [class.text-primary]="activeTab() === 'classrooms'"
          [class.border-transparent]="activeTab() !== 'classrooms'"
          [class.text-muted-foreground]="activeTab() !== 'classrooms'"
          class="flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs transition-colors cursor-pointer"
          role="tab"
          [attr.aria-selected]="activeTab() === 'classrooms'"
        >
          <ng-icon name="lucideDoorOpen" class="text-sm" />
          <span>Aulas y Laboratorios ({{ classrooms().length }})</span>
        </button>
      </div>

      <!-- Controls Toolbar -->
      <div class="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4" role="search" aria-label="Buscador de infraestructura">
        
        <div class="relative flex-1 min-w-[260px]">
          <ng-icon name="lucideSearch" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" aria-hidden="true" />
          <input
            z-input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            [placeholder]="activeTab() === 'blocks' ? 'Buscar bloque por nombre o código en tiempo real...' : 'Buscar aula por código, tipo o bloque...'"
            class="pl-9 pr-3 text-xs w-full"
            aria-label="Campo de búsqueda"
          />
        </div>

        <div class="flex items-center gap-2">
          @if (activeTab() === 'classrooms') {
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

            <select
              [ngModel]="filterFloor()"
              (ngModelChange)="filterFloor.set($event)"
              class="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label="Filtrar por piso"
            >
              <option value="ALL">Todos los Pisos</option>
              <option value="Planta Baja">Planta Baja</option>
              <option value="Piso 1">Piso 1</option>
              <option value="Piso 2">Piso 2</option>
              <option value="Piso 3">Piso 3</option>
              <option value="Piso 4">Piso 4</option>
              <option value="Piso 5">Piso 5</option>
              <option value="Subsuelo">Subsuelo</option>
            </select>
          }

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

      <!-- Main Content -->
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
      } @else if (activeTab() === 'blocks') {
        
        <!-- BLOCKS VIEW -->
        @if (filteredBlocks().length === 0) {
          <div class="py-16 flex flex-col items-center justify-center gap-3 text-center text-muted-foreground border border-dashed border-border/80 rounded-2xl p-8 bg-card">
            <div class="size-12 rounded-full bg-muted flex items-center justify-center">
              <ng-icon name="lucideBuilding" class="text-xl" />
            </div>
            <p class="text-sm font-semibold text-foreground">No se encontraron bloques</p>
            <p class="text-xs text-muted-foreground">Crea un nuevo bloque para organizar las aulas del campus.</p>
            <button z-button zType="outline" zSize="sm" (click)="openBlockDrawer()" class="mt-2 gap-2">
              <ng-icon name="lucidePlus" class="text-xs" />
              <span>Crear Primer Bloque</span>
            </button>
          </div>
        } @else if (viewMode() === 'grid') {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            @for (b of filteredBlocks(); track b.id) {
              <div z-card class="relative overflow-hidden group border border-border/80 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 ease-out hover:-translate-y-1.5 rounded-2xl bg-card flex flex-col justify-between">
                
                <!-- UNIVALLE Watermark Background -->
                <img
                  src="assets/images/univalle-logo-red.png"
                  alt="UNIVALLE"
                  class="absolute -bottom-4 -right-4 size-28 object-contain opacity-[0.04] dark:opacity-[0.07] pointer-events-none transition-all duration-300 group-hover:scale-105 group-hover:opacity-[0.10]"
                />

                <div z-card-header class="p-5 pb-3 relative z-10">
                  <div class="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
                    <div class="flex items-center gap-2.5">
                      <div class="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                        <ng-icon name="lucideBuilding" class="text-base" />
                      </div>
                      <z-badge zType="outline" class="text-xs font-bold font-mono">
                        Bloque {{ b.code }}
                      </z-badge>
                    </div>

                    <div class="flex items-center gap-1 shrink-0">
                      @if (canEdit()) {
                        <button
                          type="button"
                          z-button
                          zType="ghost"
                          zSize="icon-sm"
                          (click)="openBlockDrawer(b)"
                          title="Editar Bloque"
                          aria-label="Editar bloque"
                          class="hover:bg-primary/10 hover:text-primary"
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
                          (click)="deleteBlock(b)"
                          title="Eliminar Bloque"
                          aria-label="Eliminar bloque"
                          class="hover:bg-destructive/10"
                        >
                          <ng-icon name="lucideTrash2" class="text-xs text-destructive" />
                        </button>
                      }
                    </div>
                  </div>

                  <h3 z-card-title class="text-base font-bold text-foreground mt-3">
                    {{ b.name }}
                  </h3>
                </div>

                <div z-card-content class="px-5 pb-5 pt-0 space-y-2.5 relative z-10">
                  <p class="text-xs text-muted-foreground line-clamp-2">
                    {{ b.description || 'Sin descripción adicional' }}
                  </p>

                  <div class="pt-2.5 border-t border-border/40 flex items-center justify-between text-xs">
                    <span class="text-muted-foreground font-medium">Aulas Asignadas:</span>
                    <span class="font-bold text-foreground font-mono">{{ getBlockClassroomCount(b.id) }} aulas</span>
                  </div>

                  <div class="flex items-center justify-between text-xs">
                    <span class="text-muted-foreground font-medium">Equipos Instalados:</span>
                    <span class="font-bold text-primary font-mono">{{ getBlockDeviceCount(b.id) }} equipos</span>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-2xs">
            <table z-table class="w-full">
              <thead z-table-header class="bg-muted/40">
                <tr z-table-row>
                  <th z-table-head class="text-xs font-semibold">Código</th>
                  <th z-table-head class="text-xs font-semibold">Nombre del Edificio</th>
                  <th z-table-head class="text-xs font-semibold">Descripción</th>
                  <th z-table-head class="text-xs font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody z-table-body>
                @for (b of filteredBlocks(); track b.id) {
                  <tr z-table-row class="hover:bg-muted/30 transition-colors">
                    <td z-table-cell class="text-xs font-bold text-primary font-mono">{{ b.code }}</td>
                    <td z-table-cell class="text-xs font-bold text-foreground">{{ b.name }}</td>
                    <td z-table-cell class="text-xs text-muted-foreground max-w-xs truncate">{{ b.description || '-' }}</td>
                    <td z-table-cell class="text-right">
                      <div class="flex items-center justify-end gap-1">
                        @if (canEdit()) {
                          <button
                            type="button"
                            z-button
                            zType="ghost"
                            zSize="icon-sm"
                            (click)="openBlockDrawer(b)"
                            aria-label="Editar bloque"
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
                            (click)="deleteBlock(b)"
                            aria-label="Eliminar bloque"
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

      } @else {
        
        <!-- CLASSROOMS VIEW -->
        @if (filteredClassrooms().length === 0) {
          <div class="py-16 flex flex-col items-center justify-center gap-3 text-center text-muted-foreground border border-dashed border-border/80 rounded-2xl p-8 bg-card">
            <div class="size-12 rounded-full bg-muted flex items-center justify-center">
              <ng-icon name="lucideDoorOpen" class="text-xl" />
            </div>
            <p class="text-sm font-semibold text-foreground">No se encontraron aulas</p>
            <p class="text-xs text-muted-foreground">Registra un aula asignándola a un bloque.</p>
            <button z-button zType="outline" zSize="sm" (click)="openClassroomDrawer()" class="mt-2 gap-2">
              <ng-icon name="lucidePlus" class="text-xs" />
              <span>Registrar Primera Aula</span>
            </button>
          </div>
        } @else if (viewMode() === 'grid') {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            @for (c of filteredClassrooms(); track c.id) {
              <div z-card class="relative overflow-hidden group border border-border/80 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 ease-out hover:-translate-y-1.5 rounded-2xl bg-card flex flex-col justify-between">
                
                <!-- UNIVALLE Watermark Background -->
                <img
                  src="assets/images/univalle-logo-red.png"
                  alt="UNIVALLE"
                  class="absolute -bottom-4 -right-4 size-28 object-contain opacity-[0.04] dark:opacity-[0.07] pointer-events-none transition-all duration-300 group-hover:scale-105 group-hover:opacity-[0.10]"
                />

                <div z-card-header class="p-5 pb-3 relative z-10">
                  <div class="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
                    <div class="flex items-center gap-2">
                      <div class="size-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-2xs group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                        <ng-icon name="lucideDoorOpen" class="text-sm" />
                      </div>
                      <z-badge [zType]="c.is_active ? 'outline' : 'secondary'" class="text-[10px] font-bold">
                        @if (c.is_active) {
                          <span class="relative flex size-1.5 mr-1">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full size-1.5 bg-emerald-500"></span>
                          </span>
                        }
                        {{ c.is_active ? 'Habilitada' : 'Inactiva' }}
                      </z-badge>
                    </div>

                    <div class="flex items-center gap-1 shrink-0">
                      @if (canEdit()) {
                        <button
                          type="button"
                          z-button
                          zType="ghost"
                          zSize="icon-sm"
                          (click)="openClassroomDrawer(c)"
                          aria-label="Editar aula"
                          class="hover:bg-primary/10 hover:text-primary"
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
                          (click)="deleteClassroom(c)"
                          aria-label="Eliminar aula"
                          class="hover:bg-destructive/10"
                        >
                          <ng-icon name="lucideTrash2" class="text-xs text-destructive" />
                        </button>
                      }
                    </div>
                  </div>

                  <h3 z-card-title class="text-base font-bold text-foreground font-mono mt-3">
                    {{ c.code }}
                  </h3>
                  <p class="text-xs text-muted-foreground mt-0.5">
                    {{ c.type }}
                  </p>
                </div>

                <div z-card-content class="px-5 pb-5 pt-0 space-y-2 relative z-10">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-muted-foreground">Bloque:</span>
                    <span class="font-bold text-foreground">
                      {{ c.block?.name || 'Bloque ' + c.block?.code }}
                    </span>
                  </div>

                  <div class="flex items-center justify-between text-xs pt-1.5 border-t border-border/40">
                    <span class="text-muted-foreground">Piso / Nivel:</span>
                    <span class="font-bold text-primary font-mono">
                      {{ c.floor || 'Piso 1' }}
                    </span>
                  </div>

                  <div class="flex items-center justify-between text-xs pt-1.5 border-t border-border/40">
                    <span class="text-muted-foreground">Equipos en Aula:</span>
                    <span class="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {{ getClassroomDeviceCount(c.id) }} equipos
                    </span>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-2xs">
            <table z-table class="w-full">
              <thead z-table-header class="bg-muted/40">
                <tr z-table-row>
                  <th z-table-head class="text-xs font-semibold">Código</th>
                  <th z-table-head class="text-xs font-semibold">Bloque</th>
                  <th z-table-head class="text-xs font-semibold">Piso / Nivel</th>
                  <th z-table-head class="text-xs font-semibold">Tipo</th>
                  <th z-table-head class="text-xs font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody z-table-body>
                @for (c of filteredClassrooms(); track c.id) {
                  <tr z-table-row class="hover:bg-muted/30 transition-colors">
                    <td z-table-cell class="text-xs font-bold text-primary font-mono">{{ c.code }}</td>
                    <td z-table-cell class="text-xs font-bold text-foreground">
                      {{ c.block?.name || 'Bloque ' + c.block?.code }}
                    </td>
                    <td z-table-cell class="text-xs font-bold text-primary font-mono">{{ c.floor || 'Piso 1' }}</td>
                    <td z-table-cell class="text-xs text-muted-foreground">{{ c.type }}</td>
                    <td z-table-cell class="text-right">
                      <div class="flex items-center justify-end gap-1">
                        @if (canEdit()) {
                          <button
                            type="button"
                            z-button
                            zType="ghost"
                            zSize="icon-sm"
                            (click)="openClassroomDrawer(c)"
                            aria-label="Editar aula"
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
                            (click)="deleteClassroom(c)"
                            aria-label="Eliminar aula"
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

      }

    </div>
  `
})
export class BlocksClassroomsPageComponent implements OnInit {
  private readonly blockService = inject(BlockService);
  private readonly classroomService = inject(ClassroomService);
  private readonly deviceService = inject(DeviceService);
  readonly authService = inject(AuthService);
  private readonly sheetService = inject(ZardSheetService);

  readonly userRole = this.authService.userRole;
  readonly isAdmin = this.authService.isAdmin;
  readonly isTechSupport = this.authService.isTechSupport;
  readonly isViewer = this.authService.isViewer;
  readonly canEdit = this.authService.canEdit;
  readonly canDelete = this.authService.canDelete;

  readonly activeTab = signal<ActiveTab>('blocks');
  readonly viewMode = signal<ViewMode>('grid');
  readonly searchQuery = signal<string>('');
  readonly filterBlockId = signal<string>('ALL');
  readonly filterFloor = signal<string>('ALL');

  readonly blocks = this.blockService.blocks;
  readonly classrooms = this.classroomService.classrooms;
  readonly devices = this.deviceService.devices;

  readonly isLoading = computed(() =>
    this.blockService.loading() || this.classroomService.loading() || this.deviceService.loading()
  );

  ngOnInit(): void {
    this.blockService.fetchBlocks();
    this.classroomService.fetchClassrooms();
  }

  readonly filteredBlocks = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    return this.blocks().filter(b =>
      !query ||
      b.name.toLowerCase().includes(query) ||
      b.code.toLowerCase().includes(query) ||
      (b.description && b.description.toLowerCase().includes(query))
    );
  });

  readonly filteredClassrooms = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const blockFilter = this.filterBlockId();
    const floorFilter = this.filterFloor();

    return this.classrooms().filter(c => {
      const matchesSearch =
        !query ||
        c.code.toLowerCase().includes(query) ||
        c.type.toLowerCase().includes(query) ||
        (c.floor && c.floor.toLowerCase().includes(query)) ||
        (c.block && c.block.name.toLowerCase().includes(query));

      const matchesBlock = blockFilter === 'ALL' || c.block_id === blockFilter;
      const matchesFloor = floorFilter === 'ALL' || (c.floor || 'Piso 1') === floorFilter;

      return matchesSearch && matchesBlock && matchesFloor;
    });
  });

  getClassroomDeviceCount(classroomId: string): number {
    return this.devices().filter(d => d.classroom_id === classroomId).length;
  }

  getBlockDeviceCount(blockId: string): number {
    return this.devices().filter(d => d.classroom?.block_id === blockId).length;
  }

  getBlockClassroomCount(blockId: string): number {
    return this.classrooms().filter(c => c.block_id === blockId).length;
  }

  openBlockDrawer(block?: Block): void {
    this.sheetService.create({
      zContent: BlockDrawerComponent,
      zSide: 'right',
      zSize: 'default',
      zWidth: 'min(440px, 95vw)',
      zHideFooter: true,
      zData: { block }
    });
  }

  openClassroomDrawer(classroom?: Classroom): void {
    this.sheetService.create({
      zContent: ClassroomDrawerComponent,
      zSide: 'right',
      zSize: 'default',
      zWidth: 'min(480px, 95vw)',
      zHideFooter: true,
      zData: {
        classroom,
        blocks: this.blocks()
      }
    });
  }

  deleteBlock(block: Block): void {
    this.sheetService.create({
      zContent: DeleteConfirmDrawerComponent,
      zSide: 'right',
      zSize: 'default',
      zWidth: 'min(440px, 95vw)',
      zHideFooter: true,
      zData: {
        title: 'Eliminar Bloque',
        description: '¿Estás seguro de eliminar este bloque? También eliminará sus aulas asociadas.',
        itemName: `${block.name} (${block.code})`,
        onDelete: () => this.blockService.deleteBlock(block.id)
      }
    });
  }

  deleteClassroom(classroom: Classroom): void {
    this.sheetService.create({
      zContent: DeleteConfirmDrawerComponent,
      zSide: 'right',
      zSize: 'default',
      zWidth: 'min(440px, 95vw)',
      zHideFooter: true,
      zData: {
        title: 'Eliminar Aula',
        description: '¿Estás seguro de eliminar esta aula del sistema?',
        itemName: `${classroom.code} (${classroom.type})`,
        onDelete: () => this.classroomService.deleteClassroom(classroom.id)
      }
    });
  }
}
