import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './employee-dashboard.html',
  styleUrl: './employee-dashboard.css',
})
export class EmployeeDashboard implements OnInit {
  tasks: any[] = [];
  pendingTasksList: any[] = [];
  completedTasksList: any[] = [];
  
  employeeName: string = '';
  user: any;

  constructor(
    private taskService: TaskService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    const user = this.authService.currentUser();
    if (!user) return;
    this.user = user;
    this.employeeName = user.name;

    this.taskService.getTasks().subscribe({
      next: (tasks: any[]) => {
        const myTasks = tasks.filter(t => t.employee_id === user.id);
        this.tasks = myTasks;
        this.pendingTasksList = myTasks.filter(t => t.status === 'pending');
        this.completedTasksList = myTasks.filter(t => t.status === 'completed');
        this.cdr.detectChanges();
      },
      error: (e) => console.error('Error loading tasks', e)
    });
  }
}
