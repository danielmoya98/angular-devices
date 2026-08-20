import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideCheckSquare,
  lucideSave,
  lucideX,
  lucideCheckCircle2,
  lucideAlertTriangle,
  lucidePower,
  lucideTv,
  lucidePlug,
  lucideRadio,
  lucideClock,
  lucideBattery,
  lucideBatteryCharging,
  lucideSun,
  lucideSliders,
  lucideMonitor
} from '@ng-icons/lucide';
import { toast } from 'ngx-sonner';

import { InspectionService } from '@/entities/inspection/api/inspection.service';
import { Inspection, CheckResult } from '@/entities/inspection/model/inspection.types';
import { Classroom } from '@/entities/classroom/model/classroom.types';
import { Device } from '@/entities/device/model/device.types';

import { ZardSheetRef, injectSheetData } from '@/shared/components/sheet';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardBadgeComponent } from '@/shared/components/badge';
import { ZardInputComponent } from '@/shared/components/input';
import { ZardFieldImports } from '@/shared/components/field/field.imports';

export interface ChecklistDrawerData {
  inspection: Inspection;
  classrooms: Classroom[];
  devices: Device[];
}

export type DeviceCategory = 'control' | 'tv' | 'projector' | 'general';
export type PowerSupplyType = 'pilas_aaa' | 'pilas_aa' | 'carga_solar' | 'bateria_recargable';
export type BatteryStatusType = 'optimo' | 'media' | 'requiere_cambio';

interface DeviceCheckState {
  device_id: string;
  internal_code: string;
  brand: string;
  model: string;
  category: DeviceCategory;
  used_hours: number;
  lifespan_hours: number;
  overall_status: CheckResult;
  observations: string;

  // Common
  powers_on: boolean;

  // TV / Display specific
  has_power_cable: boolean;
  has_hdmi_vga_cable: boolean;
  has_remote_control: boolean;
  screen_panel_ok: boolean;

  // Control specific
  power_supply: PowerSupplyType;
  battery_status: BatteryStatusType;
  ir_working: boolean;
  housing_ok: boolean;

  // Projector specific
  projection_focus_ok: boolean;
  air_filter_clean: boolean;
}

