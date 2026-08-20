import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideClipboardCheck, lucideSave, lucideX, lucideUser } from '@ng-icons/lucide';
import { toast } from 'ngx-sonner';

import { InspectionService } from '@/entities/inspection/api/inspection.service';
import { User } from '@/entities/user/model/user.types';

import { ZardSheetRef, injectSheetData } from '@/shared/components/sheet';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputComponent } from '@/shared/components/input';
import { ZardFieldImports } from '@/shared/components/field/field.imports';

export interface InspectionDrawerData {
  inspectors: User[];
}

@Component({
  selector: 'app-inspection-drawer',
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
      lucideClipboardCheck,
      lucideSave,
      lucideX,
      lucideUser
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col justify-between overflow-hidden bg-popover text-popover-foreground max-h-screen">
      
      <!-- Drawer Header (Fixed top) -->
      <div class="p-5 pb-4 border-b border-border/60 shrink-0 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <ng-icon name="lucideClipboardCheck" class="text-xl" />
          </div>
          <div>
            <h3 class="text-base font-bold text-foreground">Programar Ronda de Inspección</h3>
            <p class="text-xs text-muted-foreground">
              Asigna un inspector técnico y establece la fecha de auditoría de aulas
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

      <!-- Form Inputs -->
      <form (ngSubmit)="onSubmit($event)" class="flex-1 flex flex-col min-h-0 overflow-hidden">
        
        <!-- Scrollable Content Area -->
        <div class="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
          
          <!-- Inspector Asignado -->
          <div z-field>
            <label z-field-label for="insp-user" class="required">Inspector / Técnico A Cargo</label>
            <select
              id="insp-user"
              name="inspectorId"
              [ngModel]="inspectorId()"
              (ngModelChange)="inspectorId.set($event)"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring font-medium"
              required
            >
              <option value="" disabled>Selecciona inspector...</option>
              @for (u of inspectors; track u.id) {
                <option [value]="u.id">{{ u.name }} ({{ u.role }})</option>
              }
            </select>
          </div>

          <!-- Fecha Programada -->
          <div z-field>
            <label z-field-label for="insp-date" class="required">Fecha Programada</label>
            <input
              z-input
              type="date"
              id="insp-date"
              name="scheduledDate"
              [ngModel]="scheduledDate()"
              (ngModelChange)="scheduledDate.set($event)"
              required
            />
          </div>

          <!-- Notas Objetivos -->
          <div z-field>
            <label z-field-label for="insp-notes">Objetivo / Alcance de la Ronda</label>
            <textarea
              z-input
              id="insp-notes"
              name="generalNotes"
              [ngModel]="generalNotes()"
              (ngModelChange)="generalNotes.set($event)"
              placeholder="Ej: Auditoría matutina de proyectores en Bloque A e Ingeniería"
              rows="3"
              class="resize-none text-xs"
            ></textarea>
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
            <span>Iniciar Ronda</span>
          </button>
        </div>

      </form>
    </div>
  `,
})
export class InspectionDrawerComponent {
  private readonly inspectionService = inject(InspectionService);
  private readonly sheetRef = inject(ZardSheetRef);
  private readonly data = injectSheetData<InspectionDrawerData>();

  readonly inspectors = this.data?.inspectors || [];
  readonly inspectorId = signal<string>(this.inspectors[0]?.id || '');
  readonly scheduledDate = signal<string>(new Date().toISOString().substring(0, 10));
  readonly generalNotes = signal<string>('');
  readonly isSubmitting = signal<boolean>(false);

  onCancel(): void {
    this.sheetRef.close();
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    const inspector = this.inspectorId();
    if (!inspector) {
      toast.error('Por favor selecciona un inspector para la ronda.');
      return;
    }

    this.isSubmitting.set(true);

    const created = await this.inspectionService.createInspection({
      inspector_id: inspector,
      scheduled_date: this.scheduledDate(),
      general_notes: this.generalNotes().trim()
    });

    this.isSubmitting.set(false);

    if (created) {
      toast.success(`Ronda de inspección iniciada exitosamente.`);
      this.sheetRef.close(created);
    } else {
      toast.error('Error al programar la inspección.');
    }
  }
}
