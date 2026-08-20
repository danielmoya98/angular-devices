import { Classroom } from '@/entities/classroom/model/classroom.types';

export type DeviceStatus = 'operational' | 'under_maintenance' | 'damaged' | 'missing_accessories' | 'stored' | string;

export interface DeviceType {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  created_at?: string;
}

export interface Device {
  id: string;
  internal_code: string;
  type_id: string;
  classroom_id?: string | null;
  brand: string;
  model: string;
  serial_number?: string | null;
  status: DeviceStatus;
  installation_date?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  lifespan_hours?: number | null;
  used_hours?: number | null;
  type?: DeviceType;
  classroom?: Classroom;
}

export type CreateDeviceDTO = Omit<Device, 'id' | 'created_at' | 'updated_at' | 'type' | 'classroom'>;
export type UpdateDeviceDTO = Partial<CreateDeviceDTO>;

export type CreateDeviceTypeDTO = Omit<DeviceType, 'id' | 'created_at'>;
