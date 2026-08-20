import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from '@shared/lib/supabase.service';
import { DeviceReplacement, CreateReplacementDTO, UpdateReplacementDTO } from '../model/replacement.types';

@Injectable({
  providedIn: 'root'
})
export class ReplacementService {
  private readonly supabaseService = inject(SupabaseService);

  readonly replacements = signal<DeviceReplacement[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  async fetchReplacements(): Promise<DeviceReplacement[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const { data, error } = await this.supabaseService.client
        .from('device_replacements')
        .select(`
          *,
          device:devices(
            *,
            type:device_types(*),
            classroom:classrooms(
              *,
              block:blocks(*)
            )
          ),
          user:users(*)
        `)
        .order('replaced_at', { ascending: false });

      if (error) throw error;

      const list = (data || []) as DeviceReplacement[];
      this.replacements.set(list);
      return list;
    } catch (err: any) {
      const msg = err?.message || 'Error al cargar repuestos desde Supabase';
      this.error.set(msg);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  async createReplacement(dto: CreateReplacementDTO): Promise<DeviceReplacement | null> {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabaseService.client
        .from('device_replacements')
        .insert([dto])
        .select(`
          *,
          device:devices(
            *,
            type:device_types(*),
            classroom:classrooms(
              *,
              block:blocks(*)
            )
          ),
          user:users(*)
        `)
        .single();

      if (error) throw error;

      const newReplacement = data as DeviceReplacement;
      this.replacements.update(current => [newReplacement, ...current]);
      return newReplacement;
    } catch (err: any) {
      this.error.set(err?.message || 'Error al registrar el repuesto');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  async updateReplacement(id: string, dto: UpdateReplacementDTO): Promise<DeviceReplacement | null> {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabaseService.client
        .from('device_replacements')
        .update(dto)
        .eq('id', id)
        .select(`
          *,
          device:devices(
            *,
            type:device_types(*),
            classroom:classrooms(
              *,
              block:blocks(*)
            )
          ),
          user:users(*)
        `)
        .single();

      if (error) throw error;

      const updated = data as DeviceReplacement;
      this.replacements.update(current => current.map(r => (r.id === id ? updated : r)));
      return updated;
    } catch (err: any) {
      this.error.set(err?.message || 'Error al actualizar el repuesto');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  async deleteReplacement(id: string): Promise<boolean> {
    this.loading.set(true);
    try {
      const { error } = await this.supabaseService.client
        .from('device_replacements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      this.replacements.update(current => current.filter(r => r.id !== id));
      return true;
    } catch (err: any) {
      this.error.set(err?.message || 'Error al eliminar el repuesto');
      return false;
    } finally {
      this.loading.set(false);
    }
  }
}
