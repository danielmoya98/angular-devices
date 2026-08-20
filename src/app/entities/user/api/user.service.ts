import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from '@shared/lib/supabase.service';
import { User, CreateUserDTO, UpdateUserDTO } from '../model/user.types';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly supabaseService = inject(SupabaseService);

  readonly users = signal<User[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  async fetchUsers(): Promise<User[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const { data, error } = await this.supabaseService.client
        .from('users')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const list = (data || []) as User[];
      this.users.set(list);
      return list;
    } catch (err: any) {
      const msg = err?.message || 'Error al cargar usuarios desde Supabase';
      this.error.set(msg);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  async createUser(dto: CreateUserDTO): Promise<User | null> {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabaseService.client
        .from('users')
        .insert([dto])
        .select()
        .single();

      if (error) throw error;

      const newUser = data as User;
      this.users.update(current => [...current, newUser].sort((a, b) => a.name.localeCompare(b.name)));
      return newUser;
    } catch (err: any) {
      this.error.set(err?.message || 'Error al crear el usuario');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  async updateUser(id: string, dto: UpdateUserDTO): Promise<User | null> {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabaseService.client
        .from('users')
        .update(dto)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updated = data as User;
      this.users.update(current => current.map(u => (u.id === id ? updated : u)));
      return updated;
    } catch (err: any) {
      this.error.set(err?.message || 'Error al actualizar el usuario');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  async toggleUserStatus(id: string, currentStatus: boolean): Promise<User | null> {
    return this.updateUser(id, { is_active: !currentStatus });
  }

  async deleteUser(id: string): Promise<boolean> {
    this.loading.set(true);
    try {
      const { error } = await this.supabaseService.client
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      this.users.update(current => current.filter(u => u.id !== id));
      return true;
    } catch (err: any) {
      this.error.set(err?.message || 'Error al eliminar el usuario');
      return false;
    } finally {
      this.loading.set(false);
    }
  }
}
