import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TaskFile } from '../models/task-file.model';

@Injectable({
  providedIn: 'root'
})
export class TaskFileService {
  private apiUrl = environment.apiUrl + 'task-files';

  constructor(private http: HttpClient) { }

  getTaskFiles(): Observable<TaskFile[]> {
    return this.http.get<TaskFile[]>(this.apiUrl);
  }

  getTaskFile(id: number): Observable<TaskFile> {
    return this.http.get<TaskFile>(`${this.apiUrl}/${id}`);
  }

  createTaskFile(taskFile: TaskFile): Observable<TaskFile> {
    return this.http.post<TaskFile>(this.apiUrl, taskFile);
  }

  updateTaskFile(id: number, taskFile: Partial<TaskFile>): Observable<TaskFile> {
    return this.http.put<TaskFile>(`${this.apiUrl}/${id}`, taskFile);
  }

  deleteTaskFile(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
