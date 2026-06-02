import { Task } from './task.model';
import { User } from './user.model';

export interface TaskFile {
  id?: number;
  task_id: number;
  file_name: string;
  file_path: string;
  uploaded_by: number;
  task?: Task;
  uploader?: User;
  created_at?: string;
}
