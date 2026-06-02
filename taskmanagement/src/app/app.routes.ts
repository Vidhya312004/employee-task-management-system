import { Routes } from '@angular/router';

import { DashboardComponent } from './dashboard/dashboard.component';
import { TaskManagementComponent } from './task-management/task-management.component';
import { EmployeesComponent } from './employees/employees.component';
import { ProjectsComponent } from './projects/projects.component';

import { AssignTaskComponent } from './pages/assign-task/assigntask.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';

// ADMIN
import { AdminLogin } from './admin/admin-login/admin-login';
import { AdminRegister } from './admin/admin-register/admin-register';

// EMPLOYEE
import { EmployeeLogin } from './employee/employee-login/employee-login';
import { EmployeeDashboard } from './employee/employee-dashboard/employee-dashboard';
import { EmployeeTasksComponent } from './employee/employee-tasks/employee-tasks.component';
import { EmployeeProfileComponent } from './employee/employee-profile/employee-profile.component';
import { EmployeeSettings } from './employee/employee-settings/employee-settings';

// SETTINGS
import { AdminSettings } from './admin/admin-settings/admin-settings';

// GUARDS
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [

  // LANDING PAGE
  {
    path: '',
    redirectTo: 'admin/login',
    pathMatch: 'full'
  },

  // =========================
  // PUBLIC ROUTES
  // =========================

  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    canActivate: [guestGuard]
  },

  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    canActivate: [guestGuard]
  },

  // =========================
  // ADMIN ROUTES
  // =========================

  {
    path: 'admin/login',
    component: AdminLogin,
    canActivate: [guestGuard]
  },

  {
    path: 'admin/register',
    component: AdminRegister,
    canActivate: [guestGuard]
  },

  {
    path: 'admin/dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },

  {
    path: 'admin/profile',
    component: EmployeeProfileComponent,
    canActivate: [authGuard]
  },

  {
    path: 'admin/tasks',
    component: TaskManagementComponent,
    canActivate: [authGuard]
  },

  {
    path: 'admin/employees',
    component: EmployeesComponent,
    canActivate: [authGuard]
  },

  {
    path: 'admin/projects',
    component: ProjectsComponent,
    canActivate: [authGuard]
  },

  {
    path: 'admin/assign-task',
    component: AssignTaskComponent,
    canActivate: [authGuard]
  },

  {
    path: 'admin/settings',
    component: AdminSettings,
    canActivate: [authGuard]
  },

  // =========================
  // EMPLOYEE ROUTES
  // =========================

  {
    path: 'employee/login',
    component: EmployeeLogin,
    canActivate: [guestGuard]
  },

  {
    path: 'employee/dashboard',
    component: EmployeeDashboard,
    canActivate: [authGuard]
  },

  {
    path: 'employee/tasks',
    component: EmployeeTasksComponent,
    canActivate: [authGuard]
  },

  {
    path: 'employee/profile',
    component: EmployeeProfileComponent,
    canActivate: [authGuard]
  },

  {
    path: 'employee/settings',
    component: EmployeeSettings,
    canActivate: [authGuard]
  },

  // OPTIONAL
  {
    path: '**',
    redirectTo: 'admin/login'
  }

];