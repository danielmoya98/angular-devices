import { Component, ChangeDetectionStrategy, input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DeviceStatusStat {
  label: string;
  count: number;
  color: string;
  bgClass: string;
  textClass: string;
}

@Component({
  selector: 'app-status-donut-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col md:flex-row items-center gap-6 p-4 rounded-2xl bg-card border border-border/80 shadow-2xs">
      
      <!-- SVG Donut Chart Container -->
      <div class="relative size-44 shrink-0 flex items-center justify-center">
        <svg viewBox="0 0 100 100" class="size-full transform -rotate-90">
          <!-- Background Base Ring -->
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="transparent"
            stroke="currentColor"
            stroke-width="12"
            class="text-muted/40"
          ></circle>

          <!-- SVG Donut Segments -->
          @for (s of slices(); track s.label) {
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              [attr.stroke]="s.color"
              stroke-width="12"
              [attr.stroke-dasharray]="s.dashArray"
              [attr.stroke-dashoffset]="s.dashOffset"
              class="transition-all duration-700 ease-out cursor-pointer hover:opacity-90"
              (mouseenter)="hoveredSegment.set(s.label)"
              (mouseleave)="hoveredSegment.set(null)"
            ></circle>
          }
        </svg>

        <!-- Central Donut Text -->
        <div class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span class="text-2xl font-extrabold text-foreground font-mono leading-none">
            {{ activeStat() ? activeStat()?.count : total() }}
          </span>
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1 truncate max-w-[90px]">
            {{ activeStat() ? activeStat()?.label : 'Equipos' }}
          </span>
        </div>
      </div>

      <!-- Legend & Stats List -->
      <div class="flex-1 w-full space-y-2.5">
        @for (item of stats(); track item.label) {
          <div
            class="p-2.5 rounded-xl border border-border/60 transition-all duration-200 flex items-center justify-between cursor-pointer"
            [class.bg-muted/60]="hoveredSegment() === item.label"
            [class.border-primary/40]="hoveredSegment() === item.label"
            (mouseenter)="hoveredSegment.set(item.label)"
            (mouseleave)="hoveredSegment.set(null)"
          >
            <div class="flex items-center gap-2.5">
              <span class="size-3 rounded-full shrink-0 shadow-2xs" [style.background-color]="item.color"></span>
              <span class="text-xs font-bold text-foreground">{{ item.label }}</span>
            </div>

            <div class="flex items-center gap-3">
              <span class="text-xs font-mono font-bold text-foreground">{{ item.count }}</span>
              <span class="text-[11px] font-mono text-muted-foreground min-w-[36px] text-right font-medium">
                {{ getPercentage(item.count) }}%
              </span>
            </div>
          </div>
        }
      </div>

    </div>
  `
})
export class StatusDonutChartComponent {
  readonly operational = input<number>(0);
  readonly maintenance = input<number>(0);
  readonly damaged = input<number>(0);
  readonly stored = input<number>(0);

  readonly hoveredSegment = signal<string | null>(null);

  readonly total = computed(() =>
    this.operational() + this.maintenance() + this.damaged() + this.stored()
  );

  readonly stats = computed<DeviceStatusStat[]>(() => [
    { label: 'Operativos', count: this.operational(), color: '#15803D', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-500' },
    { label: 'Mantenimiento', count: this.maintenance(), color: '#D4A017', bgClass: 'bg-amber-500/10', textClass: 'text-amber-500' },
    { label: 'Dañados', count: this.damaged(), color: '#DC2626', bgClass: 'bg-destructive/10', textClass: 'text-destructive' },
    { label: 'En Almacén', count: this.stored(), color: '#0B2341', bgClass: 'bg-primary/10', textClass: 'text-primary' }
  ]);

  readonly activeStat = computed(() => {
    const label = this.hoveredSegment();
    if (!label) return null;
    return this.stats().find(s => s.label === label) || null;
  });

  readonly slices = computed(() => {
    const tot = this.total();
    if (tot === 0) return [];

    const circumference = 2 * Math.PI * 38; // ~238.76
    let cumulativeOffset = 0;

    return this.stats().map(s => {
      const fraction = s.count / tot;
      const strokeLength = fraction * circumference;
      const gapLength = circumference - strokeLength;
      const offset = -cumulativeOffset;

      cumulativeOffset += strokeLength;

      return {
        ...s,
        dashArray: `${strokeLength} ${gapLength}`,
        dashOffset: offset
      };
    });
  });

  getPercentage(count: number): number {
    const tot = this.total();
    if (tot === 0) return 0;
    return Math.round((count / tot) * 100);
  }
}
