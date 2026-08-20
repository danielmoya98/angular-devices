import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lifespan-gauge-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs flex flex-col justify-between h-full gap-4">
      
      <div class="flex items-center justify-between">
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">Proyección de Vida Útil del Campus</h4>
          <p class="text-xs font-semibold text-foreground mt-0.5">Capacidad y Desgaste Global</p>
        </div>
        <span
          class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
          [class]="healthBadgeClass()"
        >
          {{ healthStatus() }}
        </span>
      </div>

      <!-- Semi-Circle / Full Gauge Ring -->
      <div class="flex flex-col sm:flex-row items-center gap-5 my-1">
        <div class="relative size-36 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 100 100" class="size-full transform -rotate-90">
            <!-- Background Arc -->
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              stroke="currentColor"
              stroke-width="10"
              class="text-muted/40"
            ></circle>
            <!-- Gauge Arc Progress -->
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              [attr.stroke]="gaugeColor()"
              stroke-width="10"
              stroke-linecap="round"
              [attr.stroke-dasharray]="dashArray()"
              class="transition-all duration-1000 ease-out"
            ></circle>
          </svg>

          <!-- Central Percentage -->
          <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span class="text-2xl font-black text-foreground font-mono leading-none">
              {{ remainingLifePercentage() }}%
            </span>
            <span class="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-1">
              Salud Restante
            </span>
          </div>
        </div>

        <div class="space-y-2.5 w-full text-xs">
          <div class="p-2.5 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
            <span class="text-muted-foreground font-medium">Horas Consumidas:</span>
            <span class="font-bold text-foreground font-mono">{{ totalUsedHours().toLocaleString() }} hrs</span>
          </div>

          <div class="p-2.5 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
            <span class="text-muted-foreground font-medium">Capacidad Total Campus:</span>
            <span class="font-bold text-foreground font-mono">{{ totalLifespanCapacity().toLocaleString() }} hrs</span>
          </div>

          <div class="p-2.5 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
            <span class="text-muted-foreground font-medium">Horas Disponibles:</span>
            <span class="font-bold text-emerald-500 font-mono">{{ remainingHours().toLocaleString() }} hrs</span>
          </div>
        </div>
      </div>

      <div class="w-full bg-muted rounded-full h-2.5 overflow-hidden border border-border/40">
        <div
          class="h-full rounded-full transition-all duration-700"
          [style.width.%]="remainingLifePercentage()"
          [style.background-color]="gaugeColor()"
        ></div>
      </div>

    </div>
  `
})
export class LifespanGaugeChartComponent {
  readonly totalUsedHours = input<number>(0);
  readonly totalLifespanCapacity = input<number>(0);

  readonly remainingHours = computed(() =>
    Math.max(0, this.totalLifespanCapacity() - this.totalUsedHours())
  );

  readonly remainingLifePercentage = computed(() => {
    const cap = this.totalLifespanCapacity();
    if (cap <= 0) return 100;
    return Math.round((this.remainingHours() / cap) * 100);
  });

  readonly gaugeColor = computed(() => {
    const pct = this.remainingLifePercentage();
    if (pct >= 60) return '#15803D'; // Emerald
    if (pct >= 30) return '#D4A017'; // Amber
    return '#DC2626'; // Destructive Red
  });

  readonly healthStatus = computed(() => {
    const pct = this.remainingLifePercentage();
    if (pct >= 75) return 'Salud Excelente';
    if (pct >= 50) return 'Estado Óptimo';
    if (pct >= 30) return 'Mantenimiento Sugerido';
    return 'Requiere Renovación';
  });

  readonly healthBadgeClass = computed(() => {
    const pct = this.remainingLifePercentage();
    if (pct >= 50) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
    if (pct >= 30) return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
    return 'bg-destructive/10 text-destructive border-destructive/30';
  });

  readonly dashArray = computed(() => {
    const circumference = 2 * Math.PI * 38; // ~238.76
    const strokeLength = (this.remainingLifePercentage() / 100) * circumference;
    const gapLength = circumference - strokeLength;
    return `${strokeLength} ${gapLength}`;
  });
}
