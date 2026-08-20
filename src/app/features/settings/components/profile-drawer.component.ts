import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideUser, lucideSave, lucideX, lucideMail, lucideShield } from '@ng-icons/lucide';
import { toast } from 'ngx-sonner';

import { AuthService } from '@/core/auth/auth.service';
import { ZardSheetRef, injectSheetData } from '@/shared/components/sheet';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputComponent } from '@/shared/components/input';
import { ZardFieldImports } from '@/shared/components/field/field.imports';

export interface ProfileDrawerData {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

@Component({
  selector: 'app-profile-drawer',
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
      lucideUser,
      lucideSave,
      lucideX,
      lucideMail,
      lucideShield
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 flex flex-col gap-6 h-full min-h-0 bg-popover text-popover-foreground">
      
      <!-- Drawer Header -->
      <div class="flex items-center justify-between pb-4 border-b border-border/60">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <ng-icon name="lucideUser" class="text-xl" />
          </div>
          <div>
            <h3 class="text-base font-bold text-foreground">Editar Perfil de Usuario</h3>
            <p class="text-xs text-muted-foreground">
              Actualiza tus datos personales y sincroniza los cambios con Supabase
            </p>
          </div>
        </div>
      </div>

      <!-- Form Inputs -->
      <form (ngSubmit)="onSubmit($event)" class="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
        
        <!-- Nombre Completo -->
        <div z-field>
          <label z-field-label for="prof-name" class="required">Nombre Completo</label>
          <input
            z-input
            id="prof-name"
            name="name"
            [ngModel]="name()"
            (ngModelChange)="name.set($event)"
            placeholder="Ej: Carlos Moya"
            required
          />
        </div>

        <!-- Correo Electrónico -->
        <div z-field>
          <label z-field-label for="prof-email" class="required">Correo Electrónico</label>
          <input
            z-input
            type="email"
            id="prof-email"
            name="email"
            [ngModel]="email()"
            (ngModelChange)="email.set($event)"
            placeholder="Ej: moyacarlos09@gmail.com"
            required
          />
        </div>

        <!-- Rol del Sistema -->
        <div z-field>
          <label z-field-label for="prof-role">Rol de Sistema</label>
          <input
            z-input
            id="prof-role"
            [value]="role()"
            disabled
            class="opacity-75 cursor-not-allowed bg-muted"
          />
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
            <span>Guardar en Supabase</span>
          </button>
        </div>

      </form>
    </div>
  `
})
export class ProfileDrawerComponent {
  private readonly authService = inject(AuthService);
  private readonly sheetRef = inject(ZardSheetRef);
  private readonly data = injectSheetData<ProfileDrawerData>();

  readonly currentUser = this.authService.user;
  readonly userId = signal<string>(this.data?.id || this.currentUser()?.id || '');
  readonly name = signal<string>(this.data?.name || this.currentUser()?.name || 'Carlos Moya');
  readonly email = signal<string>(this.data?.email || this.currentUser()?.email || 'moyacarlos09@gmail.com');
  readonly role = signal<string>(this.data?.role || this.currentUser()?.role || 'admin');
  readonly isSubmitting = signal<boolean>(false);

  onCancel(): void {
    this.sheetRef.close();
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    const nameVal = this.name().trim();
    const emailVal = this.email().trim();
    const targetId = this.userId() || this.currentUser()?.id;

    if (!nameVal || !emailVal) {
      toast.error('Por favor ingresa un nombre y correo electrónico válidos.');
      return;
    }

    if (!targetId) {
      toast.error('No se identificó el usuario activo.');
      return;
    }

    this.isSubmitting.set(true);

    const success = await this.authService.updateUserProfile(targetId, nameVal, emailVal);
    this.isSubmitting.set(false);

    if (success) {
      toast.success('Perfil actualizado e integrado en Supabase exitosamente.');
      this.sheetRef.close({ name: nameVal, email: emailVal });
    } else {
      toast.error('Error al actualizar el perfil en Supabase.');
    }
  }
}
