import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-container">
      <div class="auth-box glassmorphism">
        <h2>Set New Password</h2>
        <p class="subtitle">Enter your new password below.</p>

        <div *ngIf="successMessage" class="alert alert-success">
          {{ successMessage }}
        </div>
        <div *ngIf="errorMessage" class="alert alert-error">
          {{ errorMessage }}
        </div>

        <form (ngSubmit)="onSubmit()" #resetForm="ngForm" *ngIf="!successMessage">
          <div class="form-group">
            <label for="password">New Password</label>
            <input type="password" id="password" name="password" [(ngModel)]="credentials.password" required minlength="6" placeholder="Enter new password">
          </div>

          <div class="form-group">
            <label for="password_confirmation">Confirm Password</label>
            <input type="password" id="password_confirmation" name="password_confirmation" [(ngModel)]="credentials.password_confirmation" required minlength="6" placeholder="Confirm new password">
          </div>
          
          <button type="submit" class="btn-primary" [disabled]="!resetForm.form.valid || isLoading">
            {{ isLoading ? 'Resetting...' : 'Reset Password' }}
          </button>
        </form>
        
        <div class="auth-links" *ngIf="successMessage">
          <a routerLink="/admin/login" class="back-link">Go to Login</a>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  credentials = { 
    email: '', 
    password: '', 
    password_confirmation: '', 
    token: '' 
  };
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.credentials.token = params['token'] || '';
      this.credentials.email = params['email'] || '';

      if (!this.credentials.token || !this.credentials.email) {
        this.errorMessage = 'Invalid password reset link.';
      }
    });
  }

  onSubmit() {
    if (this.credentials.password !== this.credentials.password_confirmation) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    if (!this.credentials.token || !this.credentials.email) {
      this.errorMessage = 'Invalid password reset link.';
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    this.authService.resetPassword(this.credentials).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message || 'Password has been successfully reset.';
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to reset password. The link might be expired.';
      }
    });
  }
}
