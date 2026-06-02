import { Injectable, signal, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000/api'; // Laravel default URL
  public isAuthenticated = signal<boolean>(false);
  public currentUser = signal<any>(null);

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.isAuthenticated.set(this.hasToken());
      const user = sessionStorage.getItem('user');
      if (user) {
        try {
          this.currentUser.set(JSON.parse(user));
        } catch (e) { }
      }
    }
  }

  private hasToken(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!sessionStorage.getItem('auth_token');
    }
    return false;
  }

  login(credentials: { email: string; password: string }, expectedRole?: string) {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (expectedRole && response.user.role !== expectedRole) {
          throw { error: { message: `Access denied. Only ${expectedRole}s can log in here.` } };
        }
        if (response.access_token) {
          if (isPlatformBrowser(this.platformId)) {
            sessionStorage.setItem('auth_token', response.access_token);
            sessionStorage.setItem('user', JSON.stringify(response.user));
          }
          this.isAuthenticated.set(true);
          this.currentUser.set(response.user);
          const redirectUrl = response.user.role === 'employee' ? '/employee/dashboard' : '/admin/dashboard';
          this.router.navigate([redirectUrl]);
        }
      })
    );
  }

  register(userData: { name: string; email: string; password: string }) {
    return this.http.post<any>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        if (response.access_token) {
          if (isPlatformBrowser(this.platformId)) {
            sessionStorage.setItem('auth_token', response.access_token);
            sessionStorage.setItem('user', JSON.stringify(response.user));
          }
          this.isAuthenticated.set(true);
          this.currentUser.set(response.user);
          const redirectUrl = response.user.role === 'employee' ? '/employee/dashboard' : '/admin/dashboard';
          this.router.navigate([redirectUrl]);
        }
      })
    );
  }

  forgotPassword(email: string) {
    return this.http.post<any>(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(data: any) {
    return this.http.post<any>(`${this.apiUrl}/reset-password`, data);
  }

  logout() {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.clearAuth();
      })
    ).subscribe({
      next: () => this.clearAuth(),
      error: () => this.clearAuth()
    });
  }

  private clearAuth() {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user');
    }
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/admin/login']);
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return sessionStorage.getItem('auth_token');
    }
    return null;
  }
}
