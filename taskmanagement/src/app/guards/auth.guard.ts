import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const user = authService.currentUser();
    if (user) {
      if (state.url.startsWith('/admin') && user.role !== 'admin') {
        return router.parseUrl('/employee/dashboard');
      }
      if (state.url.startsWith('/employee') && user.role !== 'employee') {
        return router.parseUrl('/admin/dashboard');
      }
    }
    return true;
  }

  return router.parseUrl('/admin/login');
};
