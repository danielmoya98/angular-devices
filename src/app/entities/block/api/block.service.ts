import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from '@shared/lib/supabase.service';
import { Block, CreateBlockDTO, UpdateBlockDTO } from '../model/block.types';

@Injectable({
  providedIn: 'root'
})
export class BlockService {
  private readonly supabaseService = inject(SupabaseService);

  readonly blocks = signal<Block[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  async fetchBlocks(): Promise<Block[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const { data, error } = await this.supabaseService.client
        .from('blocks')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const list = (data || []) as Block[];
      this.blocks.set(list);
      return list;
    } catch (err: any) {
      const msg = err?.message || 'Error al cargar bloques desde Supabase';
      this.error.set(msg);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  async createBlock(dto: CreateBlockDTO): Promise<Block | null> {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabaseService.client
        .from('blocks')
        .insert([dto])
        .select()
        .single();

      if (error) throw error;

      const newBlock = data as Block;
      this.blocks.update(current => [...current, newBlock].sort((a, b) => a.name.localeCompare(b.name)));
      return newBlock;
    } catch (err: any) {
      this.error.set(err?.message || 'Error al crear el bloque');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  async updateBlock(id: string, dto: UpdateBlockDTO): Promise<Block | null> {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabaseService.client
        .from('blocks')
        .update(dto)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updated = data as Block;
      this.blocks.update(current => current.map(b => (b.id === id ? updated : b)));
      return updated;
    } catch (err: any) {
      this.error.set(err?.message || 'Error al actualizar el bloque');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  async deleteBlock(id: string): Promise<boolean> {
    this.loading.set(true);
    try {
      const { error } = await this.supabaseService.client
        .from('blocks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      this.blocks.update(current => current.filter(b => b.id !== id));
      return true;
    } catch (err: any) {
      this.error.set(err?.message || 'Error al eliminar el bloque');
      return false;
    } finally {
      this.loading.set(false);
    }
  }
}
