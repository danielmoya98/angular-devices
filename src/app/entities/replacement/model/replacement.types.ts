import { Device } from '@/entities/device/model/device.types';
import { User } from '@/entities/user/model/user.types';

export type ReplacementItemType = 
  | 'cable_hdmi'
  | 'cable_power'
  | 'cable_vga'
  | 'lamp_bulb'
  | 'remote_control_unit'
  | 'battery_remote'
  | 'other'
  | string;

export interface DeviceReplacement {
  id: string;
  device_id: string;
  registered_by: string;
  item_type: ReplacementItemType;
  quantity: number;
  cost: number;
  reason: string;
  replaced_at: string;
  created_at?: string;
  device?: Device;
  user?: User;
}

export type CreateReplacementDTO = Omit<DeviceReplacement, 'id' | 'created_at' | 'device' | 'user'>;
export type UpdateReplacementDTO = Partial<CreateReplacementDTO>;
