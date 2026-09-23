import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { adminGuard } from './core/guards/admin.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';
import { AuthService } from './core/services/auth.service';
import { LanStatusService } from './core/services/lan-status.service';

export const routes: Routes = [
  // ==========================================
  // PUBLIC ROUTES (NO AUTHENTICATION REQUIRED)
  // ==========================================
  {
    path: '',
    pathMatch: 'full',
    canActivate: [() => {
      const lan = inject(LanStatusService);
      const router = inject(Router);
      if (lan.isDesktop()) {
        router.navigate(['/login']);
        return false;
      }
      return true;
    }],
    loadComponent: () => import('./public/landing/landing.component').then(m => m.LandingComponent),
    title: 'RestaurantPOS - Professional Restaurant Management SaaS'
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
    title: 'Kirish - RestaurantPOS'
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent),
    title: 'Restoran Ochish - RestaurantPOS'
  },
  {
    path: 'pricing',
    canActivate: [() => {
      const lan = inject(LanStatusService);
      const router = inject(Router);
      if (lan.isDesktop()) {
        router.navigate(['/login']);
        return false;
      }
      return true;
    }],
    loadComponent: () => import('./public/pricing/pricing.component').then(m => m.PricingComponent),
    title: 'Tariflar - RestaurantPOS'
  },
  {
    path: 'auth/login',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'auth/register',
    redirectTo: 'register',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'setup',
    loadChildren: () => import('./setup/setup.routes').then(m => m.SETUP_ROUTES)
  },

  // ==========================================
  // PROTECTED APPLICATION SHELL (AUTH REQUIRED)
  // ==========================================
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [

      // ==========================================
      // SUPER_ADMIN PLATFORM MODULES (ISOLATED)
      // ==========================================
      {
        path: 'platform/dashboard',
        loadComponent: () => import('./platform/dashboard/platform-dashboard.component').then(m => m.PlatformDashboardComponent),
        canActivate: [superAdminGuard],
        data: { title: 'Platforma Dashboard' }
      },
      {
        path: 'platform/restaurants',
        loadComponent: () => import('./platform/restaurants/restaurants.component').then(m => m.PlatformRestaurantsComponent),
        canActivate: [superAdminGuard],
        data: { title: 'Restoranlar Tarmog‘i' }
      },
      {
        path: 'platform/restaurants/:id',
        loadComponent: () => import('./platform/restaurants/restaurant-detail/platform-restaurant-detail.component').then(m => m.PlatformRestaurantDetailComponent),
        canActivate: [superAdminGuard],
        data: { title: 'Restoran Monitoringi' }
      },
      {
        path: 'platform/sales',
        loadComponent: () => import('./platform/sales/platform-sales.component').then(m => m.PlatformSalesComponent),
        canActivate: [superAdminGuard],
        data: { title: 'Savdo Monitoringi' }
      },
      {
        path: 'platform/employees',
        loadComponent: () => import('./platform/employees/platform-employees.component').then(m => m.PlatformEmployeesComponent),
        canActivate: [superAdminGuard],
        data: { title: 'Xodimlar Monitoringi' }
      },
      {
        path: 'platform/reports',
        loadComponent: () => import('./platform/reports/platform-reports.component').then(m => m.PlatformReportsComponent),
        canActivate: [superAdminGuard],
        data: { title: 'Platforma Hisobotlari' }
      },
      {
        path: 'platform/subscriptions',
        loadComponent: () => import('./platform/subscriptions/platform-subscriptions.component').then(m => m.PlatformSubscriptionsComponent),
        canActivate: [superAdminGuard],
        data: { title: 'Obunalar Monitoringi' }
      },
      {
        path: 'platform/payments',
        loadComponent: () => import('./platform/payments/platform-payments.component').then(m => m.PlatformPaymentsComponent),
        canActivate: [superAdminGuard],
        data: { title: 'Platforma To‘lovlari' }
      },
      {
        path: 'platform/devices',
        loadComponent: () => import('./platform/devices/platform-devices.component').then(m => m.PlatformDevicesComponent),
        canActivate: [superAdminGuard],
        data: { title: 'Qurilmalar Boshqaruvi' }
      },

      // ==========================================
      // RESTAURANT OPERATIONAL MODULES (POS)
      // ==========================================
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [permissionGuard],
        data: { permission: 'VIEW_DASHBOARD', disallowRoles: ['WAITER'], title: 'Restoran Dashboard' }
      },
      {
        path: 'restaurant/dashboard',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'pos',
        loadComponent: () => import('./orders/pos/pos.component').then(m => m.PosComponent),
        canActivate: [permissionGuard],
        data: { permission: 'CREATE_ORDER', disallowRoles: ['KITCHEN'], title: 'POS Savdo' }
      },
      {
        path: 'tables',
        loadComponent: () => import('./tables/tables.component').then(m => m.TablesComponent),
        canActivate: [permissionGuard],
        data: { disallowRoles: ['KITCHEN'], title: 'Stollar Xaritasi' }
      },
      {
        path: 'waiter',
        redirectTo: 'tables',
        pathMatch: 'full'
      },
      {
        path: 'kitchen',
        loadComponent: () => import('./kitchen/kitchen.component').then(m => m.KitchenComponent),
        canActivate: [permissionGuard],
        data: { permission: 'KITCHEN_VIEW', disallowRoles: ['WAITER'], title: 'Oshxona Ekrani (KDS)' }
      },
      {
        path: 'kitchens',
        loadComponent: () => import('./kitchen/kitchen-management/kitchen-management.component').then(m => m.KitchenManagementComponent),
        canActivate: [permissionGuard],
        data: { permission: 'MANAGE_SETTINGS', disallowRoles: ['KITCHEN', 'WAITER'], title: 'Oshxonalar' }
      },
      {
        path: 'orders',
        loadComponent: () => import('./orders/orders-list/orders-list.component').then(m => m.OrdersListComponent),
        canActivate: [permissionGuard],
        data: { disallowRoles: ['KITCHEN'], title: 'Buyurtmalar' }
      },
      {
        path: 'cashier',
        redirectTo: 'orders',
        pathMatch: 'full'
      },
      {
        path: 'products',
        loadComponent: () => import('./products/products.component').then(m => m.ProductsComponent),
        canActivate: [permissionGuard],
        data: { permission: 'MANAGE_PRODUCTS', disallowRoles: ['WAITER'], title: 'Mahsulotlar' }
      },
      {
        path: 'categories',
        loadComponent: () => import('./categories/categories.component').then(m => m.CategoriesComponent),
        canActivate: [permissionGuard],
        data: { permission: 'MANAGE_CATEGORIES', disallowRoles: ['WAITER'], title: 'Kategoriyalar' }
      },
      {
        path: 'warehouse',
        redirectTo: 'products',
        pathMatch: 'full'
      },
      {
        path: 'inventory',
        redirectTo: 'products',
        pathMatch: 'full'
      },
      {
        path: 'customers',
        loadComponent: () => import('./customers/customers.component').then(m => m.CustomersComponent),
        canActivate: [adminGuard],
        data: { title: 'Mijozlar' }
      },
      {
        path: 'employees',
        loadComponent: () => import('./employees/employees.component').then(m => m.EmployeesComponent),
        canActivate: [permissionGuard],
        data: { permission: 'MANAGE_USERS', disallowRoles: ['WAITER'], title: 'Xodimlar' }
      },
      {
        path: 'reports',
        loadChildren: () => import('./reports/reports.routes').then(m => m.REPORTS_ROUTES),
        canActivate: [permissionGuard],
        data: { permission: 'VIEW_REPORTS', disallowRoles: ['WAITER'], title: 'Hisobotlar' }
      },
      {
        path: 'settings',
        loadChildren: () => import('./settings/settings.routes').then(m => m.SETTINGS_ROUTES),
        canActivate: [permissionGuard],
        data: { permission: 'MANAGE_SETTINGS', disallowRoles: ['WAITER'], title: 'Sozlamalar' }
      },
      {
        path: 'restaurant/billing',
        loadComponent: () => import('./restaurant/billing/restaurant-billing.component').then(m => m.RestaurantBillingComponent),
        canActivate: [adminGuard],
        data: { title: 'Tarif va Billing' }
      },
      {
        path: 'billing',
        redirectTo: 'restaurant/billing',
        pathMatch: 'full'
      },
      {
        path: 'devices',
        loadComponent: () => import('./devices/devices.component').then(m => m.DevicesComponent),
        canActivate: [permissionGuard],
        data: { permission: 'MANAGE_DEVICES', disallowRoles: ['WAITER'], title: 'Qurilmalar' }
      },
      {
        path: 'shifts',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
