import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from '@shared/lib/supabase.service';
import { Classroom, CreateClassroomDTO, UpdateClassroomDTO } from '../model/classroom.types';

@Injectable({
  providedIn: 'root'
})
export class ClassroomService {
  private readonly supabaseService = inject(SupabaseService);

  readonly classrooms = signal<Classroom[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  async fetchClassrooms(): Promise<Classroom[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const { data, error } = await this.supabaseService.client
        .from('classrooms')
        .select(`
          *,
          block:blocks(*)
        `)
        .order('code', { ascending: true });

      if (error) throw error;

      const list = (data || []) as Classroom[];
      this.classrooms.set(list);
      return list;
    } catch (err: any) {
      const msg = err?.message || 'Error al cargar aulas desde Supabase';
      this.error.set(msg);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  async createClassroom(dto: CreateClassroomDTO): Promise<Classroom | null> {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabaseService.client
        .from('classrooms')
        .insert([dto])
        .select(`*, block:blocks(*)`)
        .single();

      if (error) throw error;

      const newClassroom = data as Classroom;
      this.classrooms.update(current => [...current, newClassroom].sort((a, b) => a.code.localeCompare(b.code)));
      return newClassroom;
    } catch (err: any) {
      this.error.set(err?.message || 'Error al crear el aula');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  async updateClassroom(id: string, dto: UpdateClassroomDTO): Promise<Classroom | null> {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabaseService.client
        .from('classrooms')
        .update(dto)
        .eq('id', id)
        .select(`*, block:blocks(*)`)
        .single();

      if (error) throw error;

      const updated = data as Classroom;
      this.classrooms.update(current => current.map(c => (c.id === id ? updated : c)));
      return updated;
    } catch (err: any) {
      this.error.set(err?.message || 'Error al actualizar el aula');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  async deleteClassroom(id: string): Promise<boolean> {
    this.loading.set(true);
    try {
      const { error } = await this.supabaseService.client
        .from('classrooms')
        .delete()
        .eq('id', id);

      if (error) throw error;

      this.classrooms.update(current => current.filter(c => c.id !== id));
      return true;
    } catch (err: any) {
      this.error.set(err?.message || 'Error al eliminar el aula');
      return false;
    } finally {
      this.loading.set(false);
    }
  }
}
