import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideKey, lucideLock, lucideSave, lucideX, lucideEye, lucideEyeOff } from '@ng-icons/lucide';
import { toast } from 'ngx-sonner';

import { AuthService } from '@/core/auth/auth.service';
import { ZardSheetRef, injectSheetData } from '@/shared/components/sheet';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputComponent } from '@/shared/components/input';
import { ZardFieldImports } from '@/shared/components/field/field.imports';

export interface ChangePasswordDrawerData {
  userId: string;
  userName: string;
}

@Component({
  selector: 'app-change-password-drawer',
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
      lucideKey,
      lucideLock,
      lucideSave,
      lucideX,
      lucideEye,
      lucideEyeOff
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 flex flex-col justify-between h-full min-h-0 bg-popover text-popover-foreground">
      
      <!-- Drawer Header -->
      <div class="flex items-center justify-between pb-4 border-b border-border/60 shrink-0">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <ng-icon name="lucideKey" class="text-xl" />
          </div>
          <div>
            <h3 class="text-base font-bold text-foreground">Cambiar Contraseña</h3>
            <p class="text-xs text-muted-foreground">
              Actualiza las credenciales de acceso para <strong>{{ data.userName }}</strong>
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
        >
          <ng-icon name="lucideX" class="text-base" />
        </button>
      </div>

      <!-- Form Inputs -->
      <form (ngSubmit)="onSubmit($event)" class="flex-1 flex flex-col gap-4 overflow-y-auto py-4 pr-1">
        
        <!-- Current Password -->
        <div z-field>
          <label z-field-label for="curr-pass" class="required">Contraseña Actual</label>
          <div class="relative">
            <input
              z-input
              [type]="showCurrent() ? 'text' : 'password'"
              id="curr-pass"
              name="currentPassword"
              [ngModel]="currentPassword()"
              (ngModelChange)="currentPassword.set($event)"
              placeholder="Ingresa tu contraseña actual..."
              required
              class="pr-9"
            />
            <button
              type="button"
              (click)="showCurrent.set(!showCurrent())"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
              tabindex="-1"
            >
              <ng-icon [name]="showCurrent() ? 'lucideEyeOff' : 'lucideEye'" />
            </button>
          </div>
        </div>

        <!-- New Password -->
        <div z-field>
          <label z-field-label for="new-pass" class="required">Nueva Contraseña</label>
          <div class="relative">
            <input
              z-input
              [type]="showNew() ? 'text' : 'password'"
              id="new-pass"
              name="newPassword"
              [ngModel]="newPassword()"
              (ngModelChange)="newPassword.set($event)"
              placeholder="Mínimo 6 caracteres..."
              required
              class="pr-9"
            />
            <button
              type="button"
              (click)="showNew.set(!showNew())"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
              tabindex="-1"
            >
              <ng-icon [name]="showNew() ? 'lucideEyeOff' : 'lucideEye'" />
            </button>
          </div>
        </div>

        <!-- Confirm New Password -->
        <div z-field>
          <label z-field-label for="conf-pass" class="required">Confirmar Nueva Contraseña</label>
          <div class="relative">
            <input
              z-input
              [type]="showConfirm() ? 'text' : 'password'"
              id="conf-pass"
              name="confirmPassword"
              [ngModel]="confirmPassword()"
              (ngModelChange)="confirmPassword.set($event)"
              placeholder="Repite la nueva contraseña..."
              required
              class="pr-9"
            />
            <button
              type="button"
              (click)="showConfirm.set(!showConfirm())"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
              tabindex="-1"
            >
              <ng-icon [name]="showConfirm() ? 'lucideEyeOff' : 'lucideEye'" />
            </button>
          </div>
        </div>

        <div class="p-3 rounded-xl bg-muted/40 text-xs text-muted-foreground border border-border/40 space-y-1">
          <p class="font-bold text-foreground flex items-center gap-1.5">
            <ng-icon name="lucideLock" class="text-amber-500" />
            Seguridad de Credenciales
          </p>
          <p class="text-[11px]">
            La nueva contraseña será cifrada en Supabase con hash seguro SHA-256.
          </p>
        </div>

        <!-- Actions Footer -->
        <div class="mt-auto pt-4 border-t border-border/60 flex items-center justify-end gap-3 shrink-0">
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
            class="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <ng-icon name="lucideSave" class="text-sm" />
            <span>Actualizar Contraseña</span>
          </button>
        </div>

      </form>
    </div>
  `
})
export class ChangePasswordDrawerComponent {
  private readonly authService = inject(AuthService);
  private readonly sheetRef = inject(ZardSheetRef);
  readonly data = injectSheetData<ChangePasswordDrawerData>();

  readonly currentPassword = signal<string>('');
  readonly newPassword = signal<string>('');
  readonly confirmPassword = signal<string>('');

  readonly showCurrent = signal<boolean>(false);
  readonly showNew = signal<boolean>(false);
  readonly showConfirm = signal<boolean>(false);

  readonly isSubmitting = signal<boolean>(false);

  onCancel(): void {
    this.sheetRef.close();
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    const curr = this.currentPassword().trim();
    const newP = this.newPassword().trim();
    const conf = this.confirmPassword().trim();

    if (!curr || !newP || !conf) {
      toast.error('Por favor completa todos los campos del formulario.');
      return;
    }

    if (newP.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newP !== conf) {
      toast.error('La nueva contraseña y la confirmación no coinciden.');
      return;
    }

    this.isSubmitting.set(true);

    const result = await this.authService.changePassword(this.data.userId, curr, newP);
    this.isSubmitting.set(false);

    if (result.success) {
      toast.success(result.message);
      this.sheetRef.close(true);
    } else {
      toast.error(result.message);
    }
  }
}
