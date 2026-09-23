import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LanStatusService } from '../services/lan-status.service';

/**
 * Route guard protecting authenticated routes.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const lan = inject(LanStatusService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    if (lan.isClientMode()) {
      const role = (authService.user()?.role || '').toUpperCase();
      if (role !== 'WAITER' && role !== 'KITCHEN') {
        authService.logout();
        router.navigate(['/login']);
        return false;
      }
    }
    return true;
  }

  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
