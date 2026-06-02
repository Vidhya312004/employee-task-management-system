import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../services/user.service';
import { ProjectService } from '../services/project.service';
import { TaskService } from '../services/task.service';
import { AuthService } from '../services/auth.service';

interface Task {
  id: number;
  title: string;
  project: string;
  employee: string;
  priority: 'High' | 'Medium' | 'Low';
  deadline: string;
  status: 'In Progress' | 'Pending' | 'Completed';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1>Dashboard</h1>
        <div class="profile-icon" title="Admin Profile" routerLink="/admin/profile">
          <img *ngIf="authService.currentUser()?.profile_image" [src]="authService.currentUser()?.profile_image" alt="Profile" class="avatar-img">
          <span *ngIf="!authService.currentUser()?.profile_image" class="material-symbols-rounded">account_circle</span>
        </div>
      </header>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <!-- Employees Card -->
        <div class="stat-card">
          <div class="stat-label">Employees</div>
          <div class="stat-content">
            <span class="material-symbols-rounded stat-icon employees-icon">group</span>
            <span class="stat-number">{{ employeeCount }}</span>
          </div>
        </div>

        <!-- Projects Card -->
        <div class="stat-card">
          <div class="stat-label">Projects</div>
          <div class="stat-content">
            <span class="material-symbols-rounded stat-icon projects-icon">folder_open</span>
            <span class="stat-number">{{ projectCount }}</span>
          </div>
        </div>

        <!-- Tasks Card -->
        <div class="stat-card">
          <div class="stat-label">Tasks</div>
          <div class="stat-content">
            <span class="material-symbols-rounded stat-icon tasks-icon">assignment</span>
            <span class="stat-number">{{ taskCount }}</span>
          </div>
        </div>

        <!-- Completed Tasks Card -->
        <div class="stat-card">
          <div class="stat-label">Completed Tasks</div>
          <div class="stat-content">
            <span class="material-symbols-rounded stat-icon completed-icon">check_circle</span>
            <span class="stat-number">{{ completedTaskCount }}</span>
          </div>
        </div>
      </div>

      <!-- Recent lists Section -->
      <div class="recent-grid">
        <!-- Recent Projects -->
        <div class="recent-card">
          <div class="recent-header">
            <h3>Recent Projects</h3>
          </div>
          <div class="recent-body">
            <ul class="recent-list">
              <li *ngFor="let proj of recentProjects">
                <span class="bullet">•</span>
                <span class="item-name">{{ proj }}</span>
              </li>
              <li *ngIf="recentProjects.length === 0" class="empty-list">
                No projects available
              </li>
            </ul>
            <div class="recent-footer">
              <a routerLink="/admin/projects" class="view-all-link">View All</a>
            </div>
          </div>
        </div>

        <!-- Recent Tasks -->
        <div class="recent-card">
          <div class="recent-header">
            <h3>Recent Tasks</h3>
          </div>
          <div class="recent-body">
            <ul class="recent-list">
              <li *ngFor="let task of recentTasks">
                <span class="bullet">•</span>
                <span class="item-name">{{ task.task_title }}</span>
              </li>
              <li *ngIf="recentTasks.length === 0" class="empty-list">
                No tasks available
              </li>
            </ul>
            <div class="recent-footer">
              <a routerLink="/admin/tasks" class="view-all-link">View All</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 1rem;
    }

    .dashboard-header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .profile-icon {
      color: var(--text-secondary);
      cursor: pointer;
      transition: color 0.2s ease;
      display: flex;
      align-items: center;
    }

    .profile-icon span {
      font-size: 2.25rem;
    }
    
    .avatar-img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--border-color);
    }

    .profile-icon:hover {
      color: var(--primary-color);
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .stat-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 1rem;
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .stat-icon {
      font-size: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .employees-icon {
      color: #3B82F6;
    }

    .projects-icon {
      color: #10B981;
    }

    .tasks-icon {
      color: #F59E0B;
    }

    .completed-icon {
      color: #8B5CF6;
    }

    .stat-number {
      font-size: 2.25rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    /* Recent Section */
    .recent-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    @media (max-width: 768px) {
      .recent-grid {
        grid-template-columns: 1fr;
      }
    }

    .recent-card {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      padding: 1.75rem;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .recent-header {
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 1rem;
      margin-bottom: 1.25rem;
    }

    .recent-header h3 {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .recent-body {
      display: flex;
      flex-direction: column;
      flex: 1;
      justify-content: space-between;
    }

    .recent-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .recent-list li {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.9375rem;
      color: var(--text-primary);
    }

    .bullet {
      color: var(--text-secondary);
      font-size: 1.25rem;
      line-height: 1;
    }

    .item-name {
      font-weight: 500;
    }

    .empty-list {
      color: var(--text-secondary);
      font-style: italic;
      padding: 1rem 0;
    }

    .recent-footer {
      display: flex;
      justify-content: flex-end;
      margin-top: auto;
    }

    .view-all-link {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--primary-color);
      transition: color 0.2s ease;
    }

    .view-all-link:hover {
      color: var(--primary-color-hover);
      text-decoration: underline;
    }
  `]
})
export class DashboardComponent implements OnInit {
  tasks: any[] = [];

  // Dashboard metrics
  employeeCount: number = 0;
  projectCount: number = 0;
  taskCount: number = 0;
  completedTaskCount: number = 0;

  // Lists
  recentProjects: string[] = [];
  recentTasks: any[] = [];
  
  user: any;

  constructor(
    private userService: UserService,
    private projectService: ProjectService,
    private taskService: TaskService,
    public authService: AuthService
  ) { }

  ngOnInit() {
    this.user = this.authService.currentUser();
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.taskService.getTasks().subscribe({
      next: (tasks: any[]) => {
        this.tasks = tasks;
        this.taskCount = tasks.length;
        this.completedTaskCount = tasks.filter(t => t.status === 'completed').length;
        this.recentTasks = [...tasks].slice(-4).reverse();
      },
      error: (e) => console.error('Error loading tasks', e)
    });

    this.projectService.getProjects().subscribe({
      next: (projects: any[]) => {
        this.projectCount = projects.length;
        this.recentProjects = [...projects].slice(-4).reverse().map(p => p.project_name);
      },
      error: (e) => console.error('Error loading projects', e)
    });

    this.userService.getUsers().subscribe({
      next: (users: any[]) => {
        this.employeeCount = users.filter(u => u.role !== 'admin').length;
      },
      error: (e) => console.error('Error loading users', e)
    });
  }
}
