import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from '@/shared/lib/supabase.service';
import { hashPassword } from '@/shared/utils/hash.util';

export interface DbUser {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  avatar_url?: string | null;
  created_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  name: string;
  email: string;
  password: string;
}

export interface CustomAuthResponse {
  data: { user: DbUser | null };
  error: { message: string; code?: string } | null;
}

export type PreferredViewMode = 'grid' | 'table';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly storageKey = 'app_auth_user_session';
  private readonly viewPrefKey = 'app_preferred_view_mode';

  readonly user = signal<DbUser | null>(null);
  readonly isAuthenticated = computed(() => !!this.user());
  readonly preferredViewMode = signal<PreferredViewMode>('grid');

  readonly userRole = computed(() => this.user()?.role || '');
  readonly isAdmin = computed(() => this.userRole() === 'admin');
  readonly isTechSupport = computed(() => this.userRole() === 'tech_support');
  readonly isViewer = computed(() => this.userRole() === 'viewer');
  readonly canEdit = computed(() => this.isAdmin() || this.isTechSupport());
  readonly canDelete = computed(() => this.isAdmin());
  readonly canManageUsers = computed(() => this.isAdmin());

  constructor() {
    this.restoreSession();
    this.restoreViewPreference();
  }

  private restoreViewPreference(): void {
    try {
      const savedPref = localStorage.getItem(this.viewPrefKey) as PreferredViewMode;
      if (savedPref === 'grid' || savedPref === 'table') {
        this.preferredViewMode.set(savedPref);
      }
    } catch {
      // default 'grid'
    }
  }

  setPreferredViewMode(mode: PreferredViewMode): void {
    this.preferredViewMode.set(mode);
    try {
      localStorage.setItem(this.viewPrefKey, mode);
    } catch {
      // ignore
    }
  }

  private async restoreSession(): Promise<void> {
    try {
      const savedUser = localStorage.getItem(this.storageKey);
      if (savedUser) {
        const parsed = JSON.parse(savedUser) as DbUser;
        this.user.set(parsed);
      } else {
        await this.fetchDefaultUserFromSupabase();
      }
    } catch {
      localStorage.removeItem(this.storageKey);
      await this.fetchDefaultUserFromSupabase();
    }
  }

  async fetchDefaultUserFromSupabase(): Promise<DbUser | null> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('users')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;

      const profile: DbUser = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        is_active: data.is_active,
        avatar_url: data.avatar_url,
        created_at: data.created_at
      };

      this.user.set(profile);
      localStorage.setItem(this.storageKey, JSON.stringify(profile));
      return profile;
    } catch {
      return null;
    }
  }

  async updateUserProfile(id: string, name: string, email: string): Promise<boolean> {
    try {
      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();

      const { data, error } = await this.supabaseService.client
        .from('users')
        .update({
          name: cleanName,
          email: cleanEmail
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedProfile: DbUser = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        is_active: data.is_active,
        avatar_url: data.avatar_url,
        created_at: data.created_at
      };

      this.user.set(updatedProfile);
      localStorage.setItem(this.storageKey, JSON.stringify(updatedProfile));
      return true;
    } catch (err: any) {
      console.error('Error al actualizar el perfil en Supabase:', err);
      return false;
    }
  }

  async changePassword(userId: string, currentPass: string, newPass: string): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Fetch current password_hash from Supabase
      const { data: dbUser, error } = await this.supabaseService.client
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single();

      if (error || !dbUser) {
        return { success: false, message: 'Usuario no encontrado en la base de datos.' };
      }

      // 2. Hash input current password and verify
      const inputCurrentHash = await hashPassword(currentPass);
      if (dbUser.password_hash !== inputCurrentHash) {
        return { success: false, message: 'La contraseña actual ingresada es incorrecta.' };
      }

      // 3. Hash new password and update in Supabase
      const newHash = await hashPassword(newPass);
      const { error: updateError } = await this.supabaseService.client
        .from('users')
        .update({ password_hash: newHash })
        .eq('id', userId);

      if (updateError) {
        return { success: false, message: updateError.message || 'Error al actualizar la contraseña.' };
      }

      return { success: true, message: 'Contraseña actualizada en Supabase exitosamente.' };
    } catch (err: any) {
      return { success: false, message: 'Error de conexión con la base de datos.' };
    }
  }

  async signInWithPassword(credentials: LoginCredentials): Promise<CustomAuthResponse> {
    const cleanEmail = credentials.email.trim().toLowerCase();

    // Query custom database table 'public.users' directly
    const { data: dbUser, error: queryError } = await this.supabaseService.client
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (queryError) {
      return { data: { user: null }, error: { message: 'Error de conexión con la base de datos.' } };
    }

    if (!dbUser) {
      return { data: { user: null }, error: { message: 'El usuario no está registrado en el sistema.', code: 'invalid_credentials' } };
    }

    if (!dbUser.is_active) {
      return { data: { user: null }, error: { message: 'Tu cuenta de usuario se encuentra inactiva. Contacta al administrador.' } };
    }

    // Verify password hash
    const inputHash = await hashPassword(credentials.password);
    if (dbUser.password_hash !== inputHash) {
      return { data: { user: null }, error: { message: 'Credenciales inválidas.', code: 'invalid_credentials' } };
    }

    // Create session profile (excluding password_hash)
    const userProfile: DbUser = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      is_active: dbUser.is_active,
      avatar_url: dbUser.avatar_url,
      created_at: dbUser.created_at
    };

    this.user.set(userProfile);
    localStorage.setItem(this.storageKey, JSON.stringify(userProfile));

    return { data: { user: userProfile }, error: null };
  }

  async signUp(credentials: SignUpCredentials): Promise<CustomAuthResponse> {
    const cleanEmail = credentials.email.trim().toLowerCase();

    // Check if email exists
    const { data: existingUser } = await this.supabaseService.client
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingUser) {
      return { data: { user: null }, error: { message: 'El correo electrónico ya está registrado.' } };
    }

    const hashedPassword = await hashPassword(credentials.password);

    // Insert new user into public.users
    const { data: insertedUser, error: insertError } = await this.supabaseService.client
      .from('users')
      .insert({
        name: credentials.name || 'Usuario',
        email: cleanEmail,
        password_hash: hashedPassword,
        role: 'tech_support',
        is_active: true
      })
      .select()
      .single();

    if (insertError || !insertedUser) {
      return { data: { user: null }, error: { message: insertError?.message || 'Error al crear la cuenta en la base de datos.' } };
    }

    const userProfile: DbUser = {
      id: insertedUser.id,
      name: insertedUser.name,
      email: insertedUser.email,
      role: insertedUser.role,
      is_active: insertedUser.is_active,
      avatar_url: insertedUser.avatar_url,
      created_at: insertedUser.created_at
    };

    this.user.set(userProfile);
    localStorage.setItem(this.storageKey, JSON.stringify(userProfile));

    return { data: { user: userProfile }, error: null };
  }

  signOut(): void {
    this.user.set(null);
    localStorage.removeItem(this.storageKey);
  }
}
