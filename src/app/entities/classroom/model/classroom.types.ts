import { Block } from '../../block/model/block.types';

export interface Classroom {
  id: string;
  block_id: string;
  code: string;
  type: string;
  floor?: string | null;
  is_active: boolean;
  created_at?: string;
  block?: Block;
}

export type CreateClassroomDTO = Omit<Classroom, 'id' | 'created_at' | 'block'>;
export type UpdateClassroomDTO = Partial<CreateClassroomDTO>;
