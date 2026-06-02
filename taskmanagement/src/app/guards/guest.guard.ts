import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const user = authService.currentUser();
    const redirectUrl = user?.role === 'employee' ? '/employee/dashboard' : '/admin/dashboard';
    return router.parseUrl(redirectUrl);
  }

  return true;
};
