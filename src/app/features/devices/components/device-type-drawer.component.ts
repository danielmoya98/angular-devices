import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideLayers, lucideSave, lucideX } from '@ng-icons/lucide';
import { toast } from 'ngx-sonner';

import { DeviceService } from '@/entities/device/api/device.service';
import { ZardSheetRef } from '@/shared/components/sheet';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputComponent } from '@/shared/components/input';
import { ZardFieldImports } from '@/shared/components/field/field.imports';

@Component({
  selector: 'app-device-type-drawer',
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
      lucideLayers,
      lucideSave,
      lucideX
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 flex flex-col gap-6 h-full min-h-0 bg-popover text-popover-foreground">
      
      <!-- Drawer Header -->
      <div class="flex items-center justify-between pb-4 border-b border-border/60">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <ng-icon name="lucideLayers" class="text-xl" />
          </div>
          <div>
            <h3 class="text-base font-bold text-foreground">Nuevo Tipo de Dispositivo</h3>
            <p class="text-xs text-muted-foreground">Crea una categoría para clasificar los equipos</p>
          </div>
        </div>
      </div>

      <!-- Form Inputs -->
      <form (ngSubmit)="onSubmit($event)" class="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
        
        <div z-field>
          <label z-field-label for="type-name" class="required">Nombre del Tipo</label>
          <input
            z-input
            id="type-name"
            name="name"
            [ngModel]="name()"
            (ngModelChange)="name.set($event)"
            placeholder="Ej: Proyector Multimedia, Cámara IP"
            required
          />
        </div>

        <div z-field>
          <label z-field-label for="type-code" class="required">Código Corto</label>
          <input
            z-input
            id="type-code"
            name="code"
            [ngModel]="code()"
            (ngModelChange)="code.set($event)"
            placeholder="Ej: PROY, CAM, PC"
            class="font-mono uppercase"
            required
          />
        </div>

        <div z-field>
          <label z-field-label for="type-desc">Descripción</label>
          <textarea
            z-input
            id="type-desc"
            name="description"
            [ngModel]="description()"
            (ngModelChange)="description.set($event)"
            placeholder="Especificaciones o ámbito de uso del tipo de equipo..."
            rows="3"
            class="resize-none"
          ></textarea>
        </div>

        <!-- Footer -->
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
            <span>Crear Tipo</span>
          </button>
        </div>

      </form>
    </div>
  `
})
export class DeviceTypeDrawerComponent {
  private readonly deviceService = inject(DeviceService);
  private readonly sheetRef = inject(ZardSheetRef);

  readonly name = signal<string>('');
  readonly code = signal<string>('');
  readonly description = signal<string>('');
  readonly isSubmitting = signal<boolean>(false);

  onCancel(): void {
    this.sheetRef.close();
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    const nameVal = this.name().trim();
    const codeVal = this.code().trim();

    if (!nameVal || !codeVal) {
      toast.error('Ingresa el nombre y código corto del tipo de equipo.');
      return;
    }

    this.isSubmitting.set(true);

    const created = await this.deviceService.createDeviceType({
      name: nameVal,
      code: codeVal.toUpperCase(),
      description: this.description().trim() || null
    });

    this.isSubmitting.set(false);

    if (created) {
      toast.success(`Tipo "${created.name}" creado exitosamente.`);
      this.sheetRef.close(created);
    } else {
      toast.error('Error al crear el tipo de dispositivo.');
    }
  }
}
