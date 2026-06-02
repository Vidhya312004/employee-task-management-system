import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';

// Interface removed since we use User from model

interface Toast {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error';
}

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="employees-container">
      <!-- Header bar with breadcrumbs and user menu -->
      <header class="page-header">
        <div class="header-left">
          <span class="material-symbols-rounded menu-toggle-btn">menu</span>
          <h1>Manage Employees</h1>
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
            placeholder="Search employee..." 
            class="search-input" 
            [(ngModel)]="searchTerm" 
            (input)="currentPage = 1" />
        </div>
        
        <button class="add-btn" (click)="openAddModal()">
          <span class="material-symbols-rounded">add</span>
          Add Employee
        </button>
      </div>

      <!-- Data Table -->
      <div class="table-container" *ngIf="getFilteredEmployees().length > 0">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 60px;">Avatar</th>
              <th style="width: 80px;">ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Job Role</th>
              <th class="action-column" style="width: 120px;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let emp of getPaginatedEmployees()">
              <td>
                <img *ngIf="emp.profile_image" [src]="emp.profile_image" alt="Profile" class="table-avatar">
                <div *ngIf="!emp.profile_image" class="table-avatar-placeholder">
                  <span class="material-symbols-rounded">person</span>
                </div>
              </td>
              <td>{{ emp.id }}</td>
              <td class="font-medium">{{ emp.name }}</td>
              <td>{{ emp.email }}</td>
              <td>
                <span class="role-badge" [ngClass]="getRoleClass(emp.department || '')">
                  {{ (emp.department || 'Not Assigned') | titlecase }}
                </span>
              </td>
              <td class="action-column">
                <button class="icon-btn edit-btn" title="Edit" (click)="openEditModal(emp)">
                  <span class="material-symbols-rounded">edit</span>
                </button>
                <button class="icon-btn delete-btn" title="Delete" (click)="deleteEmployee(emp.id)">
                  <span class="material-symbols-rounded">delete</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div class="table-container" *ngIf="getFilteredEmployees().length === 0" style="box-shadow: none; border-color: var(--border-color);">
        <div class="empty-state">
          <span class="material-symbols-rounded empty-state-icon">group_off</span>
          <h3>No Employees Found</h3>
          <p>We couldn't find any employees matching your current search term.</p>
          <button class="btn btn-primary" (click)="openAddModal()">
            <span class="material-symbols-rounded">add</span>
            Add New Employee
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
          <h3>{{ isEditMode ? 'Edit Employee Info' : 'Add New Employee' }}</h3>
          <button class="modal-close" (click)="closeModal()">
            <span class="material-symbols-rounded">close</span>
          </button>
        </div>
        <form #f="ngForm" (ngSubmit)="saveEmployee(f.valid || false)">
          <div class="modal-body">
            <!-- Name -->
            <div class="form-group">
              <label for="emp-name">Full Name *</label>
              <input 
                type="text" 
                id="emp-name" 
                name="name" 
                class="form-control" 
                required 
                placeholder="e.g. Alexander Pierce"
                [(ngModel)]="employeeForm.name" 
                #nameInput="ngModel" />
              <div class="error-message" *ngIf="nameInput.invalid && nameInput.touched">
                Full Name is required.
              </div>
            </div>

            <!-- Email -->
            <div class="form-group">
              <label for="emp-email">Email Address *</label>
              <input 
                type="email" 
                id="emp-email" 
                name="email" 
                class="form-control" 
                required 
                email
                placeholder="e.g. alex@example.com"
                [(ngModel)]="employeeForm.email" 
                #emailInput="ngModel" />
              <div class="error-message" *ngIf="emailInput.invalid && emailInput.touched">
                <span *ngIf="emailInput.errors?.['required']">Email is required.</span>
                <span *ngIf="emailInput.errors?.['pattern']">Please enter a valid email address.</span>
              </div>
            </div>

            <!-- Job Role Selection -->
            <div class="form-group">
              <label for="emp-department">Job Role *</label>
              <select 
                id="emp-department" 
                name="department" 
                class="form-control" 
                required
                [(ngModel)]="employeeForm.department">
                <option value="developer">Developer</option>
                <option value="designer">Designer</option>
                <option value="tester">Tester</option>
                <option value="pm">Project Manager</option>
              </select>
            </div>

            <!-- Profile Image Upload -->
            <div class="form-group">
              <label for="emp-image">Profile Image (Optional)</label>
              <input 
                type="file" 
                id="emp-image" 
                class="form-control" 
                accept="image/*"
                (change)="onFileSelected($event)" />
              <small class="form-text text-muted" *ngIf="isEditMode && employeeForm.profile_image">
                Current image will be kept if no new file is selected.
              </small>
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="f.invalid">
              <span class="material-symbols-rounded">save</span>
              {{ isEditMode ? 'Save Changes' : 'Add Employee' }}
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
    .employees-container {
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

    .table-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
      border: 1px solid var(--border-color);
    }

    .table-avatar-placeholder {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: var(--bg-surface-hover);
      display: flex;
      justify-content: center;
      align-items: center;
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
    }

    .table-avatar-placeholder span {
      font-size: 1.25rem;
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

    .role-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem 0.75rem;
      border-radius: var(--border-radius-full);
      font-size: 0.75rem;
      font-weight: 600;
    }

    .role-developer {
      background-color: #E0F2FE;
      color: #0369A1;
    }

    .role-designer {
      background-color: #F3E8FF;
      color: #6B21A8;
    }

    .role-tester {
      background-color: #FEF3C7;
      color: #92400E;
    }

    .role-pm {
      background-color: #E2E8F0;
      color: #334155;
    }

    .role-admin {
      background-color: #FEE2E2;
      color: #991B1B;
    }
    
    .role-employee {
      background-color: #ECFDF5;
      color: #047857;
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
  `]
})
export class EmployeesComponent implements OnInit {
  employees: User[] = [];

  // Search & Filter
  searchTerm: string = '';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;

  // Modal state
  showModal: boolean = false;
  isEditMode: boolean = false;
  editingEmployeeId: number | null = null;
  selectedFile: File | null = null;

  // Form State
  employeeForm: Partial<User> = {
    name: '',
    email: '',
    role: 'employee',
    department: 'developer',
    password: 'password123' // default password for new employees
  };

  // Toast notifications
  toasts: Toast[] = [];
  private nextToastId: number = 1;

  isBrowser: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private userService: UserService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.loadEmployees();
  }

  getApiUrl(path: string): string {
    if (this.isBrowser) {
      const origin = window.location.origin;
      if (origin.includes(':4200')) {
        return `http://localhost:4000${path}`;
      }
      return `${origin}${path}`;
    }
    return `http://localhost:4000${path}`;
  }

  // Load from Angular Service
  loadEmployees() {
    this.userService.getUsers().subscribe({
      next: (users) => {
        const seen = new Set<string>();
        const uniqueEmployees: User[] = [];
        users.forEach((emp) => {
          const key = emp.email || (emp.id !== undefined ? emp.id.toString() : '');
          if (key && !seen.has(key)) {
            seen.add(key);
            uniqueEmployees.push(emp);
          }
        });
        this.employees = uniqueEmployees;
        this.cdr.detectChanges();
      },
      error: (e) => {
        console.error('Error loading employees', e);
        this.showToast('Error', 'Failed to retrieve employees list from server.', 'error');
      }
    });
  }

  // Search logic
  getFilteredEmployees(): User[] {
    if (!this.employees) return [];

    return this.employees.filter(emp => {
      const name = emp.name || '';
      const email = emp.email || '';
      const role = emp.role || '';
      const department = emp.department || '';
      const term = (this.searchTerm || '').toLowerCase();

      const matchesSearch =
        name.toLowerCase().includes(term) ||
        email.toLowerCase().includes(term) ||
        role.toLowerCase().includes(term) ||
        department.toLowerCase().includes(term);

      return matchesSearch;
    });
  }

  // Pagination logic
  getPaginatedEmployees(): User[] {
    const filtered = this.getFilteredEmployees();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(startIndex, startIndex + this.itemsPerPage);
  }

  getTotalPages(): number {
    const filtered = this.getFilteredEmployees();
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
    this.editingEmployeeId = null;
    this.selectedFile = null;
    this.employeeForm = {
      name: '',
      email: '',
      role: 'employee',
      department: 'developer',
      password: 'password123'
    };
    this.showModal = true;
  }

  // Edit Modal
  openEditModal(emp: User) {
    this.isEditMode = true;
    this.editingEmployeeId = emp.id || null;
    this.selectedFile = null;
    this.employeeForm = {
      name: emp.name,
      email: emp.email,
      role: 'employee',
      department: emp.department || 'developer',
      profile_image: emp.profile_image
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedFile = null;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  // CRUD - Save Employee
  saveEmployee(formIsValid: boolean) {
    if (!formIsValid) {
      this.showToast('Validation Error', 'Please complete the form fields correctly.', 'error');
      return;
    }

    if (this.isEditMode && this.editingEmployeeId !== null) {
      // Update
      this.userService.updateUser(this.editingEmployeeId, this.employeeForm).subscribe({
        next: (updated) => {
          if (this.selectedFile && updated.id) {
            this.userService.uploadProfileImage(updated.id, this.selectedFile).subscribe({
              next: () => {
                this.finishSave(true);
              },
              error: () => {
                this.showToast('Warning', 'Employee updated, but failed to upload profile image.', 'warning');
                this.finishSave(true);
              }
            });
          } else {
            this.finishSave(true);
          }
        },
        error: (e) => {
          console.error('Error saving employee', e);
          this.showToast('Error', 'Failed to save employee data to server.', 'error');
        }
      });
    } else {
      // Create
      this.userService.createUser(this.employeeForm as User).subscribe({
        next: (created) => {
          if (this.selectedFile && created.id) {
            this.userService.uploadProfileImage(created.id, this.selectedFile).subscribe({
              next: () => {
                this.finishSave(false);
              },
              error: () => {
                this.showToast('Warning', 'Employee created, but failed to upload profile image.', 'warning');
                this.finishSave(false);
              }
            });
          } else {
            this.finishSave(false);
          }
        },
        error: (e) => {
          console.error('Error saving employee', e);
          this.showToast('Error', 'Failed to save employee data to server.', 'error');
        }
      });
    }
  }

  private finishSave(isEdit: boolean) {
    this.loadEmployees();
    if (isEdit) {
      this.showToast('Success!', `Employee "${this.employeeForm.name}" updated successfully.`, 'success');
    } else {
      this.showToast('Created!', `Employee "${this.employeeForm.name}" was added successfully.`, 'success');
    }
    this.closeModal();
    this.currentPage = 1;
  }

  // CRUD - Delete Employee
  deleteEmployee(id: number | undefined) {
    if (!id) return;
    const empToDelete = this.employees.find(e => e.id === id);
    if (!empToDelete) return;

    if (confirm(`Are you sure you want to remove employee: "${empToDelete.name}"?`)) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.loadEmployees();
          this.showToast('Removed', `Employee "${empToDelete.name}" has been deleted.`, 'warning');

          if (this.currentPage > this.getTotalPages() && this.currentPage > 1) {
            this.currentPage--;
          }
        },
        error: (e) => {
          console.error('Error deleting employee', e);
          this.showToast('Error', 'Failed to delete employee from server.', 'error');
        }
      });
    }
  }

  // Styles Helpers
  getRoleClass(role: string): string {
    if (!role) return '';
    switch (role.toLowerCase()) {
      case 'admin':
      case 'administrator':
        return 'role-admin';
      case 'employee':
        return 'role-employee';
      case 'developer':
        return 'role-developer';
      case 'designer':
        return 'role-designer';
      case 'tester':
        return 'role-tester';
      case 'project manager':
      case 'pm':
        return 'role-pm';
      default:
        return '';
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
