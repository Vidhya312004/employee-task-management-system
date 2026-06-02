import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { CommentService } from '../../services/comment.service';
import { TaskFileService } from '../../services/task-file.service';
import { Task } from '../../models/task.model';
import { Comment } from '../../models/comment.model';
import { TaskFile } from '../../models/task-file.model';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

interface Toast {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error';
}

@Component({
  selector: 'app-employee-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="task-management-container">
      <header class="page-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 2rem;">
        <h1 style="margin: 0; font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">My Tasks</h1>
        <div class="profile-icon" title="Employee Profile" routerLink="/employee/profile" style="cursor: pointer; display: flex; align-items: center; color: var(--text-secondary); transition: color 0.2s ease;">
          <img *ngIf="authService.currentUser()?.profile_image" [src]="authService.currentUser()?.profile_image" alt="Profile" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color);">
          <span *ngIf="!authService.currentUser()?.profile_image" class="material-symbols-rounded" style="font-size: 2.25rem;">account_circle</span>
        </div>
      </header>

      <div class="controls-bar" style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
        <div class="search-container">
          <input 
            type="text" 
            placeholder="Search my tasks..." 
            class="search-input" 
            [(ngModel)]="searchTerm" 
            (input)="currentPage = 1" />
        </div>
        <div class="filter-container" style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <select class="status-select" [(ngModel)]="statusFilter" (change)="currentPage = 1">
            <option value="all">All Status</option>
            <option value="in_progress">In Progress</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          
          <select class="status-select" [(ngModel)]="priorityFilter" (change)="currentPage = 1">
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div class="table-container" *ngIf="getFilteredTasks().length > 0">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Task Title</th>
              <th>Project</th>
              <th>Priority</th>
              <th>Progress</th>
              <th>Deadline</th>
              <th>Status</th>
              <th class="action-column">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let task of getPaginatedTasks()">
              <td>{{ task.id }}</td>
              <td class="font-medium">{{ task.task_title }}</td>
              <td>{{ task.project?.project_name || task.project_id }}</td>
              <td>
                <span class="priority-badge" [ngClass]="getPriorityClass(task.priority || '')">
                  {{ task.priority | titlecase }}
                </span>
              </td>
              <td>
                <div class="progress-bar-container">
                  <div class="progress-bar" [style.width.%]="task.progress || 0"></div>
                </div>
                <span style="font-size: 0.75rem;">{{ task.progress || 0 }}%</span>
              </td>
              <td>{{ formatDate(task.deadline) }}</td>
              <td>
                <span class="status-badge" [ngClass]="getStatusClass(task.status || '')">
                  {{ task.status | titlecase }}
                </span>
              </td>
              <td class="action-column">
                <button class="icon-btn edit-btn" title="View & Update" (click)="openUpdateModal(task)">
                  <span class="material-symbols-rounded">edit</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div class="table-container" *ngIf="getFilteredTasks().length === 0" style="box-shadow: none; border-color: var(--border-color);">
        <div class="empty-state">
          <span class="material-symbols-rounded empty-state-icon">assignment_late</span>
          <h3>No Tasks Found</h3>
          <p>We couldn't find any tasks matching your current filters or search term.</p>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="getTotalPages() > 0">
        <button 
          class="page-btn page-nav" 
          [disabled]="currentPage === 1" 
          (click)="setPage(currentPage - 1)">
          &laquo;
        </button>
        <button 
          *ngFor="let page of getPagesArray()" 
          class="page-btn" 
          [class.active]="currentPage === page"
          (click)="setPage(page)">
          {{ page }}
        </button>
        <button 
          class="page-btn page-nav" 
          [disabled]="currentPage === getTotalPages()" 
          (click)="setPage(currentPage + 1)">
          &raquo;
        </button>
      </div>
    </div>

    <!-- Task Details / Update Modal -->
    <div class="modal-backdrop" [class.show]="showModal" (click)="closeModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Task Details</h3>
          <button class="modal-close" (click)="closeModal()">
            <span class="material-symbols-rounded">close</span>
          </button>
        </div>
        
        <div class="modal-tabs">
          <button class="tab-btn" [class.active]="activeTab === 'details'" (click)="switchTab('details')">Details</button>
          <button class="tab-btn" [class.active]="activeTab === 'comments'" (click)="switchTab('comments')">Comments</button>
          <button class="tab-btn" [class.active]="activeTab === 'files'" (click)="switchTab('files')">Files</button>
        </div>

        <div class="modal-body">
          
          <!-- Details Tab -->
          <form *ngIf="activeTab === 'details'" #f="ngForm" (ngSubmit)="updateStatus()">
            <div class="form-group">
              <label>Task Title</label>
              <input type="text" class="form-control" [value]="selectedTask?.task_title" disabled />
            </div>
            
            <div class="form-group">
              <label for="task-status">Status *</label>
              <select 
                id="task-status" 
                name="status" 
                class="form-control" 
                required
                [(ngModel)]="newStatus">
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="task-progress">Progress ({{ newProgress }}%)</label>
              <input 
                type="range" 
                id="task-progress" 
                name="progress" 
                class="form-range" 
                min="0" 
                max="100" 
                [(ngModel)]="newProgress" />
            </div>
            
            <div class="modal-footer" style="padding: 1.25rem 0 0 0; border: none; background: transparent;">
              <button type="submit" class="btn btn-primary" [disabled]="f.invalid">
                <span class="material-symbols-rounded">save</span>
                Save Changes
              </button>
            </div>
          </form>

          <!-- Comments Tab -->
          <div *ngIf="activeTab === 'comments'" class="comments-section">
            <div class="comments-list">
              <div class="comment-item" *ngFor="let comment of taskComments">
                <div class="comment-author">{{ comment.user?.name || 'User ' + comment.user_id }}</div>
                <div class="comment-text">{{ comment.comment }}</div>
                <div class="comment-time">{{ formatDate(comment.created_at!) }}</div>
              </div>
              <div *ngIf="taskComments.length === 0" class="empty-list">No comments yet.</div>
            </div>
            
            <div class="add-comment">
              <textarea 
                class="form-control" 
                rows="3" 
                placeholder="Write a comment..." 
                [(ngModel)]="newComment"></textarea>
              <button class="btn btn-primary mt-2" (click)="submitComment()" [disabled]="!newComment.trim()">
                Post Comment
              </button>
            </div>
          </div>

          <!-- Files Tab -->
          <div *ngIf="activeTab === 'files'" class="files-section">
            <div class="files-list">
              <div class="file-item" *ngFor="let file of taskFiles">
                <span class="material-symbols-rounded file-icon">insert_drive_file</span>
                <a [href]="getFileUrl(file.file_path)" target="_blank" class="file-name">{{ file.file_name }}</a>
              </div>
              <div *ngIf="taskFiles.length === 0" class="empty-list">No files uploaded.</div>
            </div>
            
            <div class="add-file">
              <input type="file" (change)="onFileSelected($event)" class="form-control mb-2" />
              <button class="btn btn-primary" (click)="uploadFile()" [disabled]="!selectedFile">
                <span class="material-symbols-rounded">upload</span>
                Upload File
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Toast Notifications Container -->
    <div class="toast-container">
      <div 
        *ngFor="let toast of toasts" 
        class="toast toast-{{ toast.type }}" 
        (click)="removeToast(toast.id)">
        <div class="toast-icon">
          <span class="material-symbols-rounded" *ngIf="toast.type === 'success'">check_circle</span>
          <span class="material-symbols-rounded" *ngIf="toast.type === 'warning'">warning</span>
          <span class="material-symbols-rounded" *ngIf="toast.type === 'error'">error</span>
        </div>
        <div class="toast-content">
          <div class="toast-title">{{ toast.title }}</div>
          <div class="toast-message">{{ toast.message }}</div>
        </div>
        <span class="material-symbols-rounded toast-close">close</span>
      </div>
    </div>
  `,
  styles: [`
    .task-management-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .page-header {
      margin-bottom: 2rem;
    }
    .page-header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .search-input {
      width: 250px;
      padding: 0.625rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-md);
      font-size: 0.875rem;
      outline: none;
      color: var(--text-primary);
      background-color: var(--bg-surface);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .search-input:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px var(--primary-color-light);
    }
    .status-select {
      padding: 0.625rem 2.5rem 0.625rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-md);
      font-size: 0.875rem;
      color: var(--text-primary);
      background-color: var(--bg-surface);
      appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      background-size: 1em;
      outline: none;
      cursor: pointer;
    }
    .status-select:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px var(--primary-color-light);
    }
    .table-container {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      overflow-x: auto;
      box-shadow: var(--shadow-sm);
      margin-bottom: 1.5rem;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .data-table th {
      background-color: var(--bg-surface-hover);
      padding: 1rem 1.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border-color);
    }
    .data-table td {
      padding: 1rem 1.5rem;
      font-size: 0.875rem;
      color: var(--text-primary);
      border-bottom: 1px solid var(--border-color);
      vertical-align: middle;
    }
    .data-table tbody tr:last-child td {
      border-bottom: none;
    }
    .data-table tbody tr:hover {
      background-color: var(--bg-app);
    }
    .font-medium {
      font-weight: 500;
    }
    .action-column {
      text-align: center;
      white-space: nowrap;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem 0.75rem;
      border-radius: var(--border-radius-full);
      font-size: 0.75rem;
      font-weight: 600;
      border: 1px solid transparent;
    }
    .status-progress { background-color: var(--status-progress-bg); color: var(--status-progress-text); border-color: #BFDBFE; }
    .status-pending { background-color: var(--status-pending-bg); color: var(--status-pending-text); border-color: #FDE68A; }
    .status-completed { background-color: var(--status-completed-bg); color: var(--status-completed-text); border-color: #A7F3D0; }
    
    .progress-bar-container {
      width: 100%;
      background-color: var(--border-color);
      border-radius: var(--border-radius-full);
      height: 6px;
      margin-bottom: 4px;
      overflow: hidden;
    }
    .progress-bar {
      height: 100%;
      background-color: var(--primary-color);
      transition: width 0.3s ease;
    }
    
    .empty-state {
      padding: 3rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .empty-state-icon {
      font-size: 4rem;
      color: var(--text-secondary);
      margin-bottom: 1rem;
      opacity: 0.5;
    }
    .empty-state h3 {
      font-size: 1.25rem;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }
    .empty-state p {
      color: var(--text-secondary);
      margin-bottom: 1.5rem;
      max-width: 400px;
    }
    .icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: var(--border-radius-md);
      color: var(--text-secondary);
      transition: all 0.2s ease;
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
    }
    .icon-btn span { font-size: 1.125rem; }
    .icon-btn:hover {
      color: var(--primary-color);
      border-color: var(--primary-color);
      background-color: var(--primary-color-light);
    }
    .pagination {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.5rem;
    }
    .page-btn {
      min-width: 36px;
      height: 36px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border-color);
      background-color: var(--bg-surface);
      border-radius: var(--border-radius-md);
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary);
      transition: all 0.2s ease;
    }
    .page-btn:hover:not(.active):not(:disabled) {
      background-color: var(--bg-surface-hover);
      color: var(--text-primary);
    }
    .page-btn.active {
      background-color: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }
    .page-btn.page-nav { font-size: 1.25rem; }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background-color: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex; align-items: center; justify-content: center;
      opacity: 0; visibility: hidden; transition: all 0.3s ease;
    }
    .modal-backdrop.show { opacity: 1; visibility: visible; }
    .modal-content {
      background-color: var(--bg-surface);
      border-radius: var(--border-radius-lg);
      width: 100%; max-width: 600px; max-height: 90vh;
      display: flex; flex-direction: column;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      transform: translateY(20px) scale(0.95);
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .modal-backdrop.show .modal-content { transform: translateY(0) scale(1); }
    .modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-color);
      display: flex; justify-content: space-between; align-items: center;
    }
    .modal-header h3 { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); }
    .modal-close {
      background: none; border: none; color: var(--text-secondary); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      padding: 0.25rem; border-radius: var(--border-radius-sm); transition: all 0.2s ease;
    }
    .modal-close:hover { background-color: var(--bg-surface-hover); color: var(--danger-color, #EF4444); }
    
    .modal-tabs {
      display: flex;
      border-bottom: 1px solid var(--border-color);
      background-color: var(--bg-surface-hover);
    }
    .tab-btn {
      padding: 1rem 1.5rem;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .tab-btn:hover { color: var(--text-primary); }
    .tab-btn.active {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
      background-color: var(--bg-surface);
    }
    
    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
    }
    .form-group { margin-bottom: 1.25rem; }
    .form-group label {
      display: block; font-size: 0.875rem; font-weight: 600;
      color: var(--text-secondary); margin-bottom: 0.5rem;
    }
    .form-control {
      width: 100%; padding: 0.625rem 1rem; border: 1px solid var(--border-color);
      border-radius: var(--border-radius-md); font-size: 0.9375rem;
      color: var(--text-primary); background-color: var(--bg-surface); transition: all 0.2s ease;
    }
    .form-control:focus { outline: none; border-color: var(--primary-color); box-shadow: 0 0 0 3px var(--primary-color-light); }
    .form-control:disabled { background-color: var(--bg-surface-hover); color: var(--text-secondary); cursor: not-allowed; }
    .form-range { width: 100%; margin-top: 8px; }
    
    .comments-section, .files-section { display: flex; flex-direction: column; gap: 1rem; }
    .comments-list, .files-list { max-height: 300px; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; }
    .comment-item {
      background-color: var(--bg-surface-hover);
      padding: 1rem;
      border-radius: var(--border-radius-md);
      border: 1px solid var(--border-color);
    }
    .comment-author { font-weight: 600; font-size: 0.875rem; margin-bottom: 4px; color: var(--text-primary); }
    .comment-text { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 8px; }
    .comment-time { font-size: 0.75rem; color: var(--text-secondary); opacity: 0.7; }
    
    .file-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.75rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-md);
    }
    .file-icon { color: var(--text-secondary); }
    .file-name { font-size: 0.875rem; font-weight: 500; color: var(--primary-color); text-decoration: none; }
    .file-name:hover { text-decoration: underline; }
    
    .mb-2 { margin-bottom: 0.5rem; }
    .mt-2 { margin-top: 0.5rem; }

    .btn {
      padding: 0.625rem 1.25rem; border-radius: var(--border-radius-md);
      font-size: 0.875rem; font-weight: 600; cursor: pointer; display: inline-flex;
      align-items: center; gap: 0.5rem; transition: all 0.2s ease; border: none;
    }
    .btn-primary { background-color: var(--primary-color); color: white; }
    .btn-primary:hover { background-color: var(--primary-color-hover); transform: translateY(-1px); }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }

    .toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 1050; display: flex; flex-direction: column; gap: 12px; }
    .toast { display: flex; align-items: flex-start; gap: 12px; min-width: 300px; max-width: 400px; padding: 16px; background-color: var(--bg-surface); border-radius: var(--border-radius-md); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); border-left: 4px solid transparent; animation: slideInRight 0.3s ease forwards; cursor: pointer; }
    .toast-success { border-left-color: #10B981; }
    .toast-warning { border-left-color: #F59E0B; }
    .toast-error { border-left-color: #EF4444; }
    .toast-icon span { font-size: 24px; }
    .toast-success .toast-icon { color: #10B981; }
    .toast-warning .toast-icon { color: #F59E0B; }
    .toast-error .toast-icon { color: #EF4444; }
    .toast-content { flex: 1; }
    .toast-title { font-weight: 600; font-size: 0.875rem; color: var(--text-primary); margin-bottom: 4px; }
    .toast-message { font-size: 0.875rem; color: var(--text-secondary); }
    .toast-close { font-size: 20px; color: var(--text-secondary); opacity: 0.5; transition: opacity 0.2s; }
    .toast:hover .toast-close { opacity: 1; }
  `]
})
export class EmployeeTasksComponent implements OnInit {
  tasks: Task[] = [];
  
  searchTerm: string = '';
  statusFilter: string = 'all';
  priorityFilter: string = 'all';

  currentPage: number = 1;
  itemsPerPage: number = 5;

  showModal: boolean = false;
  selectedTask: Task | null = null;
  newStatus: string = 'pending';
  newProgress: number = 0;

  activeTab: 'details' | 'comments' | 'files' = 'details';

  // Comments & Files state
  taskComments: Comment[] = [];
  newComment: string = '';
  
  taskFiles: TaskFile[] = [];
  selectedFile: File | null = null;

  toasts: Toast[] = [];
  private nextToastId: number = 1;

  constructor(
    private taskService: TaskService,
    public authService: AuthService,
    private commentService: CommentService,
    private taskFileService: TaskFileService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    const user = this.authService.currentUser();
    if (!user) return;

    this.taskService.getTasks().subscribe({
      next: (tasks) => { 
        this.tasks = tasks.filter(t => t.employee_id === user.id); 
      },
      error: (e) => {
        console.error('Error loading tasks', e);
        this.showToast('Error', 'Failed to retrieve tasks from server.', 'error');
      }
    });
  }

  getFilteredTasks(): Task[] {
    return this.tasks.filter(task => {
      const title = (task.task_title || '').toLowerCase();
      const project = (task.project?.project_name || '').toLowerCase();
      const matchesSearch =
        title.includes(this.searchTerm.toLowerCase()) ||
        project.includes(this.searchTerm.toLowerCase());

      const matchesStatus = this.statusFilter === 'all' || task.status === this.statusFilter;
      const matchesPriority = this.priorityFilter === 'all' || task.priority === this.priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }

  getPaginatedTasks(): Task[] {
    const filtered = this.getFilteredTasks();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(startIndex, startIndex + this.itemsPerPage) as Task[];
  }

  getTotalPages(): number {
    const filtered = this.getFilteredTasks();
    return Math.ceil(filtered.length / this.itemsPerPage);
  }

  getPagesArray(): number[] {
    const total = this.getTotalPages();
    const arr = [];
    for (let i = 1; i <= total; i++) {
      arr.push(i);
    }
    return arr;
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  openUpdateModal(task: Task) {
    this.selectedTask = task;
    this.newStatus = task.status || 'pending';
    this.newProgress = task.progress || 0;
    this.activeTab = 'details';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedTask = null;
    this.taskComments = [];
    this.taskFiles = [];
    this.newComment = '';
    this.selectedFile = null;
  }

  switchTab(tab: 'details' | 'comments' | 'files') {
    this.activeTab = tab;
    if (tab === 'comments' && this.selectedTask) {
      this.loadComments(this.selectedTask.id!);
    } else if (tab === 'files' && this.selectedTask) {
      this.loadFiles(this.selectedTask.id!);
    }
  }

  updateStatus() {
    if (this.selectedTask && this.selectedTask.id) {
      this.taskService.updateTask(this.selectedTask.id, { 
        status: this.newStatus as any,
        progress: this.newProgress
      }).subscribe({
        next: () => {
          this.loadTasks();
          this.showToast('Success!', `Task "${this.selectedTask?.task_title}" updated.`, 'success');
          this.closeModal();
        },
        error: (e) => {
          console.error('Error updating task', e);
          this.showToast('Error', 'Failed to update task.', 'error');
        }
      });
    }
  }

  // --- Comments ---
  loadComments(taskId: number) {
    this.commentService.getComments().subscribe({
      next: (allComments) => {
        this.taskComments = allComments.filter(c => c.task_id === taskId);
      },
      error: (e) => console.error('Error loading comments', e)
    });
  }

  submitComment() {
    const user = this.authService.currentUser();
    if (!this.selectedTask || !user || !this.newComment.trim()) return;

    const payload: Comment = {
      task_id: this.selectedTask.id!,
      user_id: user.id,
      comment: this.newComment.trim()
    };

    this.commentService.createComment(payload).subscribe({
      next: (res) => {
        // Append comment
        this.taskComments.push(res);
        this.newComment = '';
        this.showToast('Success', 'Comment posted!', 'success');
      },
      error: (e) => {
        console.error('Error posting comment', e);
        this.showToast('Error', 'Failed to post comment', 'error');
      }
    });
  }

  // --- Files ---
  loadFiles(taskId: number) {
    this.taskFileService.getTaskFiles().subscribe({
      next: (allFiles) => {
        this.taskFiles = allFiles.filter(f => f.task_id === taskId);
      },
      error: (e) => console.error('Error loading files', e)
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  uploadFile() {
    const user = this.authService.currentUser();
    if (!this.selectedTask || !user || !this.selectedFile) return;

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('task_id', this.selectedTask.id!.toString());
    formData.append('uploaded_by', user.id.toString());

    this.http.post<TaskFile>(environment.apiUrl + 'task-files/upload', formData).subscribe({
      next: (res) => {
        this.taskFiles.push(res);
        this.selectedFile = null;
        this.showToast('Success', 'File uploaded successfully!', 'success');
      },
      error: (e) => {
        console.error('Error uploading file', e);
        this.showToast('Error', 'Failed to upload file', 'error');
      }
    });
  }

  getFileUrl(path: string): string {
    // Basic construct to point to backend storage link
    return `http://localhost:8000/storage/${path}`;
  }

  // Helpers
  getStatusClass(status: string): string {
    switch (status) {
      case 'in_progress': return 'status-progress';
      case 'pending': return 'status-pending';
      case 'completed': return 'status-completed';
      default: return '';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  showToast(title: string, message: string, type: 'success' | 'warning' | 'error') {
    const id = this.nextToastId++;
    const toast: Toast = { id, title, message, type };
    this.toasts.push(toast);
    setTimeout(() => {
      this.removeToast(id);
    }, 3000);
  }

  removeToast(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }
}
