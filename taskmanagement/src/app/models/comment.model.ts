import { Task } from './task.model';
import { User } from './user.model';

export interface Comment {
  id?: number;
  task_id: number;
  user_id: number;
  comment: string;
  task?: Task;
  user?: User;
  created_at?: string;
  updated_at?: string;
}
