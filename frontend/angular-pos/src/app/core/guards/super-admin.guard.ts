import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

/**
 * Guard protecting routes accessible exclusively by SUPER_ADMIN.
 */
export const superAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const notify = inject(NotificationService);
  const router = inject(Router);

  if (authService.isSuperAdmin()) {
    return true;
  }

  notify.error('Ushbu sahifaga faqat Platforma Super Administratori kira oladi.');
  router.navigate([authService.getDefaultRoute()]);
  return false;
};
