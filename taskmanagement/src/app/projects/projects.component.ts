import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProjectService } from '../services/project.service';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { Project } from '../models/project.model';
import { User } from '../models/user.model';

interface Toast {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error';
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="projects-container">
      <!-- Header bar with breadcrumbs and user menu -->
      <header class="page-header">
        <div class="header-left">
          <span class="material-symbols-rounded menu-toggle-btn">menu</span>
          <h1>Manage Projects</h1>
        </div>
        <div class="header-right">
          <div class="profile-icon" title="Admin Profile" routerLink="/admin/profile" style="cursor: pointer;">
            <img *ngIf="authService.currentUser()?.profile_image" [src]="authService.currentUser()?.profile_image" alt="Profile" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color);">
            <span *ngIf="!authService.currentUser()?.profile_image" class="material-symbols-rounded" style="font-size: 2.25rem;">account_circle</span>
          </div>
        </div>
      </header>

      <!-- Subheader Action Area -->
      <div class="action-bar">
        <div class="search-container">
          <input 
            type="text" 
            placeholder="Search project..." 
            class="search-input" 
            [(ngModel)]="searchTerm" 
            (input)="currentPage = 1" />
        </div>
        
        <button class="add-btn" (click)="openAddModal()">
          <span class="material-symbols-rounded">add</span>
          Add Project
        </button>
      </div>

      <!-- Data Table -->
      <div class="table-container" *ngIf="getFilteredProjects().length > 0">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 80px;">ID</th>
              <th>Project Name</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th class="action-column" style="width: 120px;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let proj of getPaginatedProjects()">
              <td>{{ proj.id }}</td>
              <td class="font-medium">
                <div class="project-name">{{ proj.project_name }}</div>
              </td>
              <td>{{ proj.start_date | date:'dd/MM/yyyy' }}</td>
              <td>{{ proj.end_date | date:'dd/MM/yyyy' }}</td>
              <td>
                {{ proj.status === 'ongoing' ? 'In Progress' : (proj.status | titlecase) }}
              </td>
              <td class="action-column">
                <button class="icon-btn edit-btn" title="Edit" (click)="openEditModal(proj)">
                  <span class="material-symbols-rounded">edit</span>
                </button>
                <button class="icon-btn delete-btn" title="Delete" (click)="deleteProject(proj.id)">
                  <span class="material-symbols-rounded">delete</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div class="table-container" *ngIf="getFilteredProjects().length === 0" style="box-shadow: none; border-color: var(--border-color);">
        <div class="empty-state">
          <span class="material-symbols-rounded empty-state-icon">folder_off</span>
          <h3>No Projects Found</h3>
          <p>We couldn't find any projects matching your current search term.</p>
          <button class="btn btn-primary" (click)="openAddModal()">
            <span class="material-symbols-rounded">add</span>
            Add New Project
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

    <!-- Modal Backdrop -->
    <div class="modal-backdrop" [class.show]="showModal" (click)="closeModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ isEditMode ? 'Edit Project' : 'Add New Project' }}</h3>
          <button class="modal-close" (click)="closeModal()">
            <span class="material-symbols-rounded">close</span>
          </button>
        </div>
        <form #f="ngForm" (ngSubmit)="saveProject(f.valid || false)">
          <div class="modal-body">
            <!-- Project Name -->
            <div class="form-group">
              <label for="proj-name">Project Name *</label>
              <input 
                type="text" 
                id="proj-name" 
                name="project_name" 
                class="form-control" 
                required 
                placeholder="e.g. Website Redesign"
                [(ngModel)]="projectForm.project_name" 
                #nameInput="ngModel" />
              <div class="error-message" *ngIf="nameInput.invalid && nameInput.touched">
                Project Name is required.
              </div>
            </div>

            <!-- Description -->
            <div class="form-group">
              <label for="proj-desc">Description</label>
              <textarea 
                id="proj-desc" 
                name="description" 
                class="form-control" 
                rows="3"
                placeholder="Brief description of the project"
                [(ngModel)]="projectForm.description"></textarea>
            </div>

            <div class="form-row">
              <!-- Start Date -->
              <div class="form-group">
                <label for="proj-start">Start Date *</label>
                <input 
                  type="date" 
                  id="proj-start" 
                  name="start_date" 
                  class="form-control" 
                  required 
                  [(ngModel)]="projectForm.start_date" 
                  #startDateInput="ngModel" />
                <div class="error-message" *ngIf="startDateInput.invalid && startDateInput.touched">
                  Start Date is required.
                </div>
              </div>

              <!-- End Date -->
              <div class="form-group">
                <label for="proj-end">End Date *</label>
                <input 
                  type="date" 
                  id="proj-end" 
                  name="end_date" 
                  class="form-control" 
                  required 
                  [(ngModel)]="projectForm.end_date" 
                  #endDateInput="ngModel" />
                <div class="error-message" *ngIf="endDateInput.invalid && endDateInput.touched">
                  End Date is required.
                </div>
              </div>
            </div>

            <!-- Status -->
            <div class="form-group">
              <label for="proj-status">Status *</label>
              <select 
                id="proj-status" 
                name="status" 
                class="form-control" 
                required
                [(ngModel)]="projectForm.status">
                <option value="pending">Pending</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <!-- Created By -->
            <div class="form-group">
              <label for="proj-creator">Project Manager *</label>
              <select 
                id="proj-creator" 
                name="created_by" 
                class="form-control" 
                required
                [(ngModel)]="projectForm.created_by">
                <option *ngFor="let user of users" [value]="user.id">{{ user.name }}</option>
              </select>
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="f.invalid">
              <span class="material-symbols-rounded">save</span>
              {{ isEditMode ? 'Save Changes' : 'Add Project' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Toast Notifications -->
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
    .projects-container {
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
      gap: 0.75rem;
    }

    .menu-toggle-btn {
      font-size: 1.5rem;
      color: var(--text-secondary);
      cursor: pointer;
    }

    .page-header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .header-right .profile-icon {
      color: var(--text-secondary);
      display: flex;
      align-items: center;
    }

    .header-right .profile-icon span {
      font-size: 2.25rem;
    }

    .action-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
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

    .add-btn {
      background-color: var(--primary-color);
      color: white;
      padding: 0.625rem 1.25rem;
      border-radius: var(--border-radius-md);
      font-size: 0.875rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .add-btn:hover {
      background-color: var(--primary-color-hover);
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
      transform: translateY(-1px);
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
    
    .project-name {
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .project-desc {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-top: 0.25rem;
      max-width: 300px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem 0.75rem;
      border-radius: var(--border-radius-full);
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-pending {
      background-color: #FEF3C7;
      color: #92400E;
    }

    .status-ongoing {
      background-color: #E0F2FE;
      color: #0369A1;
    }

    .status-completed {
      background-color: #D1FAE5;
      color: #065F46;
    }

    .action-column {
      text-align: center;
      white-space: nowrap;
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

    .icon-btn.delete-btn {
      margin-left: 0.5rem;
    }

    .icon-btn.delete-btn:hover {
      color: #EF4444;
      border-color: #EF4444;
      background-color: #FEE2E2;
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
    
    .form-row {
      display: flex;
      gap: 1rem;
    }
    
    .form-row .form-group {
      flex: 1;
    }
  `]
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];
  users: User[] = [];

  // Search & Filter
  searchTerm: string = '';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;

  // Modal state
  showModal: boolean = false;
  isEditMode: boolean = false;
  editingProjectId: number | null = null;

  // Form State
  projectForm: Partial<Project> = {
    project_name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'pending',
    created_by: 1
  };

  // Toast notifications
  toasts: Toast[] = [];
  private nextToastId: number = 1;

  isBrowser: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private projectService: ProjectService,
    private userService: UserService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.loadProjects();
    this.loadUsers();
  }

  // Load from Angular Service
  loadProjects() {
    this.projectService.getProjects().subscribe({
      next: (projs) => {
        this.projects = projs;
        this.cdr.detectChanges();
      },
      error: (e) => {
        console.error('Error loading projects', e);
        this.showToast('Error', 'Failed to retrieve projects list from server.', 'error');
      }
    });
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (u) => {
        this.users = u.filter(user => user.department === 'pm');
        if (this.users.length > 0 && !this.isEditMode) {
          this.projectForm.created_by = this.users[0].id;
        }
        this.cdr.detectChanges();
      },
      error: (e) => {
        console.error('Error loading users', e);
      }
    });
  }

  // Search logic
  getFilteredProjects(): Project[] {
    return this.projects.filter(proj => {
      const matchesSearch =
        proj.project_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (proj.description && proj.description.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (proj.status && proj.status.toLowerCase().includes(this.searchTerm.toLowerCase()));

      return matchesSearch;
    });
  }

  // Pagination logic
  getPaginatedProjects(): Project[] {
    const filtered = this.getFilteredProjects();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(startIndex, startIndex + this.itemsPerPage);
  }

  getTotalPages(): number {
    const filtered = this.getFilteredProjects();
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

  // Add Modal
  openAddModal() {
    this.isEditMode = false;
    this.editingProjectId = null;

    // Format today's date for default values
    const today = new Date().toISOString().split('T')[0];

    this.projectForm = {
      project_name: '',
      description: '',
      start_date: today,
      end_date: today,
      status: 'pending',
      created_by: this.users.length > 0 ? this.users[0].id : 1
    };
    this.showModal = true;
  }

  // Edit Modal
  openEditModal(proj: Project) {
    this.isEditMode = true;
    this.editingProjectId = proj.id || null;
    this.projectForm = {
      project_name: proj.project_name,
      description: proj.description,
      start_date: proj.start_date.substring(0, 10), // Ensure YYYY-MM-DD
      end_date: proj.end_date.substring(0, 10),
      status: proj.status || 'pending',
      created_by: proj.created_by
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  // CRUD - Save Project
  saveProject(formIsValid: boolean) {
    if (!formIsValid) {
      this.showToast('Validation Error', 'Please complete the form fields correctly.', 'error');
      return;
    }

    if (this.isEditMode && this.editingProjectId !== null) {
      // Update
      this.projectService.updateProject(this.editingProjectId, this.projectForm).subscribe({
        next: (updated) => {
          this.loadProjects();
          this.showToast('Success!', `Project "${this.projectForm.project_name}" updated successfully.`, 'success');
          this.closeModal();
          this.currentPage = 1;
        },
        error: (e) => {
          console.error('Error saving project', e);
          this.showToast('Error', 'Failed to save project data to server.', 'error');
        }
      });
    } else {
      // Create
      this.projectService.createProject(this.projectForm as Project).subscribe({
        next: (created) => {
          this.loadProjects();
          this.showToast('Created!', `Project "${this.projectForm.project_name}" was added successfully.`, 'success');
          this.closeModal();
          this.currentPage = 1;
        },
        error: (e) => {
          console.error('Error saving project', e);
          this.showToast('Error', 'Failed to save project data to server.', 'error');
        }
      });
    }
  }

  // CRUD - Delete Project
  deleteProject(id: number | undefined) {
    if (!id) return;
    const projToDelete = this.projects.find(p => p.id === id);
    if (!projToDelete) return;

    if (confirm(`Are you sure you want to remove project: "${projToDelete.project_name}"?`)) {
      this.projectService.deleteProject(id).subscribe({
        next: () => {
          this.loadProjects();
          this.showToast('Removed', `Project "${projToDelete.project_name}" has been deleted.`, 'warning');

          if (this.currentPage > this.getTotalPages() && this.currentPage > 1) {
            this.currentPage--;
          }
        },
        error: (e) => {
          console.error('Error deleting project', e);
          this.showToast('Error', 'Failed to delete project from server.', 'error');
        }
      });
    }
  }

  // Styles Helpers
  getStatusClass(status: string | undefined): string {
    if (!status) return 'status-pending';
    switch (status.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'ongoing': return 'status-ongoing';
      case 'completed': return 'status-completed';
      default: return 'status-pending';
    }
  }

  // Toast Alerts
  showToast(title: string, message: string, type: 'success' | 'warning' | 'error') {
    const id = this.nextToastId++;
    const toast: Toast = { id, title, message, type };
    this.toasts.push(toast);
    this.cdr.detectChanges();

    setTimeout(() => {
      this.removeToast(id);
      this.cdr.detectChanges();
    }, 3000);
  }

  removeToast(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }
}
