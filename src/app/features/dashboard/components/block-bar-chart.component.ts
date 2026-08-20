import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlockAnalytics } from './executive-report-drawer.component';

@Component({
  selector: 'app-block-bar-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-5 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-4">
      
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-bold text-foreground">Rendimiento e Inversión por Bloque</h3>
          <p class="text-xs text-muted-foreground">Disponibilidad operacional de aulas e inversión acumulada en repuestos</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="activeMetric.set('availability')"
            [class.bg-primary]="activeMetric() === 'availability'"
            [class.text-primary-foreground]="activeMetric() === 'availability'"
            [class.bg-muted]="activeMetric() !== 'availability'"
            [class.text-muted-foreground]="activeMetric() !== 'availability'"
            class="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
          >
            Disponibilidad %
          </button>
          <button
            type="button"
            (click)="activeMetric.set('cost')"
            [class.bg-primary]="activeMetric() === 'cost'"
            [class.text-primary-foreground]="activeMetric() === 'cost'"
            [class.bg-muted]="activeMetric() !== 'cost'"
            [class.text-muted-foreground]="activeMetric() !== 'cost'"
            class="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
          >
            Inversión $
          </button>
        </div>
      </div>

      <!-- Chart Body -->
      <div class="space-y-3 pt-2">
        @for (b of blocks(); track b.id) {
          <div class="space-y-1.5 group cursor-pointer">
            
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <span class="size-2 rounded-full bg-primary"></span>
                <span class="font-bold text-foreground">{{ b.name }} (Bloque {{ b.code }})</span>
              </div>
              
              <div class="flex items-center gap-3">
                @if (activeMetric() === 'availability') {
                  <span class="font-bold font-mono text-emerald-500">{{ b.availabilityRate }}% Aulas Funcionales</span>
                } @else {
                  <span class="font-bold font-mono text-purple-500">\${{ b.totalMaintenanceCost.toFixed(2) }} Repuestos</span>
                }
              </div>
            </div>

            <!-- Bar Track -->
            <div class="w-full bg-muted/60 rounded-full h-3 overflow-hidden border border-border/40 relative">
              @if (activeMetric() === 'availability') {
                <div
                  class="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-primary to-emerald-500"
                  [style.width.%]="b.availabilityRate"
                ></div>
              } @else {
                <div
                  class="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-purple-600 to-primary"
                  [style.width.%]="getCostPercentage(b.totalMaintenanceCost)"
                ></div>
              }
            </div>

          </div>
        }
      </div>

    </div>
  `
})
export class BlockBarChartComponent {
  readonly blocks = input<BlockAnalytics[]>([]);
  readonly activeMetric = signal<'availability' | 'cost'>('availability');

  getCostPercentage(cost: number): number {
    const list = this.blocks();
    if (list.length === 0) return 0;
    const maxCost = Math.max(...list.map(b => b.totalMaintenanceCost), 1);
    return Math.round((cost / maxCost) * 100);
  }
}
