import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-container">
      <div class="auth-box glassmorphism">
        <h2>Forgot Password</h2>
        <p class="subtitle">Enter your email to receive a password reset link.</p>

        <div *ngIf="successMessage" class="alert alert-success">
          {{ successMessage }}
        </div>
        <div *ngIf="errorMessage" class="alert alert-error">
          {{ errorMessage }}
        </div>

        <form (ngSubmit)="onSubmit()" #forgotForm="ngForm" *ngIf="!successMessage">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" [(ngModel)]="email" required placeholder="you@example.com">
          </div>
          
          <button type="submit" class="btn-primary" [disabled]="!forgotForm.form.valid || isLoading">
            {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
          </button>
        </form>
        
        <div class="auth-links">
          <a routerLink="/admin/login" class="back-link">&larr; Back to Login</a>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email = '';
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private authService: AuthService) {}

  onSubmit() {
    if (!this.email) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message || 'Reset link sent to your email.';
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to send reset link. Please try again.';
      }
    });
  }
}
