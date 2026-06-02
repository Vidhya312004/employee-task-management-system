import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TaskService } from '../../../services/task.service';
import { AuthService } from '../../../services/auth.service';
import { CommentService } from '../../../services/comment.service';
import { TaskFileService } from '../../../services/task-file.service';
import { Task } from '../../../models/task.model';
import { Comment } from '../../../models/comment.model';
import { TaskFile } from '../../../models/task-file.model';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-employee-task-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.css']
})
export class TaskDetailsComponent implements OnInit {
  taskId!: number;
  task!: Task | null;
  taskComments: Comment[] = [];
  taskFiles: TaskFile[] = [];
  newStatus: string = 'pending';
  newProgress: number = 0;
  newComment: string = '';
  selectedFile: File | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private authService: AuthService,
    private commentService: CommentService,
    private taskFileService: TaskFileService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.taskId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadTask();
    this.loadComments();
    this.loadFiles();
  }

  loadTask() {
    this.taskService.getTask(this.taskId).subscribe({
      next: (t) => {
        this.task = t;
        this.newStatus = t.status || 'pending';
        this.newProgress = t.progress || 0;
      },
      error: (e) => console.error('Error loading task', e)
    });
  }

  loadComments() {
    this.commentService.getComments().subscribe({
      next: (comments) => {
        this.taskComments = comments.filter(c => c.task_id === this.taskId);
      },
      error: (e) => console.error('Error loading comments', e)
    });
  }

  loadFiles() {
    this.taskFileService.getTaskFiles().subscribe({
      next: (files) => {
        this.taskFiles = files.filter(f => f.task_id === this.taskId);
      },
      error: (e) => console.error('Error loading files', e)
    });
  }

  goBack() {
    this.router.navigate(['../']);
  }

  updateTask() {
    if (!this.task) return;
    this.taskService.updateTask(this.task.id!, { status: this.newStatus as any, progress: this.newProgress }).subscribe({
      next: () => this.loadTask(),
      error: (e) => console.error('Error updating task', e)
    });
  }

  submitComment() {
    const user = this.authService.currentUser();
    if (!user || !this.newComment.trim()) return;
    const payload: Comment = { task_id: this.taskId, user_id: user.id, comment: this.newComment.trim() };
    this.commentService.createComment(payload).subscribe({
      next: (c) => { this.taskComments.push(c); this.newComment = ''; },
      error: (e) => console.error('Error posting comment', e)
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  uploadFile() {
    const user = this.authService.currentUser();
    if (!user || !this.selectedFile) return;
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('task_id', this.taskId.toString());
    formData.append('uploaded_by', user.id.toString());
    this.http.post<TaskFile>(environment.apiUrl + 'task-files/upload', formData).subscribe({
      next: (f) => { this.taskFiles.push(f); this.selectedFile = null; },
      error: (e) => console.error('Error uploading file', e)
    });
  }

  getFileUrl(path: string): string {
    return `http://localhost:8000/storage/${path}`;
  }

  formatDate(dateString: string | Date | undefined): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  }
}
