import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TaskService } from '../services/task.service';
import { ProjectService } from '../services/project.service';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { Task } from '../models/task.model';
import { Project } from '../models/project.model';
import { User } from '../models/user.model';

// Using Task from models

interface Toast {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error';
}

@Component({
  selector: 'app-task-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="task-management-container">
      <header class="page-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 2rem;">
        <div class="header-left" style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
          <h1 style="margin: 0; font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">Task Management</h1>
          <button class="add-task-btn" (click)="openAddModal()">
            <span class="material-symbols-rounded">add</span>
            Add New Task
          </button>
        </div>
        <div class="header-right">
          <div class="profile-icon" title="Admin Profile" routerLink="/admin/profile" style="cursor: pointer; display: flex; align-items: center; color: var(--text-secondary);">
            <img *ngIf="authService.currentUser()?.profile_image" [src]="authService.currentUser()?.profile_image" alt="Profile" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color);">
            <span *ngIf="!authService.currentUser()?.profile_image" class="material-symbols-rounded" style="font-size: 2.25rem;">account_circle</span>
          </div>
        </div>
      </header>

      <div class="controls-bar" style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
        <div class="search-container">
          <input 
            type="text" 
            placeholder="Search tasks..." 
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
              <th>Employee</th>
              <th>Priority</th>
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
              <td>{{ task.employee?.name || task.employee_id }}</td>
              <td>
                <span class="priority-badge" [ngClass]="getPriorityClass(task.priority || '')">
                  {{ task.priority | titlecase }}
                </span>
              </td>
              <td>{{ formatDate(task.deadline) }}</td>
              <td>
                <span class="status-badge" [ngClass]="getStatusClass(task.status || '')">
                  {{ task.status | titlecase }}
                </span>
              </td>
              <td class="action-column">
                <button class="icon-btn edit-btn" title="Edit" (click)="openEditModal(task)">
                  <span class="material-symbols-rounded">edit</span>
                </button>
                <button class="icon-btn delete-btn" title="Delete" (click)="deleteTask(task.id || 0)">
                  <span class="material-symbols-rounded">delete</span>
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
          <button class="btn btn-primary" (click)="openAddModal()">
            <span class="material-symbols-rounded">add</span>
            Create New Task
          </button>
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

    <!-- Premium Modal backdrop -->
    <div class="modal-backdrop" [class.show]="showModal" (click)="closeModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ isEditMode ? 'Edit Task' : 'Create New Task' }}</h3>
          <button class="modal-close" (click)="closeModal()">
            <span class="material-symbols-rounded">close</span>
          </button>
        </div>
        <form #f="ngForm" (ngSubmit)="saveTask(f.valid || false)">
          <div class="modal-body">
            <!-- Title -->
            <div class="form-group">
              <label for="task-title">Task Title *</label>
              <input 
                type="text" 
                id="task-title" 
                name="task_title" 
                class="form-control" 
                required 
                placeholder="e.g. Design Login Page"
                [(ngModel)]="taskForm.task_title" 
                #titleInput="ngModel" />
              <div class="error-message" *ngIf="titleInput.invalid && titleInput.touched">
                Task title is required.
              </div>
            </div>

            <!-- Project -->
            <div class="form-group">
              <label for="task-project">Project *</label>
              <select 
                id="task-project" 
                name="project_id" 
                class="form-control" 
                required
                [(ngModel)]="taskForm.project_id">
                <option [value]="null" disabled>Select a project</option>
                <option *ngFor="let p of projects" [value]="p.id">{{ p.project_name }}</option>
              </select>
            </div>

            <!-- Assignee -->
            <div class="form-group">
              <label for="task-employee">Assignee *</label>
              <select 
                id="task-employee" 
                name="employee_id" 
                class="form-control" 
                required
                [(ngModel)]="taskForm.employee_id">
                <option [value]="null" disabled>Select an employee</option>
                <option *ngFor="let u of employees" [value]="u.id">{{ u.name }}</option>
              </select>
            </div>

            <div class="form-row">
              <!-- Priority -->
              <div class="form-group">
                <label for="task-priority">Priority *</label>
                <select 
                  id="task-priority" 
                  name="priority" 
                  class="form-control" 
                  required
                  [(ngModel)]="taskForm.priority">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <!-- Status -->
              <div class="form-group">
                <label for="task-status">Status *</label>
                <select 
                  id="task-status" 
                  name="status" 
                  class="form-control" 
                  required
                  [(ngModel)]="taskForm.status">
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <!-- Deadline -->
            <div class="form-group">
              <label for="task-deadline">Deadline *</label>
              <input 
                type="date" 
                id="task-deadline" 
                name="deadline" 
                class="form-control" 
                required 
                [(ngModel)]="taskForm.deadline" 
                #deadlineInput="ngModel" />
              <div class="error-message" *ngIf="deadlineInput.invalid && deadlineInput.touched">
                Deadline is required.
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="f.invalid">
              <span class="material-symbols-rounded">save</span>
              {{ isEditMode ? 'Save Changes' : 'Create Task' }}
            </button>
          </div>
        </form>
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

    .controls-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .search-input {
      width: 250px;
      padding: 0.625rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-md);
      font-size: 0.875rem;
      outline: none;
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

    .status-progress {
      background-color: var(--status-progress-bg);
      color: var(--status-progress-text);
      border-color: #BFDBFE;
    }

    .status-pending {
      background-color: var(--status-pending-bg);
      color: var(--status-pending-text);
      border-color: #FDE68A;
    }

    .status-completed {
      background-color: var(--status-completed-bg);
      color: var(--status-completed-text);
      border-color: #A7F3D0;
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

    .icon-btn span {
      font-size: 1.125rem;
    }

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

    .page-btn.page-nav {
      font-size: 1.25rem;
    }

    .page-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  `]
})
export class TaskManagementComponent implements OnInit {
  tasks: Task[] = [];
  projects: Project[] = [];
  employees: User[] = [];

  // Search & Filter state
  searchTerm: string = '';
  statusFilter: string = 'all';
  priorityFilter: string = 'all';

  // Pagination state
  currentPage: number = 1;
  itemsPerPage: number = 5;

  // Modal state
  showModal: boolean = false;
  isEditMode: boolean = false;
  editingTaskId: number | null = null;

  // Form State
  taskForm: Partial<Task> = {
    task_title: '',
    project_id: undefined,
    employee_id: undefined,
    priority: 'medium',
    deadline: '',
    status: 'pending'
  };

  // Toast notifications state
  toasts: Toast[] = [];
  private nextToastId: number = 1;

  constructor(
    private taskService: TaskService,
    private projectService: ProjectService,
    private userService: UserService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadTasks();
    this.loadProjects();
    this.loadEmployees();
  }

  loadTasks() {
    this.taskService.getTasks().subscribe({
      next: (tasks) => { 
        this.tasks = tasks; 
        this.cdr.detectChanges();
      },
      error: (e) => {
        console.error('Error loading tasks', e);
        this.showToast('Error', 'Failed to retrieve tasks from server.', 'error');
      }
    });
  }

  loadProjects() {
    this.projectService.getProjects().subscribe({
      next: (projects) => { 
        this.projects = projects; 
        this.cdr.detectChanges();
      },
      error: (e) => console.error('Error loading projects', e)
    });
  }

  loadEmployees() {
    this.userService.getUsers().subscribe({
      next: (users) => { 
        this.employees = users; 
        this.cdr.detectChanges();
      },
      error: (e) => console.error('Error loading employees', e)
    });
  }

  // Filters logic
  getFilteredTasks(): Task[] {
    return this.tasks.filter(task => {
      const title = (task.task_title || '').toLowerCase();
      const project = (task.project?.project_name || '').toLowerCase();
      const employee = (task.employee?.name || '').toLowerCase();
      const matchesSearch =
        title.includes(this.searchTerm.toLowerCase()) ||
        project.includes(this.searchTerm.toLowerCase()) ||
        employee.includes(this.searchTerm.toLowerCase());

      const matchesStatus = this.statusFilter === 'all' || task.status === this.statusFilter;
      const matchesPriority = this.priorityFilter === 'all' || task.priority === this.priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }

  // Pagination logic
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

  // CRUD - Open Add Task Modal
  openAddModal() {
    this.isEditMode = false;
    this.editingTaskId = null;
    this.taskForm = {
      task_title: '',
      project_id: undefined,
      employee_id: undefined,
      priority: 'medium',
      deadline: '',
      status: 'pending'
    };
    this.showModal = true;
  }

  // CRUD - Open Edit Task Modal
  openEditModal(task: Task) {
    this.isEditMode = true;
    this.editingTaskId = task.id || null;
    this.taskForm = {
      task_title: task.task_title,
      project_id: task.project_id,
      employee_id: task.employee_id,
      priority: task.priority,
      deadline: task.deadline,
      status: task.status
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  // CRUD - Save Task (Add or Edit)
  saveTask(formIsValid: boolean) {
    if (!formIsValid) {
      this.showToast('Validation Error', 'Please correct the fields in the form.', 'error');
      return;
    }

    if (this.isEditMode && this.editingTaskId !== null) {
      this.taskService.updateTask(this.editingTaskId, this.taskForm).subscribe({
        next: (updated) => {
          this.loadTasks();
          this.showToast('Success!', `Task "${this.taskForm.task_title}" updated successfully.`, 'success');
          this.closeModal();
          this.currentPage = 1;
        },
        error: (e) => {
          console.error('Error saving task', e);
          this.showToast('Error', 'Failed to save task to server.', 'error');
        }
      });
    } else {
      this.taskService.createTask(this.taskForm as Task).subscribe({
        next: (created) => {
          this.loadTasks();
          this.showToast('Created!', `Task "${this.taskForm.task_title}" has been created.`, 'success');
          this.closeModal();
          this.currentPage = 1;
        },
        error: (e) => {
          console.error('Error creating task', e);
          this.showToast('Error', 'Failed to create task on server.', 'error');
        }
      });
    }
  }

  // CRUD - Delete Task
  deleteTask(id: number) {
    const taskToDelete = this.tasks.find(t => t.id === id);
    if (!taskToDelete) return;

    if (confirm(`Are you sure you want to delete task: "${taskToDelete.task_title}"?`)) {
      this.taskService.deleteTask(id).subscribe({
        next: () => {
          this.loadTasks();
          this.showToast('Deleted', `Task "${taskToDelete.task_title}" has been deleted.`, 'warning');
          if (this.currentPage > this.getTotalPages() && this.currentPage > 1) {
            this.currentPage--;
          }
        },
        error: (e) => {
          console.error('Error deleting task', e);
          this.showToast('Error', 'Failed to remove task from server.', 'error');
        }
      });
    }
  }

  // Helper styles mappings
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

  // Toast Helpers
  showToast(title: string, message: string, type: 'success' | 'warning' | 'error') {
    const id = this.nextToastId++;
    const toast: Toast = { id, title, message, type };
    this.toasts.push(toast);
    this.cdr.detectChanges();

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      this.removeToast(id);
      this.cdr.detectChanges();
    }, 3000);
  }

  removeToast(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }
}
