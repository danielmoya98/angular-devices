import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideWrench, lucideSave, lucideX, lucideDollarSign } from '@ng-icons/lucide';
import { toast } from 'ngx-sonner';

import { ReplacementService } from '@/entities/replacement/api/replacement.service';
import { DeviceReplacement, ReplacementItemType } from '@/entities/replacement/model/replacement.types';
import { Device } from '@/entities/device/model/device.types';
import { User } from '@/entities/user/model/user.types';

import { ZardSheetRef, injectSheetData } from '@/shared/components/sheet';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputComponent } from '@/shared/components/input';
import { ZardFieldImports } from '@/shared/components/field/field.imports';

export interface ReplacementDrawerData {
  replacement?: DeviceReplacement;
  devices: Device[];
  users: User[];
}

@Component({
  selector: 'app-replacement-drawer',
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
      lucideWrench,
      lucideSave,
      lucideX,
      lucideDollarSign
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 flex flex-col gap-6 h-full min-h-0 bg-popover text-popover-foreground">
      
      <!-- Drawer Header -->
      <div class="flex items-center justify-between pb-4 border-b border-border/60">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <ng-icon name="lucideWrench" class="text-xl" />
          </div>
          <div>
            <h3 class="text-base font-bold text-foreground">
              {{ isEditing() ? 'Editar Registro de Repuesto' : 'Nuevo Repuesto / Insumo' }}
            </h3>
            <p class="text-xs text-muted-foreground">
              {{ isEditing() ? 'Modifica los datos del cambio de pieza' : 'Registra la sustitución de un componente de hardware' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Form Inputs -->
      <form (ngSubmit)="onSubmit($event)" class="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
        
        <!-- Dispositivo Afectado -->
        <div z-field>
          <label z-field-label for="rep-device" class="required">Dispositivo Destino</label>
          <select
            id="rep-device"
            name="deviceId"
            [ngModel]="deviceId()"
            (ngModelChange)="deviceId.set($event)"
            class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          >
            <option value="" disabled>Selecciona dispositivo...</option>
            @for (d of devices; track d.id) {
              <option [value]="d.id">
                {{ d.internal_code }} - {{ d.brand }} {{ d.model }} ({{ d.classroom?.code || 'En Almacén' }})
              </option>
            }
          </select>
        </div>

        <!-- Tipo de Insumo / Repuesto -->
        <div z-field>
          <label z-field-label for="rep-item-type" class="required">Tipo de Insumo o Pieza</label>
          <select
            id="rep-item-type"
            name="itemType"
            [ngModel]="itemType()"
            (ngModelChange)="itemType.set($event)"
            class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          >
            <option value="cable_hdmi">Cable HDMI / Video Digital</option>
            <option value="cable_power">Cable de Alimentación Eléctrica</option>
            <option value="cable_vga">Cable VGA / Video Análogo</option>
            <option value="lamp_bulb">Lámpara / Bulb de Proyector</option>
            <option value="remote_control_unit">Control Remoto de Equipo</option>
            <option value="battery_remote">Pilas / Baterías para Control</option>
            <option value="other">Otro Insumo / Repuesto General</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Cantidad -->
          <div z-field>
            <label z-field-label for="rep-qty" class="required">Cantidad</label>
            <input
              z-input
              type="number"
              id="rep-qty"
              name="quantity"
              [ngModel]="quantity()"
              (ngModelChange)="quantity.set($event)"
              min="1"
              max="100"
              required
            />
          </div>

          <!-- Costo Unitario ($) -->
          <div z-field>
            <label z-field-label for="rep-cost" class="required">Costo Total ($)</label>
            <input
              z-input
              type="number"
              step="0.01"
              id="rep-cost"
              name="cost"
              [ngModel]="cost()"
              (ngModelChange)="cost.set($event)"
              min="0"
              required
            />
          </div>
        </div>

        <!-- Técnico / Usuario que Registra -->
        <div z-field>
          <label z-field-label for="rep-user" class="required">Técnico Responsable</label>
          <select
            id="rep-user"
            name="registeredBy"
            [ngModel]="registeredBy()"
            (ngModelChange)="registeredBy.set($event)"
            class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          >
            <option value="" disabled>Selecciona técnico...</option>
            @for (u of users; track u.id) {
              <option [value]="u.id">{{ u.name }} ({{ u.email }})</option>
            }
          </select>
        </div>

        <!-- Fecha de Cambio -->
        <div z-field>
          <label z-field-label for="rep-date" class="required">Fecha de Sustitución</label>
          <input
            z-input
            type="date"
            id="rep-date"
            name="replacedAt"
            [ngModel]="replacedAt()"
            (ngModelChange)="replacedAt.set($event)"
            required
          />
        </div>

        <!-- Motivo / Diagnóstico -->
        <div z-field>
          <label z-field-label for="rep-reason" class="required">Motivo de Sustitución</label>
          <textarea
            z-input
            id="rep-reason"
            name="reason"
            [ngModel]="reason()"
            (ngModelChange)="reason.set($event)"
            placeholder="Describe el motivo de la falla o justificación de la sustitución..."
            rows="3"
            class="resize-none"
            required
          ></textarea>
        </div>

        <!-- Actions Footer -->
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
            <span>{{ isEditing() ? 'Guardar Cambios' : 'Registrar Repuesto' }}</span>
          </button>
        </div>

      </form>
    </div>
  `
})
export class ReplacementDrawerComponent {
  private readonly replacementService = inject(ReplacementService);
  private readonly sheetRef = inject(ZardSheetRef);
  private readonly data = injectSheetData<ReplacementDrawerData>();

  readonly devices = this.data?.devices || [];
  readonly users = this.data?.users || [];
  readonly isEditing = signal<boolean>(!!this.data?.replacement);

  readonly deviceId = signal<string>(this.data?.replacement?.device_id || (this.devices[0]?.id || ''));
  readonly registeredBy = signal<string>(this.data?.replacement?.registered_by || (this.users[0]?.id || ''));
  readonly itemType = signal<ReplacementItemType>(this.data?.replacement?.item_type || 'cable_hdmi');
  readonly quantity = signal<number>(this.data?.replacement?.quantity ?? 1);
  readonly cost = signal<number>(this.data?.replacement?.cost ?? 15.00);
  readonly replacedAt = signal<string>(
    this.data?.replacement?.replaced_at || new Date().toISOString().substring(0, 10)
  );
  readonly reason = signal<string>(this.data?.replacement?.reason || '');
  readonly isSubmitting = signal<boolean>(false);

  onCancel(): void {
    this.sheetRef.close();
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    const devId = this.deviceId();
    const userId = this.registeredBy();
    const reasonVal = this.reason().trim();

    if (!devId || !userId || !reasonVal) {
      toast.error('Por favor completa el dispositivo, técnico responsable y el motivo.');
      return;
    }

    this.isSubmitting.set(true);

    const dto = {
      device_id: devId,
      registered_by: userId,
      item_type: this.itemType(),
      quantity: Number(this.quantity()),
      cost: Number(this.cost()),
      reason: reasonVal,
      replaced_at: this.replacedAt()
    };

    if (this.isEditing() && this.data.replacement) {
      const updated = await this.replacementService.updateReplacement(this.data.replacement.id, dto);
      this.isSubmitting.set(false);

      if (updated) {
        toast.success(`Registro de repuesto actualizado exitosamente.`);
        this.sheetRef.close(updated);
      } else {
        toast.error('Error al actualizar el registro.');
      }
    } else {
      const created = await this.replacementService.createReplacement(dto);
      this.isSubmitting.set(false);

      if (created) {
        toast.success(`Sustitución de insumo registrada exitosamente.`);
        this.sheetRef.close(created);
      } else {
        toast.error('Error al registrar la sustitución.');
      }
    }
  }
}
