import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideCpu, lucideSave, lucideX, lucideLayers, lucideRadio } from '@ng-icons/lucide';
import { toast } from 'ngx-sonner';

import { DeviceService } from '@/entities/device/api/device.service';
import { Device, DeviceType, DeviceStatus } from '@/entities/device/model/device.types';
import { Classroom } from '@/entities/classroom/model/classroom.types';
import { ZardSheetRef, injectSheetData } from '@/shared/components/sheet';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputComponent } from '@/shared/components/input';
import { ZardFieldImports } from '@/shared/components/field/field.imports';

export interface DeviceDrawerData {
  device?: Device;
  deviceTypes: DeviceType[];
  classrooms: Classroom[];
}

@Component({
  selector: 'app-device-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIconComponent,
    ZardButtonComponent,
    ZardInputComponent,
    ZardFieldImports
  ],
  viewProviders: [
    provideIcons({
      lucideCpu,
      lucideSave,
      lucideX,
      lucideLayers,
      lucideRadio
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 flex flex-col gap-6 h-full min-h-0 bg-popover text-popover-foreground">
      
      <!-- Drawer Content Header -->
      <div class="flex items-center justify-between pb-4 border-b border-border/60">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <ng-icon name="lucideCpu" class="text-xl" />
          </div>
          <div>
            <h3 class="text-base font-bold text-foreground">
              {{ isEditing() ? 'Editar Dispositivo' : 'Nuevo Dispositivo' }}
            </h3>
            <p class="text-xs text-muted-foreground">
              {{ isEditing() ? 'Modifica los datos del equipo seleccionado' : 'Registra un nuevo equipo de hardware en el campus' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Form Inputs Container -->
      <form (ngSubmit)="onSubmit($event)" class="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
        
        <!-- Código Interno -->
        <div z-field>
          <label z-field-label for="device-code" class="required">Código Interno</label>
          <input
            z-input
            id="device-code"
            name="internal_code"
            [ngModel]="internalCode()"
            (ngModelChange)="internalCode.set($event)"
            placeholder="Ej: DEV-PROY-001, EQ-PC-102"
            class="font-mono"
            required
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Tipo de Dispositivo -->
          <div z-field>
            <label z-field-label for="device-type" class="required">Tipo de Equipo</label>
            <select
              id="device-type"
              name="type_id"
              [ngModel]="typeId()"
              (ngModelChange)="onTypeChange($event)"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            >
              <option value="" disabled>Selecciona tipo...</option>
              @for (t of deviceTypes; track t.id) {
                <option [value]="t.id">{{ t.name }}</option>
              }
            </select>
          </div>

          <!-- Ubicación (Aula) -->
          <div z-field>
            <label z-field-label for="device-classroom">Aula / Ubicación</label>
            <select
              id="device-classroom"
              name="classroom_id"
              [ngModel]="classroomId()"
              (ngModelChange)="onClassroomChange($event)"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Sin Asignar / En Almacén</option>
              @for (c of classrooms; track c.id) {
                <option [value]="c.id">{{ c.code }} ({{ c.block?.name || 'Sin Bloque' }})</option>
              }
            </select>
          </div>
        </div>

        @if (isControl()) {
          <div class="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-3 text-xs text-foreground">
            <ng-icon name="lucideRadio" class="text-primary text-lg shrink-0 mt-0.5" />
            <div>
              <p class="font-bold text-primary">Dispositivo de Tipo Control Remoto</p>
              <p class="text-[11px] text-muted-foreground mt-0.5">
                No requiere número de serie ni modelo específico. En la interfaz se asociará automáticamente al Televisor o Data Display ubicado en esta misma aula.
              </p>
            </div>
          </div>
        }

        <div class="grid grid-cols-2 gap-4">
          <!-- Marca -->
          <div z-field>
            <label z-field-label for="device-brand" [class.required]="!isControl()">
              Marca {{ isControl() ? '(Opcional / Auto)' : '' }}
            </label>
            <input
              z-input
              id="device-brand"
              name="brand"
              [ngModel]="brand()"
              (ngModelChange)="brand.set($event)"
              [placeholder]="isControl() ? 'Ej: Universal / Marca TV' : 'Ej: Epson, Dell, Cisco'"
              [required]="!isControl()"
            />
          </div>

          <!-- Modelo -->
          <div z-field>
            <label z-field-label for="device-model" [class.required]="!isControl()">
              Modelo {{ isControl() ? '(Opcional)' : '' }}
            </label>
            <input
              z-input
              id="device-model"
              name="model"
              [ngModel]="model()"
              (ngModelChange)="model.set($event)"
              [placeholder]="isControl() ? 'Control Remoto' : 'Ej: PowerLite 118'"
              [required]="!isControl()"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Número de Serie -->
          <div z-field>
            <label z-field-label for="device-serial">
              Nº de Serie {{ isControl() ? '(No Requerido)' : '' }}
            </label>
            <input
              z-input
              id="device-serial"
              name="serial_number"
              [ngModel]="serialNumber()"
              (ngModelChange)="serialNumber.set($event)"
              [placeholder]="isControl() ? 'No requiere número de serie' : 'Ej: SN-98213-X'"
              class="font-mono text-xs"
            />
          </div>

          <!-- Estado -->
          <div z-field>
            <label z-field-label for="device-status" class="required">Estado del Equipo</label>
            <select
              id="device-status"
              name="status"
              [ngModel]="status()"
              (ngModelChange)="status.set($event)"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            >
              <option value="operational">Operativo</option>
              <option value="under_maintenance">En Mantenimiento</option>
              <option value="damaged">Dañado / Inoperativo</option>
              <option value="missing_accessories">Accesorios Faltantes</option>
              <option value="stored">En Almacén</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Horas de Vida Útil -->
          <div z-field>
            <label z-field-label for="device-lifespan" class="required">Vida Útil (Horas)</label>
            <input
              z-input
              type="number"
              id="device-lifespan"
              name="lifespan_hours"
              [ngModel]="lifespanHours()"
              (ngModelChange)="lifespanHours.set($event)"
              placeholder="Ej: 60000"
              class="font-mono"
              required
            />
            <span class="text-[10px] text-muted-foreground mt-0.5 block">Por defecto 60,000 hrs para Televisores</span>
          </div>

          <!-- Horas Utilizadas -->
          <div z-field>
            <label z-field-label for="device-used" class="required">Horas Utilizadas</label>
            <input
              z-input
              type="number"
              id="device-used"
              name="used_hours"
              [ngModel]="usedHours()"
              (ngModelChange)="usedHours.set($event)"
              placeholder="Ej: 0"
              class="font-mono"
              required
            />
            <span class="text-[10px] text-muted-foreground mt-0.5 block">Horas de uso registradas</span>
          </div>
        </div>

        <!-- Fecha de Instalación -->
        <div z-field>
          <label z-field-label for="device-date">Fecha de Instalación</label>
          <input
            z-input
            type="date"
            id="device-date"
            name="installation_date"
            [ngModel]="installationDate()"
            (ngModelChange)="installationDate.set($event)"
          />
        </div>

        <!-- Notas / Observaciones -->
        <div z-field>
          <label z-field-label for="device-notes">Notas Técnicas</label>
          <textarea
            z-input
            id="device-notes"
            name="notes"
            [ngModel]="notes()"
            (ngModelChange)="notes.set($event)"
            placeholder="Observaciones de garantía, soportes o características especiales..."
            rows="3"
            class="resize-none"
          ></textarea>
        </div>

        <!-- Form Actions Footer -->
        <div class="mt-auto pt-6 border-t border-border/60 flex items-center justify-end gap-3">
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
            <span>{{ isEditing() ? 'Guardar Cambios' : 'Crear Dispositivo' }}</span>
          </button>
        </div>

      </form>
    </div>
  `
})
export class DeviceDrawerComponent {
  private readonly deviceService = inject(DeviceService);
  private readonly sheetRef = inject(ZardSheetRef);
  private readonly data = injectSheetData<DeviceDrawerData>();

  readonly deviceTypes = this.data?.deviceTypes || [];
  readonly classrooms = this.data?.classrooms || [];
  readonly isEditing = signal<boolean>(!!this.data?.device);

  readonly internalCode = signal<string>(this.data?.device?.internal_code || '');
  readonly typeId = signal<string>(this.data?.device?.type_id || (this.deviceTypes[0]?.id || ''));
  readonly classroomId = signal<string>(this.data?.device?.classroom_id || '');
  readonly brand = signal<string>(this.data?.device?.brand || '');
  readonly model = signal<string>(this.data?.device?.model || '');
  readonly serialNumber = signal<string>(this.data?.device?.serial_number || '');
  readonly status = signal<DeviceStatus>(this.data?.device?.status || 'operational');
  readonly lifespanHours = signal<number>(this.data?.device?.lifespan_hours ?? 60000);
  readonly usedHours = signal<number>(this.data?.device?.used_hours ?? 0);
  readonly installationDate = signal<string>(
    this.data?.device?.installation_date || new Date().toISOString().substring(0, 10)
  );
  readonly notes = signal<string>(this.data?.device?.notes || '');
  readonly isSubmitting = signal<boolean>(false);

  readonly selectedType = computed(() => this.deviceTypes.find(t => t.id === this.typeId()));

  readonly isControl = computed(() => {
    const t = this.selectedType();
    if (!t) return false;
    const name = (t.name || '').toUpperCase();
    const code = (t.code || '').toUpperCase();
    return name.includes('CONTROL') || code.includes('CON');
  });

  onTypeChange(newTypeId: string): void {
    this.typeId.set(newTypeId);
    const selectedType = this.deviceTypes.find(t => t.id === newTypeId);
    const typeName = (selectedType?.name || '').toUpperCase();
    const typeCode = (selectedType?.code || '').toUpperCase();

    if (!this.isEditing()) {
      if (typeName.includes('TELEVISOR') || typeName.includes('TV') || typeCode === 'TV') {
        this.lifespanHours.set(60000);
      }
      if (typeName.includes('CONTROL') || typeCode.includes('CON')) {
        if (!this.model()) this.model.set('Control Remoto IR');
        if (!this.brand()) this.brand.set('Universal');
      }
    }
  }

  onClassroomChange(newClassroomId: string): void {
    this.classroomId.set(newClassroomId);
    if (!this.isEditing() && this.isControl() && newClassroomId) {
      // Find matching TV/Data display in the classroom to inherit brand
      const classroomDevices = this.deviceService.devices().filter(d => d.classroom_id === newClassroomId);
      const tvOrData = classroomDevices.find(d => {
        const tName = (d.type?.name || '').toUpperCase();
        return tName.includes('TELEVISOR') || tName.includes('TV') || tName.includes('DATA');
      });
      if (tvOrData && tvOrData.brand) {
        this.brand.set(tvOrData.brand);
      }
    }
  }

  onCancel(): void {
    this.sheetRef.close();
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    const codeVal = this.internalCode().trim();
    const typeIdVal = this.typeId();
    let brandVal = this.brand().trim();
    let modelVal = this.model().trim();

    if (this.isControl()) {
      if (!codeVal || !typeIdVal) {
        toast.error('Por favor completa el código interno y selecciona el tipo.');
        return;
      }
      if (!brandVal) brandVal = 'Universal';
      if (!modelVal) modelVal = 'Control Remoto';
    } else {
      if (!codeVal || !typeIdVal || !brandVal || !modelVal) {
        toast.error('Por favor completa el código interno, tipo, marca y modelo.');
        return;
      }
    }

    this.isSubmitting.set(true);

    const dto = {
      internal_code: codeVal,
      type_id: typeIdVal,
      classroom_id: this.classroomId() || null,
      brand: brandVal,
      model: modelVal,
      serial_number: this.serialNumber().trim() || null,
      status: this.status(),
      lifespan_hours: Number(this.lifespanHours()) || 60000,
      used_hours: Number(this.usedHours()) || 0,
      installation_date: this.installationDate() || null,
      notes: this.notes().trim() || null
    };

    if (this.isEditing() && this.data.device) {
      const updated = await this.deviceService.updateDevice(this.data.device.id, dto);
      this.isSubmitting.set(false);

      if (updated) {
        toast.success(`Dispositivo "${updated.internal_code}" actualizado exitosamente.`);
        this.sheetRef.close(updated);
      } else {
        toast.error('Error al actualizar el dispositivo.');
      }
    } else {
      const created = await this.deviceService.createDevice(dto);
      this.isSubmitting.set(false);

      if (created) {
        toast.success(`Dispositivo "${created.internal_code}" creado exitosamente.`);
        this.sheetRef.close(created);
      } else {
        toast.error('Error al crear el dispositivo.');
      }
    }
  }
}
