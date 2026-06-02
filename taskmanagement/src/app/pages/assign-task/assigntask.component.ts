import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { UserService } from '../../services/user.service';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { Project } from '../../models/project.model';
import { User } from '../../models/user.model';
import { Task } from '../../models/task.model';

interface Toast {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error';
}

@Component({
  selector: 'app-assign-task',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="assign-task-container">
      <header class="page-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 2rem;">
        <div class="header-left" style="display: flex; align-items: center; gap: 1rem;">
          <span class="material-symbols-rounded menu-toggle-btn">assignment_add</span>
          <div>
            <h1 style="margin: 0;">Assign Tasks</h1>
            <p class="subtitle" style="margin: 0.125rem 0 0 0;">Create and delegate new tasks to team members</p>
          </div>
        </div>
        <div class="header-right">
          <div class="profile-icon" title="Admin Profile" routerLink="/admin/profile" style="cursor: pointer; display: flex; align-items: center; color: var(--text-secondary);">
            <img *ngIf="authService.currentUser()?.profile_image" [src]="authService.currentUser()?.profile_image" alt="Profile" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color);">
            <span *ngIf="!authService.currentUser()?.profile_image" class="material-symbols-rounded" style="font-size: 2.25rem;">account_circle</span>
          </div>
        </div>
      </header>

      <div class="assign-layout">
        <!-- Form Side -->
        <div class="form-card">
          <div class="card-header">
            <h3>Task Details</h3>
            <p>Fill out the details to assign a new task</p>
          </div>
          <form #f="ngForm" (ngSubmit)="submitTask(f.valid || false)">
            <!-- Project & Employee Row -->
            <div class="form-row">
              <div class="form-group">
                <label for="task-project">Project *</label>
                <select id="task-project" name="project_id" class="form-control animate-focus" required [(ngModel)]="taskForm.project_id">
                  <option [value]="undefined" disabled selected>Select a project</option>
                  <option *ngFor="let p of projects" [value]="p.id">{{ p.project_name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label for="task-employee">Assignee *</label>
                <select id="task-employee" name="employee_id" class="form-control animate-focus" required [(ngModel)]="taskForm.employee_id">
                  <option [value]="undefined" disabled selected>Select an employee</option>
                  <option *ngFor="let emp of employees" [value]="emp.id">{{ emp.name }}</option>
                </select>
              </div>
            </div>

            <!-- Task Title -->
            <div class="form-group">
              <label for="task-title">Task Title *</label>
              <input 
                type="text" 
                id="task-title" 
                name="task_title" 
                class="form-control animate-focus" 
                required 
                placeholder="e.g. Implement User Authentication"
                [(ngModel)]="taskForm.task_title" 
                #titleInput="ngModel" />
              <div class="error-message" *ngIf="titleInput.invalid && titleInput.touched">
                Task title is required.
              </div>
            </div>

            <!-- Description -->
            <div class="form-group">
              <label for="task-desc">Description</label>
              <textarea 
                id="task-desc" 
                name="description" 
                class="form-control animate-focus" 
                rows="4"
                placeholder="Provide a detailed description of the task, requirements, or links..."
                [(ngModel)]="taskForm.description"></textarea>
            </div>

            <!-- Priority & Deadline Row -->
            <div class="form-row">
              <div class="form-group">
                <label for="task-priority">Priority *</label>
                <select id="task-priority" name="priority" class="form-control animate-focus" required [(ngModel)]="taskForm.priority">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div class="form-group">
                <label for="task-deadline">Deadline *</label>
                <input 
                  type="date" 
                  id="task-deadline" 
                  name="deadline" 
                  class="form-control animate-focus" 
                  required 
                  [(ngModel)]="taskForm.deadline" 
                  #deadlineInput="ngModel" />
                <div class="error-message" *ngIf="deadlineInput.invalid && deadlineInput.touched">
                  Deadline date is required.
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="form-actions">
              <button type="button" class="btn btn-secondary animate-btn" (click)="resetForm(f)">Reset Form</button>
              <button type="submit" class="btn btn-primary animate-btn" [disabled]="f.invalid || isSubmitting">
                <span class="material-symbols-rounded" *ngIf="!isSubmitting">assignment_turned_in</span>
                <span class="spinner" *ngIf="isSubmitting"></span>
                {{ isSubmitting ? 'Assigning...' : 'Assign Task' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Live Preview Side -->
        <div class="preview-sidebar">
          <div class="preview-sticky">
            <div class="preview-header">
              <h3>Live Preview</h3>
              <span class="preview-badge">Interactive</span>
            </div>
            
            <div class="preview-card-container">
              <div class="preview-card" [ngClass]="taskForm.priority || 'medium'">
                <div class="preview-card-header">
                  <span class="preview-project-name">{{ getSelectedProjectName() || 'No Project Selected' }}</span>
                  <span class="preview-priority-badge" [ngClass]="'priority-' + (taskForm.priority || 'medium')">
                    {{ (taskForm.priority || 'medium') | titlecase }}
                  </span>
                </div>
                
                <h4 class="preview-task-title">{{ taskForm.task_title || 'Untitled Task Title' }}</h4>
                <p class="preview-task-desc">{{ taskForm.description || 'Provide a detailed description of the task, requirements, or links...' }}</p>
                
                <div class="preview-card-footer">
                  <div class="preview-assignee">
                    <div class="preview-avatar">
                      <span class="material-symbols-rounded">person</span>
                    </div>
                    <div class="preview-assignee-info">
                      <span class="preview-label">Assignee</span>
                      <span class="preview-value">{{ getSelectedEmployeeName() || 'Unassigned' }}</span>
                    </div>
                  </div>
                  
                  <div class="preview-deadline">
                    <span class="preview-label">Deadline</span>
                    <span class="preview-value">
                      <span class="material-symbols-rounded text-sm" style="font-size: 1.125rem;">calendar_month</span>
                      {{ formatDate(taskForm.deadline || '') }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Toast Notification Container -->
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
    </div>
  `,
  styles: [`
    .assign-task-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 1rem;
    }
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .menu-toggle-btn {
      font-size: 2.25rem;
      color: var(--primary-color);
      background-color: var(--primary-color-light);
      padding: 0.5rem;
      border-radius: var(--border-radius-md);
    }
    
    .page-header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    
    .subtitle {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-top: 0.125rem;
    }
    
    .assign-layout {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 2rem;
      align-items: start;
    }
    
    @media (max-width: 992px) {
      .assign-layout {
        grid-template-columns: 1fr;
      }
    }
    
    .form-card {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      padding: 2rem;
      box-shadow: var(--shadow-sm);
    }
    
    .card-header {
      margin-bottom: 1.75rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 1rem;
    }
    
    .card-header h3 {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    
    .card-header p {
      font-size: 0.8125rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1.5rem;
      border-top: 1px solid var(--border-color);
      padding-top: 1.5rem;
    }
    
    /* Animations & Interactive Micro-interactions */
    .animate-focus {
      transition: all 0.25s ease;
    }
    
    .animate-focus:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px var(--primary-color-light);
      transform: translateY(-1px);
    }
    
    .animate-btn {
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .animate-btn:hover {
      transform: translateY(-1px);
    }
    
    .animate-btn:active {
      transform: translateY(1px);
    }
    
    /* Spinner for loading state */
    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    /* Preview Sticky Area */
    .preview-sticky {
      position: sticky;
      top: 2rem;
    }
    
    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .preview-header h3 {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .preview-badge {
      background-color: var(--primary-color-light);
      color: var(--primary-color);
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: var(--border-radius-full);
      border: 1px solid rgba(79, 70, 229, 0.1);
    }
    
    .preview-card-container {
      background: radial-gradient(circle at 10% 20%, rgba(238, 242, 255, 0.8) 0%, rgba(255, 255, 255, 0.8) 90%);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      padding: 2rem;
      box-shadow: var(--shadow-sm);
      display: flex;
      justify-content: center;
      align-items: center;
      backdrop-filter: blur(10px);
    }
    
    .preview-card {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      padding: 1.5rem;
      box-shadow: var(--shadow-md);
      width: 100%;
      max-width: 380px;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      border-left: 5px solid var(--primary-color);
      position: relative;
      overflow: hidden;
    }
    
    .preview-card.high {
      border-left-color: #EF4444;
    }
    .preview-card.medium {
      border-left-color: #F59E0B;
    }
    .preview-card.low {
      border-left-color: #3B82F6;
    }
    
    .preview-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .preview-project-name {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .preview-priority-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.625rem;
      border-radius: var(--border-radius-full);
    }
    
    .preview-priority-badge.priority-high {
      background-color: #FEF2F2;
      color: #DC2626;
      border: 1px solid #FCA5A5;
    }
    .preview-priority-badge.priority-medium {
      background-color: #FFFBEB;
      color: #D97706;
      border: 1px solid #FDE68A;
    }
    .preview-priority-badge.priority-low {
      background-color: #EFF6FF;
      color: #2563EB;
      border: 1px solid #BFDBFE;
    }
    
    .preview-task-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
      word-wrap: break-word;
      transition: color 0.2s ease;
    }
    
    .preview-task-desc {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 1.5rem;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      word-wrap: break-word;
    }
    
    .preview-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border-color);
      padding-top: 1rem;
      gap: 1rem;
    }
    
    .preview-assignee {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .preview-avatar {
      width: 32px;
      height: 32px;
      border-radius: var(--border-radius-full);
      background-color: var(--bg-surface-hover);
      border: 1.5px solid var(--text-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-primary);
    }
    
    .preview-avatar span {
      font-size: 1.25rem;
    }
    
    .preview-assignee-info {
      display: flex;
      flex-direction: column;
    }
    
    .preview-label {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .preview-value {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    
    .preview-deadline {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
  `]
})
export class AssignTaskComponent implements OnInit {
  projects: Project[] = [];
  employees: User[] = [];
  
  isSubmitting = false;
  
  taskForm: Partial<Task> = {
    project_id: undefined,
    employee_id: undefined,
    task_title: '',
    description: '',
    priority: 'medium',
    deadline: '',
    status: 'pending'
  };

  // Toast notifications state
  toasts: Toast[] = [];
  private nextToastId: number = 1;

  constructor(
    private projectService: ProjectService,
    private userService: UserService,
    private taskService: TaskService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.loadProjects();
    this.loadEmployees();
  }

  loadProjects() {
    this.projectService.getProjects().subscribe({
      next: (projs) => { this.projects = projs; },
      error: (err) => {
        console.error('Error loading projects', err);
        this.showToast('Error', 'Failed to load projects list.', 'error');
      }
    });
  }

  loadEmployees() {
    this.userService.getUsers().subscribe({
      next: (users) => { this.employees = users; },
      error: (err) => {
        console.error('Error loading employees', err);
        this.showToast('Error', 'Failed to load employees list.', 'error');
      }
    });
  }

  getSelectedProjectName(): string {
    if (!this.taskForm.project_id) return '';
    const proj = this.projects.find(p => p.id === Number(this.taskForm.project_id));
    return proj ? proj.project_name : '';
  }

  getSelectedEmployeeName(): string {
    if (!this.taskForm.employee_id) return '';
    const emp = this.employees.find(e => e.id === Number(this.taskForm.employee_id));
    return emp ? emp.name : '';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  submitTask(isValid: boolean) {
    if (!isValid) {
      this.showToast('Validation Error', 'Please fill in all required fields.', 'error');
      return;
    }

    this.isSubmitting = true;
    
    // Construct the actual Task object
    const newTask: Task = {
      project_id: Number(this.taskForm.project_id),
      employee_id: Number(this.taskForm.employee_id),
      task_title: this.taskForm.task_title || '',
      description: this.taskForm.description || '',
      priority: this.taskForm.priority || 'medium',
      deadline: this.taskForm.deadline || '',
      status: 'pending'
    };

    this.taskService.createTask(newTask).subscribe({
      next: (created) => {
        this.isSubmitting = false;
        this.showToast('Success!', `Task "${created.task_title}" has been assigned successfully.`, 'success');
        
        // Reset the form
        this.taskForm = {
          project_id: undefined,
          employee_id: undefined,
          task_title: '',
          description: '',
          priority: 'medium',
          deadline: '',
          status: 'pending'
        };
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error creating task', err);
        this.showToast('Assignment Failed', 'Failed to assign the task on the server.', 'error');
      }
    });
  }

  resetForm(form: NgForm) {
    form.resetForm({
      priority: 'medium',
      status: 'pending'
    });
    this.taskForm = {
      project_id: undefined,
      employee_id: undefined,
      task_title: '',
      description: '',
      priority: 'medium',
      deadline: '',
      status: 'pending'
    };
    this.showToast('Form Reset', 'The assignment form was cleared.', 'warning');
  }

  // Toast Helpers
  showToast(title: string, message: string, type: 'success' | 'warning' | 'error') {
    const id = this.nextToastId++;
    const toast: Toast = { id, title, message, type };
    this.toasts.push(toast);

    setTimeout(() => {
      this.removeToast(id);
    }, 4000);
  }

  removeToast(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }
}