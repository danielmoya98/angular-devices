import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideTrash2, lucideAlertTriangle } from '@ng-icons/lucide';
import { toast } from 'ngx-sonner';

import { ZardSheetRef, injectSheetData } from '@/shared/components/sheet';
import { ZardButtonComponent } from '@/shared/components/button';

export interface DeleteConfirmData {
  title: string;
  description: string;
  itemName: string;
  onDelete: () => Promise<boolean>;
}

@Component({
  selector: 'app-delete-confirm-drawer',
  standalone: true,
  imports: [
    CommonModule,
    NgIconComponent,
    ZardButtonComponent
  ],
  viewProviders: [
    provideIcons({
      lucideTrash2,
      lucideAlertTriangle
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 flex flex-col gap-6 h-full min-h-0 bg-popover text-popover-foreground">
      
      <div class="flex items-center gap-3 pb-4 border-b border-border/60">
        <div class="size-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
          <ng-icon name="lucideAlertTriangle" class="text-xl" />
        </div>
        <div>
          <h3 class="text-base font-bold text-foreground">{{ data.title }}</h3>
          <p class="text-xs text-muted-foreground">Esta acción no se puede deshacer</p>
        </div>
      </div>

      <div class="space-y-3 my-auto py-4 text-sm">
        <p class="text-muted-foreground">{{ data.description }}</p>
        
        <div class="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive font-medium flex items-center gap-3">
          <ng-icon name="lucideTrash2" class="text-lg shrink-0" />
          <span class="font-bold">{{ data.itemName }}</span>
        </div>
      </div>

      <div class="pt-6 border-t border-border/60 flex items-center justify-end gap-3">
        <button
          type="button"
          z-button
          zType="outline"
          (click)="onCancel()"
        >
          Cancelar
        </button>
        <button
          type="button"
          z-button
          zType="destructive"
          [zLoading]="isDeleting()"
          (click)="onConfirm()"
          class="gap-2"
        >
          <ng-icon name="lucideTrash2" class="text-sm" />
          <span>Confirmar Eliminación</span>
        </button>
      </div>

    </div>
  `
})
export class DeleteConfirmDrawerComponent {
  private readonly sheetRef = inject(ZardSheetRef);
  readonly data = injectSheetData<DeleteConfirmData>();
  readonly isDeleting = signal<boolean>(false);

  onCancel(): void {
    this.sheetRef.close(false);
  }

  async onConfirm(): Promise<void> {
    this.isDeleting.set(true);
    try {
      const success = await this.data.onDelete();
      this.isDeleting.set(false);
      if (success) {
        toast.success(`"${this.data.itemName}" ha sido eliminado.`);
        this.sheetRef.close(true);
      } else {
        toast.error(`Error al eliminar "${this.data.itemName}".`);
      }
    } catch {
      this.isDeleting.set(false);
      toast.error('Error durante el proceso de eliminación.');
    }
  }
}
