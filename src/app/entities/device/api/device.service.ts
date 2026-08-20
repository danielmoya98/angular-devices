import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from '@shared/lib/supabase.service';
import { Device, DeviceType, CreateDeviceDTO, UpdateDeviceDTO, CreateDeviceTypeDTO } from '../model/device.types';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private readonly supabaseService = inject(SupabaseService);

  readonly devices = signal<Device[]>([]);
  readonly deviceTypes = signal<DeviceType[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  async fetchDevices(): Promise<Device[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const { data, error } = await this.supabaseService.client
        .from('devices')
        .select(`
          *,
          type:device_types(*),
          classroom:classrooms(
            *,
            block:blocks(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const list = (data || []) as Device[];
      this.devices.set(list);
      return list;
    } catch (err: any) {
      const errMsg = err?.message || 'Error al cargar dispositivos desde Supabase';
      this.error.set(errMsg);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  async fetchDeviceTypes(): Promise<DeviceType[]> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('device_types')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const list = (data || []) as DeviceType[];
      this.deviceTypes.set(list);
      return list;
    } catch (err: any) {
      console.error('Error fetching device types:', err);
      return [];
    }
  }

  async createDevice(dto: CreateDeviceDTO): Promise<Device | null> {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabaseService.client
        .from('devices')
        .insert([dto])
        .select(`
          *,
          type:device_types(*),
          classroom:classrooms(
            *,
            block:blocks(*)
          )
        `)
        .single();

      if (error) throw error;

      const newDevice = data as Device;
      this.devices.update(current => [newDevice, ...current]);
      return newDevice;
    } catch (err: any) {
      this.error.set(err?.message || 'Error al crear el dispositivo');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  async updateDevice(id: string, dto: UpdateDeviceDTO): Promise<Device | null> {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabaseService.client
        .from('devices')
        .update({
          ...dto,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          type:device_types(*),
          classroom:classrooms(
            *,
            block:blocks(*)
          )
        `)
        .single();

      if (error) throw error;

      const updated = data as Device;
      this.devices.update(current => current.map(d => (d.id === id ? updated : d)));
      return updated;
    } catch (err: any) {
      this.error.set(err?.message || 'Error al actualizar el dispositivo');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  async deleteDevice(id: string): Promise<boolean> {
    this.loading.set(true);
    try {
      const { error } = await this.supabaseService.client
        .from('devices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      this.devices.update(current => current.filter(d => d.id !== id));
      return true;
    } catch (err: any) {
      this.error.set(err?.message || 'Error al eliminar el dispositivo');
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  async createDeviceType(dto: CreateDeviceTypeDTO): Promise<DeviceType | null> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('device_types')
        .insert([dto])
        .select()
        .single();

      if (error) throw error;

      const newType = data as DeviceType;
      this.deviceTypes.update(current => [...current, newType].sort((a, b) => a.name.localeCompare(b.name)));
      return newType;
    } catch (err: any) {
      console.error('Error creating device type:', err);
      return null;
    }
  }
}
