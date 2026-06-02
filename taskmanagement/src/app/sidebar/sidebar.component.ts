import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar">
      <div class="sidebar-header">
        <img src="/logo.png" alt="Logo" class="logo" />
        <h2>Zira</h2>
        <div class="user-profile" [routerLink]="authService.currentUser()?.role === 'employee' ? '/employee/profile' : '/admin/profile'" style="cursor: pointer;" title="View Profile">
          <img *ngIf="authService.currentUser()?.profile_image" [src]="authService.currentUser()?.profile_image" alt="Profile" class="sidebar-avatar">
          <div *ngIf="!authService.currentUser()?.profile_image" class="avatar-placeholder">
            <span class="material-symbols-rounded">person</span>
          </div>
          <div class="user-info">
            <span class="user-name">{{ authService.currentUser()?.name || 'User' }}</span>
            <span class="user-role">{{ authService.currentUser()?.role === 'employee' ? 'Employee' : 'Administrator' }}</span>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <ul>
          <li routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
            <a [routerLink]="authService.currentUser()?.role === 'employee' ? '/employee/dashboard' : '/admin/dashboard'">
              <span class="material-symbols-rounded">home</span>
              Dashboard
            </a>
          </li>
          
          <ng-container *ngIf="authService.currentUser()?.role !== 'admin'">
            <li routerLinkActive="active">
              <a routerLink="/employee/tasks">
                <span class="material-symbols-rounded">checklist</span>
                My Tasks
              </a>
            </li>
            <li routerLinkActive="active">
              <a routerLink="/employee/settings">
                <span class="material-symbols-rounded">settings</span>
                Settings
              </a>
            </li>
          </ng-container>

          <ng-container *ngIf="authService.currentUser()?.role === 'admin'">
            <li routerLinkActive="active">
              <a routerLink="/admin/employees">
                <span class="material-symbols-rounded">group</span>
                Manage Employees
              </a>
            </li>
            <li routerLinkActive="active">
              <a routerLink="/admin/projects">
                <span class="material-symbols-rounded">folder_open</span>
                Manage Projects
              </a>
            </li>
            <li routerLinkActive="active">
              <a routerLink="/admin/assign-task">
                <span class="material-symbols-rounded">assignment_add</span>
                Assign Tasks
              </a>
            </li>
            <li routerLinkActive="active">
              <a routerLink="/admin/tasks">
                <span class="material-symbols-rounded">assignment</span>
                Task Management
              </a>
            </li>
            <li routerLinkActive="active">
              <a routerLink="/admin/settings">
                <span class="material-symbols-rounded">settings</span>
                Settings
              </a>
            </li>
          </ng-container>
        </ul>
      </nav>

      <div class="sidebar-footer">
        <a href="#" (click)="logout($event)" class="logout-link">
          <span class="material-symbols-rounded">logout</span>
          Logout
        </a>
      </div>
    </aside>

  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width);
      height: 100vh;
      background-color: var(--bg-surface);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
    }

    .sidebar-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .sidebar-header h2 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 1.5rem;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      border-radius: var(--border-radius-md);
      transition: background-color 0.2s ease;
    }
    
    .user-profile:hover {
      background-color: var(--bg-surface-hover);
    }

    .sidebar-avatar {
      width: 40px;
      height: 40px;
      border-radius: var(--border-radius-full);
      object-fit: cover;
      border: 2px solid var(--text-primary);
      flex-shrink: 0;
    }
    .logo {
      width: 60px;
      height: auto;
      margin-bottom: 0.5rem;
    }

    .avatar-placeholder {
      width: 40px;
      height: 40px;
      border-radius: var(--border-radius-full);
      background-color: var(--bg-surface-hover);
      border: 2px solid var(--text-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }

    .avatar-placeholder span {
      font-size: 1.5rem;
      color: var(--text-primary);
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-primary);
    }

    .user-role {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .sidebar-nav {
      flex: 1;
      padding: 1.5rem 0;
      overflow-y: auto;
    }

    .sidebar-nav ul {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .sidebar-nav a {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      margin: 0 1rem;
      border-radius: var(--border-radius-md);
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }

    .sidebar-nav a:hover {
      background-color: var(--bg-surface-hover);
    }

    .sidebar-nav a span {
      font-size: 1.25rem;
      color: var(--text-secondary);
      transition: color 0.2s ease;
    }

    .sidebar-nav li.active a {
      background-color: var(--primary-color-light);
      color: var(--primary-color);
      border-color: var(--primary-color-light);
    }

    .sidebar-nav li.active a span {
      color: var(--primary-color);
    }

    .sidebar-footer {
      padding: 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    .logout-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
      transition: color 0.2s ease;
    }

    .logout-link:hover {
      color: var(--primary-color);
    }
  `]
})
export class SidebarComponent {
  public authService = inject(AuthService);

  logout(event: Event) {
    event.preventDefault();
    this.authService.logout();
  }
}
