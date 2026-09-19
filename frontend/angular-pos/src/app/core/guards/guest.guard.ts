import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Route guard for guest/public-only routes like /login and /register.
 * If user is already authenticated, redirects them to their default dashboard.
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    router.navigate([authService.getDefaultRoute()]);
    return false;
  }

  return true;
};
