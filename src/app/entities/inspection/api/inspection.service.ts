import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from '@shared/lib/supabase.service';
import {
  Inspection,
  CreateInspectionDTO,
  CreateClassroomInspectionDTO,
  CreateDeviceCheckDTO
} from '../model/inspection.types';

@Injectable({
  providedIn: 'root'
})
export class InspectionService {
  private readonly supabaseService = inject(SupabaseService);

  readonly inspections = signal<Inspection[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  async fetchInspections(): Promise<Inspection[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const { data, error } = await this.supabaseService.client
        .from('inspections')
        .select(`
          *,
          inspector:users(*),
          classroom_inspections(
            *,
            classroom:classrooms(
              *,
              block:blocks(*)
            ),
            device_check_items(
              *,
              device:devices(*)
            )
          )
        `)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;

      const list = (data || []) as Inspection[];
      this.inspections.set(list);
      return list;
    } catch (err: any) {
      const msg = err?.message || 'Error al cargar inspecciones desde Supabase';
      this.error.set(msg);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  async createInspection(dto: CreateInspectionDTO): Promise<Inspection | null> {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabaseService.client
        .from('inspections')
        .insert([{
          ...dto,
          started_at: new Date().toISOString()
        }])
        .select(`
          *,
          inspector:users(*),
          classroom_inspections(
            *,
            classroom:classrooms(
              *,
              block:blocks(*)
            ),
            device_check_items(
              *,
              device:devices(*)
            )
          )
        `)
        .single();

      if (error) throw error;

      const newInspection = data as Inspection;
      this.inspections.update(current => [newInspection, ...current]);
      return newInspection;
    } catch (err: any) {
      this.error.set(err?.message || 'Error al programar la inspección');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  async completeInspection(id: string): Promise<boolean> {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabaseService.client
        .from('inspections')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *,
          inspector:users(*),
          classroom_inspections(
            *,
            classroom:classrooms(
              *,
              block:blocks(*)
            ),
            device_check_items(
              *,
              device:devices(*)
            )
          )
        `)
        .single();

      if (error) throw error;

      const updated = data as Inspection;
      this.inspections.update(current => current.map(i => (i.id === id ? updated : i)));
      return true;
    } catch (err: any) {
      this.error.set(err?.message || 'Error al completar la inspección');
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  async saveClassroomChecklist(
    classroomInspectionDto: CreateClassroomInspectionDTO,
    deviceChecks: Omit<CreateDeviceCheckDTO, 'classroom_inspection_id'>[]
  ): Promise<boolean> {
    this.loading.set(true);
    try {
      // 1. Insert or update classroom_inspection
      const { data: ciData, error: ciError } = await this.supabaseService.client
        .from('classroom_inspections')
        .insert([{
          inspection_id: classroomInspectionDto.inspection_id,
          classroom_id: classroomInspectionDto.classroom_id,
          checked_at: new Date().toISOString(),
          is_fully_operational: classroomInspectionDto.is_fully_operational,
          notes: classroomInspectionDto.notes || ''
        }])
        .select()
        .single();

      if (ciError) throw ciError;

      const classroomInspectionId = ciData.id;

      // 2. Insert device_check_items if present & update devices used_hours in Supabase
      if (deviceChecks.length > 0) {
        const checkItemsPayload = deviceChecks.map(({ used_hours, ...rest }: any) => ({
          classroom_inspection_id: classroomInspectionId,
          ...rest
        }));

        const { error: dError } = await this.supabaseService.client
          .from('device_check_items')
          .insert(checkItemsPayload);

        if (dError) throw dError;

        // Update each device's used_hours in Supabase devices table
        for (const item of deviceChecks as any[]) {
          if (item.device_id && item.used_hours !== undefined) {
            await this.supabaseService.client
              .from('devices')
              .update({
                used_hours: item.used_hours,
                updated_at: new Date().toISOString()
              })
              .eq('id', item.device_id);
          }
        }
      }

      await this.fetchInspections();
      return true;
    } catch (err: any) {
      this.error.set(err?.message || 'Error al guardar el checklist del aula');
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  async deleteInspection(id: string): Promise<boolean> {
    this.loading.set(true);
    try {
      const { error } = await this.supabaseService.client
        .from('inspections')
        .delete()
        .eq('id', id);

      if (error) throw error;

      this.inspections.update(current => current.filter(i => i.id !== id));
      return true;
    } catch (err: any) {
      this.error.set(err?.message || 'Error al eliminar la inspección');
      return false;
    } finally {
      this.loading.set(false);
    }
  }
}
