import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideUser, lucideSave, lucideX, lucideShield } from '@ng-icons/lucide';
import { toast } from 'ngx-sonner';

import { UserService } from '@/entities/user/api/user.service';
import { User, UserRole } from '@/entities/user/model/user.types';
import { ZardSheetRef, injectSheetData } from '@/shared/components/sheet';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputComponent } from '@/shared/components/input';
import { ZardFieldImports } from '@/shared/components/field/field.imports';

export interface UserDrawerData {
  user?: User;
}

@Component({
  selector: 'app-user-drawer',
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
            <h3 class="text-base font-bold text-foreground">
              {{ isEditing() ? 'Editar Usuario' : 'Nuevo Usuario' }}
            </h3>
            <p class="text-xs text-muted-foreground">
              {{ isEditing() ? 'Modifica los permisos y datos de la cuenta' : 'Registra un nuevo miembro del personal del campus' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Form Inputs -->
      <form (ngSubmit)="onSubmit($event)" class="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
        
        <!-- Nombre Completo -->
        <div z-field>
          <label z-field-label for="user-name" class="required">Nombre Completo</label>
          <input
            z-input
            id="user-name"
            name="name"
            [ngModel]="name()"
            (ngModelChange)="name.set($event)"
            placeholder="Ej: Ing. Ana Martínez"
            required
          />
        </div>

        <!-- Correo Electrónico -->
        <div z-field>
          <label z-field-label for="user-email" class="required">Correo Electrónico</label>
          <input
            z-input
            type="email"
            id="user-email"
            name="email"
            [ngModel]="email()"
            (ngModelChange)="email.set($event)"
            placeholder="Ej: ana.martinez@universidad.edu"
            required
          />
        </div>

        <!-- Contraseña -->
        <div z-field>
          <label z-field-label for="user-password" [class.required]="!isEditing()">
            Contraseña {{ isEditing() ? '(Dejar en blanco para no cambiar)' : '' }}
          </label>
          <input
            z-input
            type="password"
            id="user-password"
            name="password"
            [ngModel]="password()"
            (ngModelChange)="password.set($event)"
            placeholder="••••••••"
            [required]="!isEditing()"
          />
        </div>

        <!-- Rol del Sistema -->
        <div z-field>
          <label z-field-label for="user-role" class="required">Rol y Permisos</label>
          <select
            id="user-role"
            name="role"
            [ngModel]="role()"
            (ngModelChange)="role.set($event)"
            class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          >
            <option value="admin">Administrador (Control Total)</option>
            <option value="tech_support">Técnico / Inspector (Rondas e Inspecciones)</option>
            <option value="viewer">Visualizador / Auditor (Solo Lectura)</option>
          </select>
        </div>

        <!-- Estado Activo -->
        <div class="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="user-active"
            [checked]="isActive()"
            (change)="isActive.set($any($event.target).checked)"
            class="size-4 rounded border-input text-primary focus:ring-primary"
          />
          <label for="user-active" class="text-sm font-medium text-foreground cursor-pointer select-none">
            Cuenta de Usuario Habilitada
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
            <span>{{ isEditing() ? 'Guardar Cambios' : 'Crear Usuario' }}</span>
          </button>
        </div>

      </form>
    </div>
  `
})
export class UserDrawerComponent {
  private readonly userService = inject(UserService);
  private readonly sheetRef = inject(ZardSheetRef);
  private readonly data = injectSheetData<UserDrawerData>();

  readonly isEditing = signal<boolean>(!!this.data?.user);
  readonly name = signal<string>(this.data?.user?.name || '');
  readonly email = signal<string>(this.data?.user?.email || '');
  readonly password = signal<string>('');
  readonly role = signal<UserRole>(this.data?.user?.role || 'tech_support');
  readonly isActive = signal<boolean>(this.data?.user?.is_active ?? true);
  readonly isSubmitting = signal<boolean>(false);

  onCancel(): void {
    this.sheetRef.close();
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();

    const nameVal = this.name().trim();
    const emailVal = this.email().trim();

    if (!nameVal || !emailVal) {
      toast.error('Por favor completa el nombre y el correo electrónico.');
      return;
    }

    if (!this.isEditing() && !this.password().trim()) {
      toast.error('Por favor ingresa una contraseña para la cuenta nueva.');
      return;
    }

    this.isSubmitting.set(true);

    if (this.isEditing() && this.data.user) {
      const dto: any = {
        name: nameVal,
        email: emailVal,
        role: this.role(),
        is_active: this.isActive()
      };

      if (this.password().trim()) {
        dto.password_hash = `hash_${this.password().trim()}`;
      }

      const updated = await this.userService.updateUser(this.data.user.id, dto);
      this.isSubmitting.set(false);

      if (updated) {
        toast.success(`Usuario "${updated.name}" actualizado exitosamente.`);
        this.sheetRef.close(updated);
      } else {
        toast.error('Error al actualizar el usuario.');
      }
    } else {
      const created = await this.userService.createUser({
        name: nameVal,
        email: emailVal,
        password_hash: `hash_${this.password().trim()}`,
        role: this.role(),
        is_active: this.isActive()
      });

      this.isSubmitting.set(false);

      if (created) {
        toast.success(`Usuario "${created.name}" creado exitosamente.`);
        this.sheetRef.close(created);
      } else {
        toast.error('Error al crear el usuario.');
      }
    }
  }
}