@Component({
  selector: 'app-checklist-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIconComponent,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardInputComponent,
    ZardFieldImports
  ],
  viewProviders: [
    provideIcons({
      lucideCheckSquare,
      lucideSave,
      lucideX,
      lucideCheckCircle2,
      lucideAlertTriangle,
      lucidePower,
      lucideTv,
      lucidePlug,
      lucideRadio,
      lucideClock,
      lucideBattery,
      lucideBatteryCharging,
      lucideSun,
      lucideSliders,
      lucideMonitor
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col justify-between overflow-hidden bg-popover text-popover-foreground max-h-screen">
      
      <!-- Drawer Header (Fixed top) -->
      <div class="p-5 pb-4 border-b border-border/60 shrink-0 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <ng-icon name="lucideCheckSquare" class="text-xl" />
          </div>
          <div>
            <h3 class="text-base font-bold text-foreground">Auditoría y Checklist de Aula</h3>
            <p class="text-xs text-muted-foreground">
              Ronda del {{ inspection.scheduled_date }} - Inspector: {{ inspection.inspector?.name }}
            </p>
          </div>
        </div>

        <button
          type="button"
          z-button
          zType="ghost"
          zSize="icon-sm"
          (click)="onCancel()"
          aria-label="Cerrar modal"
          class="shrink-0"
        >
          <ng-icon name="lucideX" class="text-base" />
        </button>
      </div>

      <!-- Form & Checklist Body -->
      <form (ngSubmit)="onSubmit($event)" class="flex-1 flex flex-col min-h-0 overflow-hidden">
        
        <!-- Scrollable Content Area -->
        <div class="flex-1 overflow-y-auto p-5 space-y-5 min-h-0">
          
          <!-- Selección de Aula -->
          <div z-field>
            <label z-field-label for="chk-classroom" class="required">Aula A Auditar</label>
            <select
              id="chk-classroom"
              name="classroomId"
              [ngModel]="selectedClassroomId()"
              (ngModelChange)="onClassroomChange($event)"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring font-medium"
              required
            >
              <option value="" disabled>Selecciona aula...</option>
              @for (c of classrooms; track c.id) {
                <option [value]="c.id">
                  {{ c.code }} - {{ c.type }} (Bloque {{ c.block?.code || '-' }})
                </option>
              }
            </select>
          </div>

          <!-- Notas del Aula -->
          <div z-field>
            <label z-field-label for="chk-notes">Observaciones del Aula</label>
            <input
              z-input
              id="chk-notes"
              name="notes"
              [ngModel]="classroomNotes()"
              (ngModelChange)="classroomNotes.set($event)"
              placeholder="Ej: Tomas de corriente en buen estado. Proyector calibrado."
            />
          </div>

          <!-- Devices Checklist Container -->
          <div class="space-y-3 pt-2">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Checklist Dinámico de Equipos ({{ deviceChecks().length }})
              </h4>
              <z-badge [zType]="isOperational() ? 'outline' : 'destructive'" class="text-[10px]">
                {{ isOperational() ? 'Aula 100% Funcional' : 'Aula con Observaciones' }}
              </z-badge>
            </div>

            @if (deviceChecks().length === 0) {
              <div class="p-6 text-center border border-dashed border-border/80 rounded-xl bg-muted/30">
                <p class="text-xs text-muted-foreground">
                  No hay dispositivos registrados en esta aula o selecciona un aula arriba.
                </p>
              </div>
            } @else {
              @for (item of deviceChecks(); track item.device_id; let idx = $index) {
                <div class="p-4 rounded-xl border border-border/80 bg-card space-y-3 shadow-2xs relative overflow-hidden">
                  
                  <!-- Item Card Header -->
                  <div class="flex items-center justify-between border-b border-border/40 pb-2.5">
                    <div class="flex items-center gap-2">
                      <div class="size-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        @if (item.category === 'control') {
                          <ng-icon name="lucideRadio" class="text-sm" />
                        } @else if (item.category === 'tv') {
                          <ng-icon name="lucideTv" class="text-sm" />
                        } @else if (item.category === 'projector') {
                          <ng-icon name="lucideMonitor" class="text-sm" />
                        } @else {
                          <ng-icon name="lucideTv" class="text-sm" />
                        }
                      </div>

                      <div class="flex flex-col">
                        <div class="flex items-center gap-1.5">
                          <span class="text-xs font-bold text-foreground font-mono">{{ item.internal_code }}</span>
                          <z-badge zType="outline" class="text-[9px] py-0 px-1.5 uppercase font-mono font-bold">
                            {{ item.category === 'control' ? 'Control Remoto' : (item.category === 'tv' ? 'Televisor / Pantalla' : (item.category === 'projector' ? 'Proyector' : 'Dispositivo')) }}
                          </z-badge>
                        </div>
                        <span class="text-[11px] text-muted-foreground">{{ item.brand }} {{ item.model }}</span>
                      </div>
                    </div>

                    <select
                      [ngModel]="item.overall_status"
                      (ngModelChange)="updateDeviceStatus(idx, $event)"
                      name="status-{{idx}}"
                      class="rounded-md border border-input bg-background px-2 py-1 text-[11px] font-medium focus:outline-none"
                    >
                      <option value="ok">Estado: Óptimo (OK)</option>
                      <option value="warning">Estado: Observaciones (Warning)</option>
                      <option value="failed">Estado: Falla Grave (Failed)</option>
                      <option value="missing">Estado: Faltante (Missing)</option>
                    </select>
                  </div>

                  <!-- CATEGORY 1: CONTROL REMOTO CHECKLIST -->
                  @if (item.category === 'control') {
                    <div class="space-y-2.5">
                      
                      <!-- Selectors Grid for Power & Battery -->
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        
                        <div class="space-y-1">
                          <label class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tipo de Alimentación</label>
                          <select
                            [ngModel]="item.power_supply"
                            (ngModelChange)="updateDeviceProp(idx, 'power_supply', $event)"
                            name="pwr-supply-{{idx}}"
                            class="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-medium focus:outline-none"
                          >
                            <option value="pilas_aaa">Pilas AAA</option>
                            <option value="pilas_aa">Pilas AA</option>
                            <option value="carga_solar">Carga Solar / USB-C</option>
                            <option value="bateria_recargable">Batería Recargable</option>
                          </select>
                        </div>

                        <div class="space-y-1">
                          <label class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Estado de Carga / Batería</label>
                          <select
                            [ngModel]="item.battery_status"
                            (ngModelChange)="updateDeviceProp(idx, 'battery_status', $event)"
                            name="bat-stat-{{idx}}"
                            class="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-medium focus:outline-none"
                            [class.border-destructive]="item.battery_status === 'requiere_cambio'"
                          >
                            <option value="optimo">🔋 Óptimo (Carga 100%)</option>
                            <option value="media">🔋 Carga Media (50%)</option>
                            <option value="requiere_cambio">🪫 Requiere Cambio / Carga</option>
                          </select>
                        </div>

                      </div>

                      <!-- Control Checkboxes -->
                      <div class="grid grid-cols-2 gap-2 text-xs">
                        
                        <label class="flex items-center gap-2 p-2 rounded-lg bg-muted/40 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            [checked]="item.ir_working"
                            [attr.aria-checked]="item.ir_working"
                            (change)="updateDeviceProp(idx, 'ir_working', $any($event.target).checked)"
                            class="size-4 rounded text-primary"
                          />
                          <span class="text-foreground font-medium">Emisor IR / BT Funcional</span>
                        </label>

                        <label class="flex items-center gap-2 p-2 rounded-lg bg-muted/40 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            [checked]="item.housing_ok"
                            [attr.aria-checked]="item.housing_ok"
                            (change)="updateDeviceProp(idx, 'housing_ok', $any($event.target).checked)"
                            class="size-4 rounded text-primary"
                          />
                          <span class="text-foreground font-medium">Tapa & Carcasa Intactas</span>
                        </label>

                      </div>

                    </div>
                  }

                  <!-- CATEGORY 2: TELEVISOR / DISPLAY CHECKLIST -->
                  @else if (item.category === 'tv') {
                    <div class="space-y-2.5">
                      
                      <div class="grid grid-cols-2 gap-2 text-xs">
                        
                        <label class="flex items-center gap-2 p-2 rounded-lg bg-muted/40 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            [checked]="item.powers_on"
                            [attr.aria-checked]="item.powers_on"
                            (change)="updateDeviceProp(idx, 'powers_on', $any($event.target).checked)"
                            class="size-4 rounded text-primary"
                          />
                          <span class="text-foreground font-medium">Enciende (Imagen & Audio)</span>
                        </label>

                        <label class="flex items-center gap-2 p-2 rounded-lg bg-muted/40 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            [checked]="item.has_power_cable"
                            [attr.aria-checked]="item.has_power_cable"
                            (change)="updateDeviceProp(idx, 'has_power_cable', $any($event.target).checked)"
                            class="size-4 rounded text-primary"
                          />
                          <span class="text-foreground font-medium">Cable de Poder</span>
                        </label>

                        <label class="flex items-center gap-2 p-2 rounded-lg bg-muted/40 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            [checked]="item.has_hdmi_vga_cable"
                            [attr.aria-checked]="item.has_hdmi_vga_cable"
                            (change)="updateDeviceProp(idx, 'has_hdmi_vga_cable', $any($event.target).checked)"
                            class="size-4 rounded text-primary"
                          />
                          <span class="text-foreground font-medium">Cable HDMI / Adaptador</span>
                        </label>

                        <label class="flex items-center gap-2 p-2 rounded-lg bg-muted/40 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            [checked]="item.screen_panel_ok"
                            [attr.aria-checked]="item.screen_panel_ok"
                            (change)="updateDeviceProp(idx, 'screen_panel_ok', $any($event.target).checked)"
                            class="size-4 rounded text-primary"
                          />
                          <span class="text-foreground font-medium">Panel / Pantalla Limpio</span>
                        </label>

                      </div>

                      <!-- Horas de Uso leídas en TV -->
                      <div class="p-2.5 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between gap-3 text-xs">
                        <div class="flex items-center gap-1.5 shrink-0">
                          <ng-icon name="lucideClock" class="text-primary text-sm" />
                          <span class="font-bold text-foreground">Horas de Uso (Menú de TV):</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <input
                            z-input
                            type="number"
                            [ngModel]="item.used_hours"
                            (ngModelChange)="updateDeviceProp(idx, 'used_hours', $event)"
                            name="used-hours-{{idx}}"
                            placeholder="0"
                            class="font-mono text-xs w-28 bg-background h-8"
                          />
                          <span class="text-[11px] text-muted-foreground font-mono">/ {{ item.lifespan_hours }} hrs</span>
                        </div>
                      </div>

                    </div>
                  }

                  <!-- CATEGORY 3: PROYECTOR / DATA DISPLAY CHECKLIST -->
                  @else if (item.category === 'projector') {
                    <div class="space-y-2.5">
                      
                      <div class="grid grid-cols-2 gap-2 text-xs">
                        
                        <label class="flex items-center gap-2 p-2 rounded-lg bg-muted/40 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            [checked]="item.powers_on"
                            [attr.aria-checked]="item.powers_on"
                            (change)="updateDeviceProp(idx, 'powers_on', $any($event.target).checked)"
                            class="size-4 rounded text-primary"
                          />
                          <span class="text-foreground font-medium">Enciende & Proyecta</span>
                        </label>

                        <label class="flex items-center gap-2 p-2 rounded-lg bg-muted/40 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            [checked]="item.projection_focus_ok"
                            [attr.aria-checked]="item.projection_focus_ok"
                            (change)="updateDeviceProp(idx, 'projection_focus_ok', $any($event.target).checked)"
                            class="size-4 rounded text-primary"
                          />
                          <span class="text-foreground font-medium">Enfoque & Brillo Lente</span>
                        </label>

                        <label class="flex items-center gap-2 p-2 rounded-lg bg-muted/40 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            [checked]="item.air_filter_clean"
                            [attr.aria-checked]="item.air_filter_clean"
                            (change)="updateDeviceProp(idx, 'air_filter_clean', $any($event.target).checked)"
                            class="size-4 rounded text-primary"
                          />
                          <span class="text-foreground font-medium">Filtro Aire Limpio</span>
                        </label>

                        <label class="flex items-center gap-2 p-2 rounded-lg bg-muted/40 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            [checked]="item.has_hdmi_vga_cable"
                            [attr.aria-checked]="item.has_hdmi_vga_cable"
                            (change)="updateDeviceProp(idx, 'has_hdmi_vga_cable', $any($event.target).checked)"
                            class="size-4 rounded text-primary"
                          />
                          <span class="text-foreground font-medium">Cables VGA / HDMI</span>
                        </label>

                      </div>

                      <!-- Horas de Lámpara -->
                      <div class="p-2.5 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between gap-3 text-xs">
                        <div class="flex items-center gap-1.5 shrink-0">
                          <ng-icon name="lucideClock" class="text-primary text-sm" />
                          <span class="font-bold text-foreground">Horas de Lámpara Usadas:</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <input
                            z-input
                            type="number"
                            [ngModel]="item.used_hours"
                            (ngModelChange)="updateDeviceProp(idx, 'used_hours', $event)"
                            name="used-hours-proj-{{idx}}"
                            placeholder="0"
                            class="font-mono text-xs w-28 bg-background h-8"
                          />
                          <span class="text-[11px] text-muted-foreground font-mono">/ {{ item.lifespan_hours }} hrs</span>
                        </div>
                      </div>

                    </div>
                  }

                  <!-- CATEGORY 4: GENERAL / OTROS -->
                  @else {
                    <div class="grid grid-cols-2 gap-2 text-xs">
                      <label class="flex items-center gap-2 p-2 rounded-lg bg-muted/40 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          [checked]="item.powers_on"
                          [attr.aria-checked]="item.powers_on"
                          (change)="updateDeviceProp(idx, 'powers_on', $any($event.target).checked)"
                          class="size-4 rounded text-primary"
                        />
                        <span class="text-foreground font-medium">Enciende Correctamente</span>
                      </label>

                      <label class="flex items-center gap-2 p-2 rounded-lg bg-muted/40 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          [checked]="item.has_power_cable"
                          [attr.aria-checked]="item.has_power_cable"
                          (change)="updateDeviceProp(idx, 'has_power_cable', $any($event.target).checked)"
                          class="size-4 rounded text-primary"
                        />
                        <span class="text-foreground font-medium">Cable de Poder</span>
                      </label>
                    </div>
                  }

                  <!-- Observaciones del Equipo -->
                  <input
                    z-input
                    placeholder="Observaciones de este equipo..."
                    [ngModel]="item.observations"
                    (ngModelChange)="updateDeviceProp(idx, 'observations', $event)"
                    name="obs-{{idx}}"
                    class="text-xs mt-2"
                  />

                </div>
              }
            }
          </div>

        </div>

        <!-- Actions Sticky Footer (Fixed bottom) -->
        <div class="p-4 border-t border-border/60 bg-muted/40 backdrop-blur shrink-0 flex items-center justify-end gap-3">
          <button
            type="button"
            z-button
            zType="outline"
            (click)="onCancel()"
          >
            Cancelar
          </button>
          <button
            type="submit"
            z-button
            zType="default"
            [zLoading]="isSubmitting()"
            class="gap-2"
          >
            <ng-icon name="lucideSave" class="text-sm" />
            <span>Guardar Checklist</span>
          </button>
        </div>

      </form>
    </div>
  `
})
export class ChecklistDrawerComponent {
  private readonly inspectionService = inject(InspectionService);
  private readonly sheetRef = inject(ZardSheetRef);
  private readonly data = injectSheetData<ChecklistDrawerData>();

  readonly inspection = this.data.inspection;
  readonly classrooms = this.data.classrooms || [];
  readonly allDevices = this.data.devices || [];

  readonly selectedClassroomId = signal<string>(this.classrooms[0]?.id || '');
  readonly classroomNotes = signal<string>('');
  readonly deviceChecks = signal<DeviceCheckState[]>([]);
  readonly isSubmitting = signal<boolean>(false);

  readonly isOperational = computed(() => {
    const checks = this.deviceChecks();
    if (checks.length === 0) return true;
    return checks.every(c => {
      if (c.overall_status !== 'ok') return false;
      if (c.category === 'control') {
        return c.ir_working && c.housing_ok && c.battery_status !== 'requiere_cambio';
      }
      if (c.category === 'tv') {
        return c.powers_on && c.has_power_cable && c.has_hdmi_vga_cable && c.screen_panel_ok;
      }
      if (c.category === 'projector') {
        return c.powers_on && c.projection_focus_ok && c.air_filter_clean;
      }
      return c.powers_on && c.has_power_cable;
    });
  });

  constructor() {
    if (this.selectedClassroomId()) {
      this.onClassroomChange(this.selectedClassroomId());
    }
  }

  private getDeviceCategory(d: Device): DeviceCategory {
    const typeName = (d.type?.name || '').toLowerCase();
    const typeCode = (d.type?.code || '').toLowerCase();

    if (typeName.includes('control') || typeCode.includes('con')) {
      return 'control';
    }
    if (typeName.includes('televisor') || typeName.includes('tv')) {
      return 'tv';
    }
    if (typeName.includes('proyector') || typeName.includes('data') || typeName.includes('display')) {
      return 'projector';
    }
    return 'general';
  }

  onClassroomChange(classroomId: string): void {
    this.selectedClassroomId.set(classroomId);

    // Filter devices belonging to this classroom
    const classroomDevices = this.allDevices.filter(d => d.classroom_id === classroomId);

    const checkStates: DeviceCheckState[] = classroomDevices.map(d => {
      const cat = this.getDeviceCategory(d);
      return {
        device_id: d.id,
        internal_code: d.internal_code,
        brand: d.brand,
        model: d.model,
        category: cat,
        used_hours: d.used_hours ?? 0,
        lifespan_hours: d.lifespan_hours ?? 60000,
        powers_on: true,
        overall_status: 'ok',
        observations: '',
        has_power_cable: true,
        has_hdmi_vga_cable: true,
        has_remote_control: true,
        screen_panel_ok: true,
        power_supply: 'pilas_aaa',
        battery_status: 'optimo',
        ir_working: true,
        housing_ok: true,
        projection_focus_ok: true,
        air_filter_clean: true
      };
    });

    this.deviceChecks.set(checkStates);
  }

  updateDeviceProp(index: number, key: keyof DeviceCheckState, value: any): void {
    this.deviceChecks.update(current => {
      const updated = [...current];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  }

  updateDeviceStatus(index: number, status: CheckResult): void {
    this.updateDeviceProp(index, 'overall_status', status);
  }

  onCancel(): void {
    this.sheetRef.close();
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    const cid = this.selectedClassroomId();
    if (!cid) {
      toast.error('Por favor selecciona un aula para auditar.');
      return;
    }

    this.isSubmitting.set(true);

    const checksPayload = this.deviceChecks().map(c => {
      let catObservations = c.observations;

      if (c.category === 'control') {
        const pwrLabel = c.power_supply === 'carga_solar' ? 'Carga Solar/USB-C' : (c.power_supply === 'pilas_aa' ? 'Pilas AA' : 'Pilas AAA');
        const batLabel = c.battery_status === 'optimo' ? '🔋 Carga 100%' : (c.battery_status === 'media' ? '🔋 Carga Media 50%' : '🪫 Requiere Cambio');
        catObservations = `[CONTROL: ${pwrLabel} | ${batLabel} | IR: ${c.ir_working ? 'OK' : 'Falla'} | Carcasa: ${c.housing_ok ? 'OK' : 'Daño'}] ${c.observations}`.trim();
      }

      return {
        device_id: c.device_id,
        used_hours: Number(c.used_hours) || 0,
        powers_on: c.category === 'control' ? c.ir_working : c.powers_on,
        has_power_cable: c.category === 'control' ? false : c.has_power_cable,
        has_hdmi_vga_cable: c.category === 'control' ? false : c.has_hdmi_vga_cable,
        has_remote_control: c.has_remote_control,
        overall_status: c.overall_status,
        observations: catObservations
      };
    });

    const success = await this.inspectionService.saveClassroomChecklist(
      {
        inspection_id: this.inspection.id,
        classroom_id: cid,
        is_fully_operational: this.isOperational(),
        notes: this.classroomNotes()
      },
      checksPayload
    );

    this.isSubmitting.set(false);

    if (success) {
      toast.success('Checklist del aula guardado exitosamente.');
      this.sheetRef.close(true);
    } else {
      toast.error('Error al guardar el checklist.');
    }
  }
}
