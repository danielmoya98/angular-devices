import { Component, ChangeDetectionStrategy, ViewEncapsulation, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { z } from 'zod';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideMail,
  lucideLock,
  lucideEye,
  lucideEyeOff,
  lucideShieldAlert,
  lucideCheckCircle2,
  lucideArrowRight,
  lucideLoader2,
  lucideLayers,
  lucideUser,
  lucideChevronLeft,
  lucideChevronRight
} from '@ng-icons/lucide';

import { AuthService } from '@/core/auth/auth.service';
import { RateLimiterService } from '@/core/auth/rate-limiter.service';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardInputComponent } from '@/shared/components/input';
import { ZardCheckboxComponent } from '@/shared/components/checkbox';
import { ZardFieldImports } from '@/shared/components/field/field.imports';
import { toast } from 'ngx-sonner';

export interface CampusSlide {
  image: string;
  title: string;
  subtitle: string;
}

const loginSchema = z.object({
  email: z.string().trim().min(1, 'El correo electrónico es requerido').email('Ingresa un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

const signUpSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().trim().min(1, 'El correo electrónico es requerido').email('Ingresa un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIconComponent,
    ZardButtonComponent,
    ZardInputComponent,
    ZardFieldImports
  ],
  viewProviders: [
    provideIcons({
      lucideMail,
      lucideLock,
      lucideEye,
      lucideEyeOff,
      lucideShieldAlert,
      lucideCheckCircle2,
      lucideArrowRight,
      lucideLoader2,
      lucideLayers,
      lucideUser,
      lucideChevronLeft,
      lucideChevronRight
    })
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly rateLimiter = inject(RateLimiterService);
  private readonly router = inject(Router);

  // Form field signals matching DB schema
  readonly name = signal('Carlos Moya');
  readonly email = signal('moyacarlos09@gmail.com');
  readonly password = signal('MoyaTest123!');
  readonly rememberMe = signal(true);
  readonly showPassword = signal(false);
  readonly isSignUpMode = signal(false);

  // Status signals
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly formErrors = signal<{ name?: string; email?: string; password?: string }>({});
  readonly isShaking = signal(false);

  // Campus Image Slider Signals
  readonly currentSlideIndex = signal(0);
  private slideIntervalId: any = null;

  readonly campusSlides: CampusSlide[] = [
    {
      image: 'assets/images/campus1.jpeg',
      title: 'Supervisión e Infraestructura del Campus',
      subtitle: 'Monitoreo proactivo en tiempo real de aulas, auditorios y laboratorios de computación.'
    },
    {
      image: 'assets/images/campus2.jpeg',
      title: 'Rondas Técnicas e Inspecciones Digitales',
      subtitle: 'Checklists interactivos en vivo para la verificación de proyectores, audio y conectividad HDMI.'
    },
    {
      image: 'assets/images/campus3.jpeg',
      title: 'Gestión Inteligente UNIVALLE',
      subtitle: 'Control centralizado del inventario IoT, repuestos e indicadores clave de rendimiento.'
    }
  ];

  // Reactive rate limiting
  readonly isLocked = computed(() => this.rateLimiter.isLocked(this.email()));
  readonly lockoutSeconds = computed(() => this.rateLimiter.getLockoutSecondsRemaining(this.email()));
  readonly attemptsRemaining = computed(() => this.rateLimiter.getAttemptsRemaining(this.email()));

  readonly formattedLockoutTime = computed(() => {
    const totalSecs = this.lockoutSeconds();
    const minutes = Math.floor(totalSecs / 60);
    const seconds = totalSecs % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  ngOnInit(): void {
    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  private startAutoSlide(): void {
    this.stopAutoSlide();
    this.slideIntervalId = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  private stopAutoSlide(): void {
    if (this.slideIntervalId) {
      clearInterval(this.slideIntervalId);
      this.slideIntervalId = null;
    }
  }

  setSlide(index: number): void {
    this.currentSlideIndex.set(index);
    this.startAutoSlide();
  }

  nextSlide(): void {
    this.currentSlideIndex.update(idx => (idx + 1) % this.campusSlides.length);
  }

  prevSlide(): void {
    this.currentSlideIndex.update(idx => (idx - 1 + this.campusSlides.length) % this.campusSlides.length);
    this.startAutoSlide();
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(prev => !prev);
  }

  toggleSignUpMode(): void {
    this.isSignUpMode.update(v => !v);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.formErrors.set({});
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.formErrors.set({});

    // Check rate limit lockout
    if (this.isLocked()) {
      this.triggerShake();
      this.errorMessage.set(`Demasiados intentos fallidos. Inténtalo de nuevo en ${this.formattedLockoutTime()}.`);
      toast.error('Cuenta bloqueada temporalmente');
      return;
    }

    // Validate fields using Zod
    if (this.isSignUpMode()) {
      const validationResult = signUpSchema.safeParse({
        name: this.name(),
        email: this.email(),
        password: this.password()
      });

      if (!validationResult.success) {
        this.triggerShake();
        const formattedErrors: { name?: string; email?: string; password?: string } = {};
        for (const err of validationResult.error.issues) {
          const field = err.path[0] as 'name' | 'email' | 'password';
          formattedErrors[field] = err.message;
        }
        this.formErrors.set(formattedErrors);
        toast.error('Por favor corrige los errores del formulario');
        return;
      }

      await this.handleSignUp();

    } else {
      const validationResult = loginSchema.safeParse({
        email: this.email(),
        password: this.password()
      });

      if (!validationResult.success) {
        this.triggerShake();
        const formattedErrors: { email?: string; password?: string } = {};
        for (const err of validationResult.error.issues) {
          const field = err.path[0] as 'email' | 'password';
          formattedErrors[field] = err.message;
        }
        this.formErrors.set(formattedErrors);
        toast.error('Por favor ingresa un correo y contraseña válidos');
        return;
      }

      await this.handleSignIn();
    }
  }

  private async handleSignIn(): Promise<void> {
    this.isLoading.set(true);

    try {
      const response = await this.authService.signInWithPassword({
        email: this.email(),
        password: this.password()
      });

      if (response.error) {
        this.isLoading.set(false);
        this.triggerShake();

        const limitInfo = this.rateLimiter.recordFailedAttempt(this.email());
        if (limitInfo.isLockedNow) {
          this.errorMessage.set('Has superado el límite de intentos fallidos. Tu acceso se ha bloqueado por 5 minutos.');
          toast.error('Acceso bloqueado');
        } else {
          this.errorMessage.set(response.error.message);
          toast.error('Error de autenticación');
        }
        return;
      }

      // Successful Authentication
      this.rateLimiter.resetAttempts(this.email());
      this.isLoading.set(false);
      const userName = response.data.user?.name || 'Usuario';
      this.successMessage.set(`¡Bienvenido de nuevo, ${userName}! Accediendo al sistema...`);
      toast.success(`¡Bienvenido, ${userName}!`);

      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 1000);

    } catch {
      this.isLoading.set(false);
      this.triggerShake();
      this.errorMessage.set('Ocurrió un error inesperado al conectar con el servidor.');
      toast.error('Error de conexión');
    }
  }

  private async handleSignUp(): Promise<void> {
    try {
      const response = await this.authService.signUp({
        name: this.name(),
        email: this.email(),
        password: this.password()
      });

      if (response.error) {
        this.isLoading.set(false);
        this.triggerShake();
        this.errorMessage.set(response.error.message);
        toast.error('Error al registrar usuario');
        return;
      }

      this.isLoading.set(false);
      this.successMessage.set('Cuenta registrada exitosamente. Ya puedes iniciar sesión.');
      toast.success('Cuenta creada exitosamente');
      this.isSignUpMode.set(false);
    } catch {
      this.isLoading.set(false);
      this.triggerShake();
      this.errorMessage.set('Error inesperado al crear la cuenta.');
      toast.error('Error de registro');
    }
  }

  private triggerShake(): void {
    this.isShaking.set(true);
    setTimeout(() => this.isShaking.set(false), 500);
  }
}
