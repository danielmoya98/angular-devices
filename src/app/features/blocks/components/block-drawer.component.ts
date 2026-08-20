import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideBuilding, lucideSave, lucideX, lucideLayers } from '@ng-icons/lucide';
import { toast } from 'ngx-sonner';

import { BlockService } from '@/entities/block/api/block.service';
import { Block } from '@/entities/block/model/block.types';
import { ZardSheetRef, injectSheetData } from '@/shared/components/sheet';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputComponent } from '@/shared/components/input';
import { ZardFieldImports } from '@/shared/components/field/field.imports';

export interface BlockDrawerData {
  block?: Block;
}

@Component({
  selector: 'app-block-drawer',
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
      lucideBuilding,
      lucideSave,
      lucideX,
      lucideLayers
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 flex flex-col gap-6 h-full min-h-0 bg-popover text-popover-foreground">
      
      <!-- Drawer Content Header -->
      <div class="flex items-center justify-between pb-4 border-b border-border/60">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <ng-icon name="lucideBuilding" class="text-xl" />
          </div>
          <div>
            <h3 class="text-base font-bold text-foreground">
              {{ isEditing() ? 'Editar Bloque' : 'Nuevo Bloque' }}
            </h3>
            <p class="text-xs text-muted-foreground">
              {{ isEditing() ? 'Modifica la información del bloque seleccionado' : 'Registra un nuevo edificio o bloque en el campus' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Form Inputs Container -->
      <form (ngSubmit)="onSubmit($event)" class="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
        
        <!-- Nombre del Bloque -->
        <div z-field>
          <label z-field-label for="block-name" class="required">Nombre del Bloque</label>
          <input
            z-input
            id="block-name"
            name="name"
            [ngModel]="name()"
            (ngModelChange)="name.set($event)"
            placeholder="Ej: Bloque A - Facultad de Ingeniería"
            required
          />
        </div>

        <!-- Código del Bloque -->
        <div z-field>
          <label z-field-label for="block-code" class="required">Código Interno</label>
          <input
            z-input
            id="block-code"
            name="code"
            [ngModel]="code()"
            (ngModelChange)="code.set($event)"
            placeholder="Ej: BLQ-A"
            class="font-mono"
            required
          />
        </div>

        <!-- Descripción del Bloque -->
        <div z-field>
          <label z-field-label for="block-desc">Descripción</label>
          <textarea
            z-input
            id="block-desc"
            name="description"
            [ngModel]="description()"
            (ngModelChange)="description.set($event)"
            placeholder="Detalles sobre las facultades o departamentos ubicados en este bloque..."
            rows="4"
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
            <span>{{ isEditing() ? 'Guardar Cambios' : 'Crear Bloque' }}</span>
          </button>
        </div>

      </form>
    </div>
  `
})
export class BlockDrawerComponent {
  private readonly blockService = inject(BlockService);
  private readonly sheetRef = inject(ZardSheetRef);
  private readonly data = injectSheetData<BlockDrawerData>();

  readonly isEditing = signal<boolean>(!!this.data?.block);
  readonly name = signal<string>(this.data?.block?.name || '');
  readonly code = signal<string>(this.data?.block?.code || '');
  readonly description = signal<string>(this.data?.block?.description || '');
  readonly isSubmitting = signal<boolean>(false);

  onCancel(): void {
    this.sheetRef.close();
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    const nameVal = this.name().trim();
    const codeVal = this.code().trim();

    if (!nameVal || !codeVal) {
      toast.error('Por favor completa el nombre y el código del bloque.');
      return;
    }

    this.isSubmitting.set(true);

    if (this.isEditing() && this.data.block) {
      const updated = await this.blockService.updateBlock(this.data.block.id, {
        name: nameVal,
        code: codeVal,
        description: this.description().trim() || null
      });

      this.isSubmitting.set(false);

      if (updated) {
        toast.success(`Bloque "${updated.name}" actualizado exitosamente.`);
        this.sheetRef.close(updated);
      } else {
        toast.error('Error al actualizar el bloque.');
      }
    } else {
      const created = await this.blockService.createBlock({
        name: nameVal,
        code: codeVal,
        description: this.description().trim() || null
      });

      this.isSubmitting.set(false);

      if (created) {
        toast.success(`Bloque "${created.name}" creado exitosamente.`);
        this.sheetRef.close(created);
      } else {
        toast.error('Error al crear el bloque.');
      }
    }
  }
}
