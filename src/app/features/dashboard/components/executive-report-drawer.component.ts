import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideBarChart3,
  lucidePrinter,
  lucideX,
  lucideCheckCircle2,
  lucideDollarSign,
  lucideBuilding,
  lucideCpu,
  lucideClipboardCheck,
  lucideDownload,
  lucideFileText
} from '@ng-icons/lucide';
import { toast } from 'ngx-sonner';

import { ZardSheetRef, injectSheetData } from '@/shared/components/sheet';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardBadgeComponent } from '@/shared/components/badge';

export interface BlockAnalytics {
  id: string;
  name: string;
  code: string;
  totalClassrooms: number;
  operationalClassrooms: number;
  availabilityRate: number;
  totalMaintenanceCost: number;
}

export interface BrandAnalytics {
  brand: string;
  totalDevices: number;
  operational: number;
  underMaintenance: number;
  failureRate: number;
}

export interface ExecutiveReportData {
  totalDevices: number;
  availabilityRate: number;
  totalBudget: number;
  activeInspections: number;
  blockAnalytics: BlockAnalytics[];
  brandAnalytics: BrandAnalytics[];
}

@Component({
  selector: 'app-executive-report-drawer',
  standalone: true,
  imports: [
    CommonModule,
    NgIconComponent,
    ZardButtonComponent,
    ZardBadgeComponent
  ],
  viewProviders: [
    provideIcons({
      lucideBarChart3,
      lucidePrinter,
      lucideX,
      lucideCheckCircle2,
      lucideDollarSign,
      lucideBuilding,
      lucideCpu,
      lucideClipboardCheck,
      lucideDownload,
      lucideFileText
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-5 sm:p-6 flex flex-col justify-between h-full min-h-0 max-h-screen bg-popover text-popover-foreground box-border">
      
      <!-- Drawer Header (Fixed) -->
      <div class="flex items-center justify-between pb-4 border-b border-border/60 shrink-0">
        <div class="flex items-center gap-3">
          <img src="assets/images/univalle-logo-red.png" alt="UNIVALLE" class="size-10 object-contain p-0.5 rounded-xl bg-white shadow-xs border border-primary/20 shrink-0" />
          <div>
            <h3 class="text-base font-bold text-foreground">Informe Ejecutivo de Infraestructura</h3>
            <p class="text-xs text-muted-foreground">
              Resumen consolidado de disponibilidad del campus, marcas e inversión técnica
            </p>
          </div>
        </div>

        <button
          type="button"
          z-button
          zType="ghost"
          zSize="icon-sm"
          (click)="onClose()"
          aria-label="Cerrar reporte"
        >
          <ng-icon name="lucideX" class="text-base" />
        </button>
      </div>

      <!-- Report Body (Scrollable Center) -->
      <div class="flex-1 flex flex-col gap-5 overflow-y-auto py-4 pr-1 min-h-0">
        
        <!-- Summary Cards Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div class="p-3 rounded-xl bg-card border border-border/80 flex flex-col gap-0.5">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Disponibilidad</span>
            <span class="text-lg font-bold text-emerald-500 font-mono">{{ data.availabilityRate }}%</span>
          </div>

          <div class="p-3 rounded-xl bg-card border border-border/80 flex flex-col gap-0.5">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Inversión Total</span>
            <span class="text-lg font-bold text-foreground font-mono">\${{ data.totalBudget.toFixed(2) }}</span>
          </div>

          <div class="p-3 rounded-xl bg-card border border-border/80 flex flex-col gap-0.5">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Equipos</span>
            <span class="text-lg font-bold text-primary font-mono">{{ data.totalDevices }}</span>
          </div>

          <div class="p-3 rounded-xl bg-card border border-border/80 flex flex-col gap-0.5">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rondas</span>
            <span class="text-lg font-bold text-amber-500 font-mono">{{ data.activeInspections }}</span>
          </div>
        </div>

        <!-- Breakdown by Block -->
        <div class="space-y-2.5">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ng-icon name="lucideBuilding" class="text-primary text-sm" />
              Desglose de Disponibilidad e Inversión por Bloque
            </h4>
            <span class="text-xs font-mono text-muted-foreground">{{ data.blockAnalytics.length }} Bloques</span>
          </div>

          <div class="space-y-2">
            @for (b of data.blockAnalytics; track b.id) {
              <div class="p-3 rounded-xl border border-border/80 bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
                <div>
                  <p class="font-bold text-foreground">{{ b.name }} ({{ b.code }})</p>
                  <p class="text-[11px] text-muted-foreground mt-0.5">
                    {{ b.operationalClassrooms }} de {{ b.totalClassrooms }} aulas operativas
                  </p>
                </div>
                <div class="flex items-center gap-2.5 self-end sm:self-auto">
                  <z-badge [zType]="b.availabilityRate >= 80 ? 'outline' : 'destructive'" class="text-[10px] font-bold">
                    {{ b.availabilityRate }}%
                  </z-badge>
                  <p class="text-xs font-bold text-emerald-500 font-mono">
                    \${{ b.totalMaintenanceCost.toFixed(2) }}
                  </p>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Failure Rate by Brand -->
        <div class="space-y-2.5 pt-1">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ng-icon name="lucideCpu" class="text-primary text-sm" />
              Confiabilidad por Fabricante / Marca
            </h4>
            <span class="text-xs font-mono text-muted-foreground">{{ data.brandAnalytics.length }} Fabricantes</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            @for (br of data.brandAnalytics; track br.brand) {
              <div class="p-3 rounded-xl border border-border/80 bg-card flex items-center justify-between text-xs">
                <div>
                  <p class="font-bold text-foreground">{{ br.brand }}</p>
                  <p class="text-[11px] text-muted-foreground mt-0.5">
                    {{ br.totalDevices }} equipos ({{ br.underMaintenance }} en mant.)
                  </p>
                </div>
                <z-badge [zType]="br.failureRate === 0 ? 'outline' : 'secondary'" class="text-[10px]">
                  Falla: {{ br.failureRate }}%
                </z-badge>
              </div>
            }
          </div>
        </div>

        <!-- Report Footer Note -->
        <div class="p-3.5 rounded-xl bg-muted/40 text-xs text-muted-foreground border border-border/40 flex items-start gap-2.5">
          <ng-icon name="lucideFileText" class="text-primary text-base shrink-0 mt-0.5" />
          <div>
            <p class="font-bold text-foreground">Certificación de Auditoría UNIVALLE:</p>
            <p class="mt-0.5 text-[11px]">
              Documento consolidado en tiempo real desde Supabase PostgreSQL (blocks, classrooms, devices, inspections, replacements).
            </p>
          </div>
        </div>

      </div>

      <!-- Actions Footer (Fixed Bottom) -->
      <div class="pt-3 border-t border-border/60 flex items-center justify-between gap-3 shrink-0">
        <span class="text-[11px] text-muted-foreground font-mono hidden sm:inline">
          Formato A4 listo para PDF
        </span>

        <div class="flex items-center gap-2.5">
          <button
            type="button"
            z-button
            zType="outline"
            zSize="sm"
            (click)="onClose()"
          >
            Cerrar
          </button>
          <button
            type="button"
            z-button
            zType="default"
            zSize="sm"
            (click)="onDownloadPdf()"
            class="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            <ng-icon name="lucideDownload" class="text-xs" />
            <span>Descargar PDF / Imprimir</span>
          </button>
        </div>
      </div>

    </div>
  `
})
export class ExecutiveReportDrawerComponent {
  private readonly sheetRef = inject(ZardSheetRef);
  readonly data = injectSheetData<ExecutiveReportData>();

  onClose(): void {
    this.sheetRef.close();
  }

  onDownloadPdf(): void {
    toast.success('Generando documento PDF de alta resolución...');

    const todayStr = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const blockRowsHtml = this.data.blockAnalytics.map(b => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${b.name} (${b.code})</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${b.operationalClassrooms} / ${b.totalClassrooms}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: ${b.availabilityRate >= 80 ? '#10b981' : '#ef4444'};">${b.availabilityRate}%</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-weight: bold;">$${b.totalMaintenanceCost.toFixed(2)}</td>
      </tr>
    `).join('');

    const brandRowsHtml = this.data.brandAnalytics.map(br => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${br.brand}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${br.totalDevices}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #10b981; font-weight: bold;">${br.operational}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #f59e0b;">${br.underMaintenance}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${br.failureRate}%</td>
      </tr>
    `).join('');

    const printableHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Informe Ejecutivo de Infraestructura Tecnológica</title>
        <meta charset="utf-8">
        <style>
          @page { size: A4; margin: 20mm; }
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            color: #1e293b;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 13px;
            line-height: 1.5;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .title {
            font-size: 20px;
            font-weight: bold;
            color: #0f172a;
            margin: 0;
          }
          .subtitle {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
          }
          .badge {
            background: #eff6ff;
            color: #2563eb;
            border: 1px solid #bfdbfe;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: bold;
            display: inline-block;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 25px;
          }
          .kpi-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
            background: #f8fafc;
            text-align: center;
          }
          .kpi-title {
            font-size: 10px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: bold;
          }
          .kpi-value {
            font-size: 20px;
            font-weight: bold;
            color: #0f172a;
            margin-top: 4px;
          }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #0f172a;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 6px;
            margin-top: 25px;
            margin-bottom: 12px;
          }
          table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          table.data-table th {
            background: #f1f5f9;
            color: #475569;
            font-size: 11px;
            text-transform: uppercase;
            padding: 10px;
            text-align: left;
            border-bottom: 2px solid #cbd5e1;
          }
          .footer-note {
            margin-top: 30px;
            padding: 12px;
            background: #f8fafc;
            border-left: 4px solid #2563eb;
            font-size: 11px;
            color: #475569;
          }
          .signatures {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
          }
          .signature-line {
            width: 45%;
            border-top: 1px solid #94a3b8;
            text-align: center;
            padding-top: 6px;
            font-size: 11px;
            color: #475569;
          }
        </style>
      </head>
      <body>
        
        <table class="header-table">
          <tr>
            <td>
              <h1 class="title">INFORME EJECUTIVO DE INFRAESTRUCTURA TECNOLÓGICA</h1>
              <p class="subtitle">Auditoría consolidada de aulas, dispositivos y gastos de mantenimiento</p>
              <p class="subtitle"><strong>Fecha de Emisión:</strong> ${todayStr}</p>
            </td>
            <td style="text-align: right; vertical-align: top;">
              <span class="badge">UNIVERSIDAD PRIVADA DEL VALLE - UNIVALLE</span>
            </td>
          </tr>
        </table>

        <!-- KPI Grid -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-title">Disponibilidad Campus</div>
            <div class="kpi-value" style="color: #10b981;">${this.data.availabilityRate}%</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Presupuesto Invertido</div>
            <div class="kpi-value">$${this.data.totalBudget.toFixed(2)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Total Equipos</div>
            <div class="kpi-value">${this.data.totalDevices}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Rondas Activas</div>
            <div class="kpi-value">${this.data.activeInspections}</div>
          </div>
        </div>

        <!-- Section 1: Blocks -->
        <div class="section-title">1. DESGLOSE DE DISPONIBILIDAD E INVERSIÓN POR BLOQUE</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Edificio / Pabellón</th>
              <th style="text-align: center;">Aulas Operativas</th>
              <th style="text-align: center;">Disponibilidad</th>
              <th style="text-align: right;">Costo Acumulado</th>
            </tr>
          </thead>
          <tbody>
            ${blockRowsHtml}
          </tbody>
        </table>

        <!-- Section 2: Brands -->
        <div class="section-title">2. CONFIABILIDAD DE FABRICANTES Y MARCAS DE HARDWARE</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Fabricante</th>
              <th style="text-align: center;">Total Equipos</th>
              <th style="text-align: center;">Operativos</th>
              <th style="text-align: center;">En Mantenimiento</th>
              <th style="text-align: right;">Tasa de Fallas</th>
            </tr>
          </thead>
          <tbody>
            ${brandRowsHtml}
          </tbody>
        </table>

        <div class="footer-note">
          <strong>Certificación de Datos:</strong> El presente informe consolida los registros de auditoría técnica y mantenimientos ejecutados en el campus universitario. Datos certificados en tiempo real desde Supabase PostgreSQL.
        </div>

        <div class="signatures">
          <div class="signature-line">
            <strong>Dirección de Tecnología</strong><br>
            Firma y Sello de Validación
          </div>
          <div class="signature-line">
            <strong>Coordinación de Infraestructura</strong><br>
            Responsable de Inspección Técnica
          </div>
        </div>

      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=850,height=900');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(printableHtml);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    } else {
      toast.error('El navegador bloqueó la ventana emergente de impresión. Por favor habilita las ventanas emergentes.');
    }
  }
}
