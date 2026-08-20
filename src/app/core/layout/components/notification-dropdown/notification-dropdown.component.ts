import { Component, ChangeDetectionStrategy, ViewEncapsulation, signal, ElementRef, HostListener, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideBell, lucideCheck, lucideCpu, lucideAlertTriangle, lucideInfo, lucideWrench, lucideBuilding } from '@ng-icons/lucide';

import { DeviceService } from '@/entities/device/api/device.service';
import { InspectionService } from '@/entities/inspection/api/inspection.service';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'warning' | 'info' | 'error';
  unread: boolean;
  icon?: string;
}

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  viewProviders: [
    provideIcons({ lucideBell, lucideCheck, lucideCpu, lucideAlertTriangle, lucideInfo, lucideWrench, lucideBuilding })
  ],
  templateUrl: './notification-dropdown.component.html',
  styleUrl: './notification-dropdown.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class NotificationDropdownComponent implements OnInit {
  private readonly elementRef = inject(ElementRef);
  private readonly deviceService = inject(DeviceService);
  private readonly inspectionService = inject(InspectionService);

  readonly isOpen = signal(false);

  readonly notifications = signal<NotificationItem[]>([
    {
      id: 'n1',
      title: 'Mantenimiento en Aula A-201',
      message: 'Proyector HDMI reportado en estado de revisión técnica en Bloque A.',
      time: 'Hace 10 min',
      type: 'warning',
      unread: true,
      icon: 'lucideWrench'
    },
    {
      id: 'n2',
      title: 'Ronda de Inspección Abierta',
      message: 'Técnico asignado a la revisión técnica en Laboratorios de Computación.',
      time: 'Hace 30 min',
      type: 'info',
      unread: true,
      icon: 'lucideBuilding'
    },
    {
      id: 'n3',
      title: 'Inventario UNIVALLE Sincronizado',
      message: 'Sincronización en tiempo real activa con los servidores del campus.',
      time: 'Hace 1 hora',
      type: 'info',
      unread: false,
      icon: 'lucideCpu'
    }
  ]);

  readonly unreadCount = computed(() => this.notifications().filter(n => n.unread).length);

  ngOnInit(): void {
    // Dynamically sync notifications from live device & inspection signals
    const maintenanceDevs = this.deviceService.devices().filter(d => d.status === 'under_maintenance' || d.status === 'damaged');
    if (maintenanceDevs.length > 0) {
      const firstDev = maintenanceDevs[0];
      this.notifications.update(list => [
        {
          id: `dev-${firstDev.id}`,
          title: `Alerta Equipo ${firstDev.internal_code}`,
          message: `${firstDev.brand} ${firstDev.model} en estado ${firstDev.status === 'damaged' ? 'dañado' : 'en mantenimiento'}.`,
          time: 'En vivo',
          type: firstDev.status === 'damaged' ? 'error' : 'warning',
          unread: true,
          icon: 'lucideAlertTriangle'
        },
        ...list.filter(n => !n.id.startsWith('dev-'))
      ]);
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  toggleDropdown(): void {
    this.isOpen.update(v => !v);
  }

  markAllAsRead(): void {
    this.notifications.update(list => list.map(n => ({ ...n, unread: false })));
  }

  markAsRead(id: string): void {
    this.notifications.update(list =>
      list.map(n => (n.id === id ? { ...n, unread: false } : n))
    );
  }
}
