import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LanStatusService } from '../services/lan-status.service';

/**
 * Route guard for guest/public-only routes like /login and /register.
 * If user is already authenticated on Web SaaS, redirects them to their default dashboard.
 * In Desktop POS mode, the login page acts as the terminal screen (device activation & employee PIN selection),
 * so it must never be auto-bypassed.
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const lan = inject(LanStatusService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // In desktop mode, login route must always be accessible
  if (lan.isDesktop()) {
    return true;
  }

  if (authService.isAuthenticated()) {
    router.navigate([authService.getDefaultRoute()]);
    return false;
  }

  return true;
};

