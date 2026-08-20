import { Component, ChangeDetectionStrategy, ViewEncapsulation, signal, computed, inject, ElementRef, HostListener, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideUser, lucideSettings, lucideLogOut, lucideChevronUp } from '@ng-icons/lucide';

import { AuthService } from '@/core/auth/auth.service';
import { ZardAvatarComponent } from '@/shared/components/avatar';
import { ZardSheetService } from '@/shared/components/sheet';
import { ProfileDrawerComponent } from '@/features/settings/components/profile-drawer.component';

@Component({
  selector: 'app-user-dropdown',
  standalone: true,
  imports: [CommonModule, NgIconComponent, ZardAvatarComponent],
  viewProviders: [
    provideIcons({ lucideUser, lucideSettings, lucideLogOut, lucideChevronUp })
  ],
  templateUrl: './user-dropdown.component.html',
  styleUrl: './user-dropdown.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class UserDropdownComponent {
  private readonly authService = inject(AuthService);
  private readonly sheetService = inject(ZardSheetService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);

  readonly isCollapsed = input(false);

  readonly isOpen = signal(false);

  readonly user = computed(() => this.authService.user());
  readonly userName = computed(() => this.user()?.name || 'Usuario UNIVALLE');
  readonly userEmail = computed(() => this.user()?.email || '');
  readonly userRole = computed(() => this.user()?.role || 'viewer');
  readonly userRoleLabel = computed(() => {
    const r = this.userRole();
    if (r === 'admin') return 'Administrador';
    if (r === 'tech_support') return 'Soporte Técnico';
    if (r === 'viewer') return 'Observador (Lectura)';
    return 'Usuario';
  });

  readonly userInitials = computed(() => {
    const name = this.userName();
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  });

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  toggleDropdown(): void {
    this.isOpen.update(v => !v);
  }

  editProfile(): void {
    this.isOpen.set(false);
    this.sheetService.create({
      zContent: ProfileDrawerComponent,
      zSide: 'right',
      zSize: 'default',
      zWidth: '420px',
      zHideFooter: true,
      zData: {
        id: this.user()?.id,
        name: this.userName(),
        email: this.userEmail(),
        role: this.userRole()
      }
    });
  }

  openSettings(): void {
    this.isOpen.set(false);
    this.router.navigate(['/settings']);
  }

  signOut(): void {
    this.isOpen.set(false);
    this.authService.signOut();
    this.router.navigate(['/login']);
  }
}
