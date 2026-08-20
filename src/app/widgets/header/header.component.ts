import { Component } from '@angular/core';
import { ZardButtonComponent } from '@shared/components/button';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ZardButtonComponent],
  template: `
    <header class="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-white flex items-center justify-center p-0.5 shadow-xs border border-primary/20">
          <img src="assets/images/univalle-logo-red.png" alt="UNIVALLE" class="size-full object-contain" />
        </div>
        <div>
          <h1 class="text-lg font-bold leading-none text-foreground">Universidad Privada del Valle</h1>
          <p class="text-xs text-muted-foreground mt-1 font-medium">Gestión de Infraestructura y Dispositivos IoT (UNIVALLE)</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button z-button zType="outline" zSize="sm" class="border-emerald-500/30 text-emerald-600 bg-emerald-500/10 font-bold">
          <span>Servidor UNIVALLE: En Línea</span>
        </button>
      </div>
    </header>
  `
})
export class HeaderComponent {}
