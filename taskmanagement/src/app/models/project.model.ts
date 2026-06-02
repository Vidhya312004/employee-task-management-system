import { User } from './user.model';

export interface Project {
  id?: number;
  project_name: string;
  description?: string;
  start_date: string;
  end_date: string;
  status?: 'pending' | 'ongoing' | 'completed';
  created_by: number;
  creator?: User;
  created_at?: string;
  updated_at?: string;
}
