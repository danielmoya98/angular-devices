import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'z-skeleton',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      [class]="classNames()"
      role="progressbar"
      aria-busy="true"
      aria-label="Cargando contenido..."
    ></div>
  `
})
export class ZardSkeletonComponent {
  readonly class = input<string>('');
  
  readonly classNames = () => `animate-pulse bg-muted/70 rounded-md ${this.class()}`;
}
