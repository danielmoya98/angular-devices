import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideDoorOpen, lucideSave, lucideX, lucideLayers } from '@ng-icons/lucide';
import { toast } from 'ngx-sonner';

import { ClassroomService } from '@/entities/classroom/api/classroom.service';
import { Classroom } from '@/entities/classroom/model/classroom.types';
import { Block } from '@/entities/block/model/block.types';
import { ZardSheetRef, injectSheetData } from '@/shared/components/sheet';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputComponent } from '@/shared/components/input';
import { ZardFieldImports } from '@/shared/components/field/field.imports';

export interface ClassroomDrawerData {
  classroom?: Classroom;
  blocks: Block[];
}

@Component({
  selector: 'app-classroom-drawer',
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
      lucideDoorOpen,
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
            <ng-icon name="lucideDoorOpen" class="text-xl" />
          </div>
          <div>
            <h3 class="text-base font-bold text-foreground">
              {{ isEditing() ? 'Editar Aula' : 'Nueva Aula' }}
            </h3>
            <p class="text-xs text-muted-foreground">
              {{ isEditing() ? 'Modifica la información del aula seleccionada' : 'Registra una nueva aula o laboratorio en un bloque' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Form Inputs Container -->
      <form (ngSubmit)="onSubmit($event)" class="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
        
        <!-- Código del Aula -->
        <div z-field>
          <label z-field-label for="classroom-code" class="required">Código del Aula</label>
          <input
            z-input
            id="classroom-code"
            name="code"
            [ngModel]="code()"
            (ngModelChange)="code.set($event)"
            placeholder="Ej: AULA-101, LAB-202"
            class="font-mono"
            required
          />
        </div>

        <!-- Bloque Perteneciente -->
        <div z-field>
          <label z-field-label for="classroom-block" class="required">Bloque o Edificio</label>
          <select
            id="classroom-block"
            name="blockId"
            [ngModel]="blockId()"
            (ngModelChange)="blockId.set($event)"
            class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            required
          >
            <option value="" disabled>Selecciona un bloque...</option>
            @for (b of blocks; track b.id) {
              <option [value]="b.id">{{ b.name }} ({{ b.code }})</option>
            }
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Tipo de Aula -->
          <div z-field>
            <label z-field-label for="classroom-type">Tipo de Espacio</label>
            <select
              id="classroom-type"
              name="type"
              [ngModel]="type()"
              (ngModelChange)="type.set($event)"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="Aula Teórica">Aula Teórica</option>
              <option value="Laboratorio">Laboratorio</option>
              <option value="Taller">Taller</option>
              <option value="Auditorio">Auditorio</option>
              <option value="Sala de Cómputo">Sala de Cómputo</option>
            </select>
          </div>

          <!-- Piso / Nivel -->
          <div z-field>
            <label z-field-label for="classroom-floor">Piso / Nivel</label>
            <select
              id="classroom-floor"
              name="floor"
              [ngModel]="floor()"
              (ngModelChange)="floor.set($event)"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="Planta Baja">Planta Baja</option>
              <option value="Piso 1">Piso 1</option>
              <option value="Piso 2">Piso 2</option>
              <option value="Piso 3">Piso 3</option>
              <option value="Piso 4">Piso 4</option>
              <option value="Piso 5">Piso 5</option>
              <option value="Subsuelo">Subsuelo</option>
            </select>
          </div>
        </div>

        <!-- Estado Activo -->
        <div class="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="classroom-active"
            [checked]="isActive()"
            (change)="isActive.set($any($event.target).checked)"
            class="size-4 rounded border-input text-primary focus:ring-primary"
          />
          <label for="classroom-active" class="text-sm font-medium text-foreground cursor-pointer select-none">
            Aula Habilitada / Activa
          </label>
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
            <span>{{ isEditing() ? 'Guardar Cambios' : 'Crear Aula' }}</span>
          </button>
        </div>

      </form>
    </div>
  `
})
export class ClassroomDrawerComponent {
  private readonly classroomService = inject(ClassroomService);
  private readonly sheetRef = inject(ZardSheetRef);
  private readonly data = injectSheetData<ClassroomDrawerData>();

  readonly blocks = this.data?.blocks || [];
  readonly isEditing = signal<boolean>(!!this.data?.classroom);

  readonly code = signal<string>(this.data?.classroom?.code || '');
  readonly blockId = signal<string>(this.data?.classroom?.block_id || (this.blocks[0]?.id || ''));
  readonly type = signal<string>(this.data?.classroom?.type || 'Aula Teórica');
  readonly floor = signal<string>(this.data?.classroom?.floor || 'Piso 1');
  readonly isActive = signal<boolean>(this.data?.classroom?.is_active ?? true);
  readonly isSubmitting = signal<boolean>(false);

  onCancel(): void {
    this.sheetRef.close();
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    const codeVal = this.code().trim();
    const blockIdVal = this.blockId();

    if (!codeVal || !blockIdVal) {
      toast.error('Por favor ingresa el código del aula y selecciona un bloque.');
      return;
    }

    this.isSubmitting.set(true);

    if (this.isEditing() && this.data.classroom) {
      const updated = await this.classroomService.updateClassroom(this.data.classroom.id, {
        code: codeVal,
        block_id: blockIdVal,
        type: this.type(),
        floor: this.floor(),
        is_active: this.isActive()
      });

      this.isSubmitting.set(false);

      if (updated) {
        toast.success(`Aula "${updated.code}" actualizada exitosamente.`);
        this.sheetRef.close(updated);
      } else {
        toast.error('Error al actualizar el aula.');
      }
    } else {
      const created = await this.classroomService.createClassroom({
        code: codeVal,
        block_id: blockIdVal,
        type: this.type(),
        floor: this.floor(),
        is_active: this.isActive()
      });

      this.isSubmitting.set(false);

      if (created) {
        toast.success(`Aula "${created.code}" creada exitosamente.`);
        this.sheetRef.close(created);
      } else {
        toast.error('Error al crear el aula.');
      }
    }
  }
}
