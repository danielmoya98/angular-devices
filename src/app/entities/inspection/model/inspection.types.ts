import { User } from '@/entities/user/model/user.types';
import { Classroom } from '@/entities/classroom/model/classroom.types';
import { Device } from '@/entities/device/model/device.types';

export type CheckResult = 'ok' | 'warning' | 'failed' | 'missing' | string;

export interface DeviceCheckItem {
  id: string;
  classroom_inspection_id: string;
  device_id: string;
  powers_on: boolean;
  has_power_cable: boolean;
  has_hdmi_vga_cable: boolean;
  has_remote_control: boolean;
  overall_status: CheckResult;
  observations?: string;
  created_at?: string;
  device?: Device;
}

export interface ClassroomInspection {
  id: string;
  inspection_id: string;
  classroom_id: string;
  checked_at: string;
  is_fully_operational: boolean;
  notes?: string;
  classroom?: Classroom;
  device_check_items?: DeviceCheckItem[];
}

export interface Inspection {
  id: string;
  inspector_id: string;
  scheduled_date: string;
  started_at?: string;
  completed_at?: string;
  general_notes?: string;
  created_at?: string;
  inspector?: User;
  classroom_inspections?: ClassroomInspection[];
}

export type CreateInspectionDTO = {
  inspector_id: string;
  scheduled_date: string;
  general_notes?: string;
};

export type CreateClassroomInspectionDTO = {
  inspection_id: string;
  classroom_id: string;
  is_fully_operational: boolean;
  notes?: string;
};

export type CreateDeviceCheckDTO = {
  classroom_inspection_id: string;
  device_id: string;
  powers_on: boolean;
  has_power_cable: boolean;
  has_hdmi_vga_cable: boolean;
  has_remote_control: boolean;
  overall_status: CheckResult;
  observations?: string;
};
