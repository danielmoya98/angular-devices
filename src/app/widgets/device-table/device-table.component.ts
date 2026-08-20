import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DeviceService } from '@entities/device/api/device.service';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideRefreshCw, lucideHardDrive, lucideAlertCircle } from '@ng-icons/lucide';
import { ZardButtonComponent } from '@shared/components/button';
import { ZardBadgeComponent } from '@shared/components/badge';
import {
  ZardCardComponent,
  ZardCardHeaderComponent,
  ZardCardTitleComponent,
  ZardCardDescriptionComponent,
  ZardCardContentComponent
} from '@shared/components/card';
import {
  ZardTableComponent,
  ZardTableHeaderComponent,
  ZardTableBodyComponent,
  ZardTableRowComponent,
  ZardTableHeadComponent,
  ZardTableCellComponent
} from '@shared/components/table';

@Component({
  selector: 'app-device-table',
  standalone: true,
  imports: [
    NgIconComponent,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardCardComponent,
    ZardCardHeaderComponent,
    ZardCardTitleComponent,
    ZardCardDescriptionComponent,
    ZardCardContentComponent,
    ZardTableComponent,
    ZardTableHeaderComponent,
    ZardTableBodyComponent,
    ZardTableRowComponent,
    ZardTableHeadComponent,
    ZardTableCellComponent
  ],
  viewProviders: [
    provideIcons({
      lucideRefreshCw,
      lucideHardDrive,
      lucideAlertCircle
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div z-card class="shadow-2xs border border-border/80 rounded-2xl overflow-hidden">
      <div z-card-header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 border-b border-border/60">
        <div>
          <h3 z-card-title class="text-base font-bold text-foreground">Inventario de Dispositivos</h3>
          <p z-card-description class="text-xs text-muted-foreground mt-0.5">
            Lista de equipos sincronizados en tiempo real desde Supabase
          </p>
        </div>
        <button z-button zType="outline" zSize="sm" (click)="reload()" [zLoading]="deviceService.loading()" class="self-start sm:self-auto gap-2">
          <ng-icon name="lucideRefreshCw" class="text-sm" />
          <span>Refrescar</span>
        </button>
      </div>
      
      <div z-card-content class="p-5 sm:p-6">
        @if (deviceService.error()) {
          <div class="p-4 mb-4 text-xs font-medium rounded-xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-3">
            <ng-icon name="lucideAlertCircle" class="text-base shrink-0" />
            <span>{{ deviceService.error() }}</span>
          </div>
        }

        @if (deviceService.loading() && deviceService.devices().length === 0) {
          <div class="py-12 flex flex-col items-center justify-center gap-3 text-center text-muted-foreground">
            <ng-icon name="lucideRefreshCw" class="text-2xl animate-spin text-primary" />
            <p class="text-xs font-medium">Cargando dispositivos desde Supabase...</p>
          </div>
        } @else if (deviceService.devices().length === 0) {
          <div class="py-12 flex flex-col items-center justify-center gap-3 text-center text-muted-foreground">
            <div class="size-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground/80">
              <ng-icon name="lucideHardDrive" class="text-xl" />
            </div>
            <div class="space-y-1">
              <p class="text-sm font-semibold text-foreground">No hay dispositivos registrados</p>
              <p class="text-xs text-muted-foreground">Los datos insertados en Supabase aparecerán aquí automáticamente.</p>
            </div>
          </div>
        } @else {
          <div class="overflow-x-auto rounded-xl border border-border/60">
            <table z-table class="w-full">
              <thead z-table-header class="bg-muted/40">
                <tr z-table-row>
                  <th z-table-head class="text-xs font-semibold">Código Interno</th>
                  <th z-table-head class="text-xs font-semibold">Marca</th>
                  <th z-table-head class="text-xs font-semibold">Modelo</th>
                  <th z-table-head class="text-xs font-semibold">Nº Serie</th>
                  <th z-table-head class="text-xs font-semibold">Estado</th>
                  <th z-table-head class="text-xs font-semibold">Fecha Inst.</th>
                </tr>
              </thead>
              <tbody z-table-body>
                @for (device of deviceService.devices(); track device.id) {
                  <tr z-table-row class="hover:bg-muted/30 transition-colors">
                    <td z-table-cell class="font-mono text-xs font-bold text-primary">{{ device.internal_code }}</td>
                    <td z-table-cell class="text-xs font-medium">{{ device.brand }}</td>
                    <td z-table-cell class="text-xs">{{ device.model }}</td>
                    <td z-table-cell class="text-xs text-muted-foreground font-mono">{{ device.serial_number || '-' }}</td>
                    <td z-table-cell>
                      <z-badge [zType]="getStatusBadgeType(device.status)" class="text-[11px] uppercase tracking-wider font-semibold">
                        {{ device.status }}
                      </z-badge>
                    </td>
                    <td z-table-cell class="text-xs text-muted-foreground">{{ device.installation_date || '-' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `
})
export class DeviceTableComponent implements OnInit {
  protected readonly deviceService = inject(DeviceService);

  ngOnInit(): void {
    this.deviceService.fetchDevices();
  }

  reload(): void {
    this.deviceService.fetchDevices();
  }

  getStatusBadgeType(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
    switch (status?.toUpperCase()) {
      case 'OPERATIONAL':
      case 'OPERATIVO':
        return 'default';
      case 'NEEDS_MAINTENANCE':
      case 'MANTENIMIENTO':
        return 'secondary';
      case 'OUT_OF_SERVICE':
      case 'INOPERATIVO':
        return 'destructive';
      default:
        return 'outline';
    }
  }
}
