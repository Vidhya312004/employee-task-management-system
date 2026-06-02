import { Project } from './project.model';
import { User } from './user.model';

export interface Task {
  id?: number;
  project_id: number;
  employee_id: number;
  task_title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  deadline: string;
  status?: 'pending' | 'in_progress' | 'completed';
  progress?: number;
  attachment?: string;
  project?: Project;
  employee?: User;
  created_at?: string;
  updated_at?: string;
}
