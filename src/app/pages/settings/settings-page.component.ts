import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideSettings,
  lucideUser,
  lucideDatabase,
  lucideActivity,
  lucidePencil,
  lucideCheckCircle2,
  lucideShield,
  lucideSliders,
  lucideBell,
  lucideLayoutGrid,
  lucideTable,
  lucideRefreshCw,
  lucideWifi,
  lucideGlobe,
  lucideKey,
  lucideMoon,
  lucideSun,
  lucideSparkles,
  lucideLock
} from '@ng-icons/lucide';
import { toast } from 'ngx-sonner';

import { AuthService, PreferredViewMode } from '@/core/auth/auth.service';
import { SupabaseService } from '@/shared/lib/supabase.service';
import { environment } from '../../../environments/environment';

import { ZardSheetService } from '@/shared/components/sheet';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardBadgeComponent } from '@/shared/components/badge';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import {
  ZardCardComponent,
  ZardCardHeaderComponent,
  ZardCardTitleComponent,
  ZardCardDescriptionComponent,
  ZardCardContentComponent
} from '@/shared/components/card';

import { ProfileDrawerComponent } from '@/features/settings/components/profile-drawer.component';
import { ChangePasswordDrawerComponent } from '@/features/settings/components/change-password-drawer.component';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIconComponent,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardSkeletonComponent,
    ZardCardComponent,
    ZardCardHeaderComponent,
    ZardCardTitleComponent,
    ZardCardDescriptionComponent,
    ZardCardContentComponent
  ],
  viewProviders: [
    provideIcons({
      lucideSettings,
      lucideUser,
      lucideDatabase,
      lucideActivity,
      lucidePencil,
      lucideCheckCircle2,
      lucideShield,
      lucideSliders,
      lucideBell,
      lucideLayoutGrid,
      lucideTable,
      lucideRefreshCw,
      lucideWifi,
      lucideGlobe,
      lucideKey,
      lucideMoon,
      lucideSun,
      lucideSparkles,
      lucideLock
    })
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-6 w-full flex-1 animate-fade-in pb-12" role="region" aria-label="Módulo de Configuración del Sistema">
      
      <!-- Module Banner Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-2xs">
        <div class="flex items-center gap-4">
          <div class="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
            <ng-icon name="lucideSettings" class="text-2xl" />
          </div>
          <div>
            <div class="flex items-center gap-2.5 flex-wrap">
              <h1 class="text-xl font-bold tracking-tight text-foreground">Configuración del Sistema</h1>
              <z-badge zType="outline" class="text-xs gap-1.5 py-0.5 px-2.5 border-primary/30 bg-primary/10 text-primary font-medium">
                Plataforma UNIVALLE
              </z-badge>
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              Preferencias de interfaz, diagnóstico de conexión en tiempo real y perfil de cuenta institucional
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            z-button
            zType="outline"
            (click)="testLatencyPing()"
            [zLoading]="isPingTesting()"
            class="gap-2 text-xs"
            aria-label="Probar latencia con la base de datos Supabase"
          >
            <ng-icon name="lucideActivity" class="text-sm text-emerald-500" />
            <span>Probar Latencia BD</span>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Column 1 & 2: Main Settings Sections -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- Section 1: Active User Profile -->
          <div z-card class="shadow-2xs border border-border/80">
            <div z-card-header class="pb-3">
              <div class="flex items-center justify-between">
                <h3 z-card-title class="text-sm font-bold text-foreground flex items-center gap-2">
                  <ng-icon name="lucideUser" class="text-primary text-base" />
                  Perfil del Usuario Activo (UNIVALLE)
                </h3>
                <z-badge zType="default" class="text-[10px] uppercase font-bold">{{ userRole() }}</z-badge>
              </div>
              <p z-card-description class="text-xs text-muted-foreground">
                Información de sesión vinculada a la base de datos institucional
              </p>
            </div>

            <div z-card-content class="pt-2">
              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 border border-border/60">
                <div class="flex items-center gap-3.5">
                  <div class="size-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-base shrink-0">
                    {{ getUserInitials() }}
                  </div>
                  <div>
                    <h4 class="text-sm font-bold text-foreground">{{ userName() }}</h4>
                    <p class="text-xs font-mono text-muted-foreground">{{ userEmail() }}</p>
                    <div class="flex items-center gap-2 mt-1.5">
                      <z-badge zType="outline" class="text-[9px] gap-1 py-0 px-2 border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
                        <ng-icon name="lucideShield" class="text-[10px]" />
                        Sincronizado con BD Supabase
                      </z-badge>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    z-button
                    zType="outline"
                    zSize="sm"
                    (click)="openChangePasswordDrawer()"
                    class="gap-1.5 text-xs text-amber-500 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20"
                    aria-label="Cambiar contraseña de usuario"
                  >
                    <ng-icon name="lucideKey" class="text-xs" />
                    <span>Cambiar Clave</span>
                  </button>

                  <button
                    type="button"
                    z-button
                    zType="outline"
                    zSize="sm"
                    (click)="openProfileDrawer()"
                    class="gap-1.5 text-xs"
                    aria-label="Editar datos del perfil de usuario"
                  >
                    <ng-icon name="lucidePencil" class="text-xs" />
                    <span>Editar Perfil</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: Zard UI Interface Preferences -->
          <div z-card class="shadow-2xs border border-border/80">
            <div z-card-header class="pb-3">
              <div class="flex items-center justify-between">
                <h3 z-card-title class="text-sm font-bold text-foreground flex items-center gap-2">
                  <ng-icon name="lucideSliders" class="text-primary text-base" />
                  Preferencias de Interfaz Zard UI (Globales)
                </h3>
                <z-badge zType="outline" class="text-[10px]">Personalización</z-badge>
              </div>
              <p z-card-description class="text-xs text-muted-foreground">
                Configuración del modo de vista por defecto y notificaciones del sistema
              </p>
            </div>

            <div z-card-content class="pt-2 space-y-4">
              
              <!-- Default View Mode Selector -->
              <div class="p-4 rounded-xl border border-border/60 bg-card flex items-center justify-between gap-4">
                <div>
                  <p class="text-xs font-bold text-foreground">Vista Predeterminada en Todos los Módulos</p>
                  <p class="text-[11px] text-muted-foreground">
                    Define si el sistema iniciará por defecto en vista Tarjetas o Tabla Zard UI
                  </p>
                </div>

                <div class="flex items-center gap-1 p-1 rounded-lg bg-muted/60 border border-border/40 shrink-0" role="group" aria-label="Vista preferida por defecto">
                  <button
                    type="button"
                    (click)="onViewModeChange('grid')"
                    [class.bg-background]="defaultViewMode() === 'grid'"
                    [class.text-foreground]="defaultViewMode() === 'grid'"
                    [class.text-muted-foreground]="defaultViewMode() !== 'grid'"
                    class="px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                    aria-label="Vista predeterminada de tarjetas"
                  >
                    <ng-icon name="lucideLayoutGrid" class="text-xs" />
                    <span>Tarjetas</span>
                  </button>
                  <button
                    type="button"
                    (click)="onViewModeChange('table')"
                    [class.bg-background]="defaultViewMode() === 'table'"
                    [class.text-foreground]="defaultViewMode() === 'table'"
                    [class.text-muted-foreground]="defaultViewMode() !== 'table'"
                    class="px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                    aria-label="Vista predeterminada de tabla"
                  >
                    <ng-icon name="lucideTable" class="text-xs" />
                    <span>Tabla</span>
                  </button>
                </div>
              </div>

              <!-- Notifications Sonner Tester -->
              <div class="p-4 rounded-xl border border-border/60 bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p class="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <ng-icon name="lucideBell" class="text-primary text-xs" />
                    Notificaciones Emergentes (Sonner)
                  </p>
                  <p class="text-[11px] text-muted-foreground">
                    Prueba el funcionamiento de los mensajes de feedback del sistema
                  </p>
                </div>

                <div class="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    z-button
                    zType="outline"
                    zSize="sm"
                    (click)="triggerToast('success')"
                    class="text-[11px] text-emerald-500 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20"
                    aria-label="Probar notificación de éxito"
                  >
                    Éxito
                  </button>
                  <button
                    type="button"
                    z-button
                    zType="outline"
                    zSize="sm"
                    (click)="triggerToast('info')"
                    class="text-[11px] text-blue-500 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20"
                    aria-label="Probar notificación de información"
                  >
                    Info
                  </button>
                  <button
                    type="button"
                    z-button
                    zType="outline"
                    zSize="sm"
                    (click)="triggerToast('error')"
                    class="text-[11px] text-rose-500 border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20"
                    aria-label="Probar notificación de error"
                  >
                    Error
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>

        <!-- Column 3: Live Supabase Diagnostic Monitor -->
        <div z-card class="shadow-2xs border border-border/80 h-fit">
          <div z-card-header class="pb-3">
            <div class="flex items-center justify-between">
              <h3 z-card-title class="text-sm font-bold text-foreground flex items-center gap-2">
                <ng-icon name="lucideDatabase" class="text-emerald-500 text-base" />
                Monitor Servidores UNIVALLE
              </h3>
              <z-badge zType="outline" class="text-[10px] border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
                En Línea
              </z-badge>
            </div>
            <p z-card-description class="text-xs text-muted-foreground">
              Diagnóstico de conexión al clúster de base de datos
            </p>
          </div>

          <div z-card-content class="pt-2 space-y-4">
            
            <!-- Latency Ping Metric -->
            <div class="p-3.5 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <ng-icon name="lucideWifi" class="text-emerald-500 text-base" />
                <span class="text-xs font-bold text-foreground">Latencia de Conexión:</span>
              </div>
              @if (isPingTesting()) {
                <z-skeleton class="h-5 w-16" />
              } @else {
                <span class="text-sm font-bold font-mono text-emerald-500">
                  {{ latencyMs() !== null ? latencyMs() + ' ms' : 'Probar...' }}
                </span>
              }
            </div>

            <!-- Project URL -->
            <div class="space-y-1">
              <span class="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <ng-icon name="lucideGlobe" class="text-xs" />
                URL del Proyecto:
              </span>
              <div class="p-2 rounded-lg bg-muted border border-border/40 font-mono text-[11px] text-foreground truncate">
                {{ projectUrl }}
              </div>
            </div>

            <!-- Anon Key Status -->
            <div class="space-y-1">
              <span class="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <ng-icon name="lucideKey" class="text-xs" />
                API Client Key:
              </span>
              <div class="p-2 rounded-lg bg-muted border border-border/40 font-mono text-[11px] text-muted-foreground truncate">
                {{ anonKeySnippet }}
              </div>
            </div>

            <!-- Synced Tables Overview -->
            <div class="space-y-2 pt-2 border-t border-border/40">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-foreground">Tablas Sincronizadas:</span>
                <span class="font-bold text-emerald-500 font-mono">9 de 9</span>
              </div>

              <div class="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-muted-foreground">
                <span class="px-2 py-1 rounded bg-muted/60 border border-border/30">✓ devices</span>
                <span class="px-2 py-1 rounded bg-muted/60 border border-border/30">✓ device_types</span>
                <span class="px-2 py-1 rounded bg-muted/60 border border-border/30">✓ blocks</span>
                <span class="px-2 py-1 rounded bg-muted/60 border border-border/30">✓ classrooms</span>
                <span class="px-2 py-1 rounded bg-muted/60 border border-border/30">✓ users</span>
                <span class="px-2 py-1 rounded bg-muted/60 border border-border/30">✓ inspections</span>
                <span class="px-2 py-1 rounded bg-muted/60 border border-border/30">✓ classroom_insp</span>
                <span class="px-2 py-1 rounded bg-muted/60 border border-border/30">✓ device_checks</span>
                <span class="px-2 py-1 rounded bg-muted/60 border border-border/30">✓ replacements</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  `
})
export class SettingsPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly sheetService = inject(ZardSheetService);

  readonly user = computed(() => this.authService.user());
  readonly userName = computed(() => this.user()?.name || 'Carlos Moya');
  readonly userEmail = computed(() => this.user()?.email || 'moyacarlos09@gmail.com');
  readonly userRole = computed(() => this.user()?.role || 'admin');

  readonly defaultViewMode = computed(() => this.authService.preferredViewMode());
  readonly latencyMs = signal<number | null>(null);
  readonly isPingTesting = signal<boolean>(false);

  readonly projectUrl = environment.supabaseUrl;
  readonly anonKeySnippet = `${environment.supabaseAnonKey.substring(0, 24)}...`;

  ngOnInit(): void {
    this.testLatencyPing();
  }

  getUserInitials(): string {
    const name = this.userName();
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  onViewModeChange(mode: PreferredViewMode): void {
    this.authService.setPreferredViewMode(mode);
    toast.success(`Modo de vista predeterminado cambiado a: ${mode === 'grid' ? 'Tarjetas' : 'Tabla'}`);
  }

  async testLatencyPing(): Promise<void> {
    this.isPingTesting.set(true);
    const start = performance.now();

    try {
      const { data, error } = await this.supabaseService.client
        .from('blocks')
        .select('id')
        .limit(1);

      const end = performance.now();
      const duration = Math.round(end - start);

      if (error) throw error;

      this.latencyMs.set(duration);
      toast.success(`Prueba de latencia exitosa con Supabase: ${duration} ms`);
    } catch (err: any) {
      this.latencyMs.set(null);
      toast.error('Error al probar latencia con Supabase.');
    } finally {
      this.isPingTesting.set(false);
    }
  }

  openProfileDrawer(): void {
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

  openChangePasswordDrawer(): void {
    const activeUser = this.user();
    if (!activeUser) {
      toast.error('No hay usuario activo en sesión.');
      return;
    }

    this.sheetService.create({
      zContent: ChangePasswordDrawerComponent,
      zSide: 'right',
      zSize: 'default',
      zWidth: '420px',
      zHideFooter: true,
      zData: {
        userId: activeUser.id,
        userName: activeUser.name
      }
    });
  }

  triggerToast(type: 'success' | 'info' | 'error'): void {
    switch (type) {
      case 'success':
        toast.success('¡Operación realizada correctamente con Zard UI!');
        break;
      case 'info':
        toast.info('Información del sistema: Notificaciones configuradas.');
        break;
      case 'error':
        toast.error('Aviso de prueba: Ocurrió una advertencia controlada.');
        break;
    }
  }
}
