export interface Block {
  id: string;
  name: string;
  code: string;
  description: string | null;
  created_at?: string;
}

export type CreateBlockDTO = Omit<Block, 'id' | 'created_at'>;
export type UpdateBlockDTO = Partial<CreateBlockDTO>;
