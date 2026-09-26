import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './auth.service';
import { Employee } from './user.service';

export interface CreateSuperAdminRequest {
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  username?: string;
  password: string;
}

export interface ToggleSuperAdminStatusRequest {
  active: boolean;
}

export interface PlatformStatistics {
  totalRestaurants: number;
  activeRestaurants: number;
  suspendedRestaurants: number;
  inactiveRestaurants: number;
  totalEmployees: number;
  todaySales: number;
  todayOrders: number;
  todayPayments: number;
  periodSales: number;
  periodOrders: number;
  averageCheck: number;
  period: string;
}

export interface PlatformRestaurantSummary {
  id: string;
  name: string;
  code: string;
  phone?: string;
  address?: string;
  inn?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  active: boolean;
  adminName?: string;
  adminUsername?: string;
  employeeCount: number;
  todaySales: number;
  totalSales: number;
  todayOrders: number;
  lastActivity: string;
  createdAt: string;
}

export interface PlatformRestaurantDetail {
  id: string;
  name: string;
  code: string;
  phone?: string;
  address?: string;
  inn?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  active: boolean;
  createdAt: string;
  updatedAt?: string;

  totalEmployees: number;
  employeesByRole: Record<string, number>;

  todaySales: number;
  weekSales: number;
  monthSales: number;
  totalSales: number;

  todayOrders: number;
  totalOrders: number;
  paidOrders: number;
  canceledOrders: number;
  averageCheck: number;

  lastOrderTime?: string;
  lastPaymentTime?: string;
  lastActivityTime?: string;
}

export interface PlatformEmployeeItem {
  id: string;
  username: string;
  fullName: string;
  role: string;
  phone?: string;
  email?: string;
  active: boolean;
  restaurantId?: string;
  restaurantName?: string;
  restaurantCode?: string;
  createdAt: string;
}

export interface PlatformOrderItemMonitoring {
  id: string;
  orderNumber: string;
  tableName: string;
  waiterName: string;
  subtotal: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  itemCount: number;
  openedAt: string;
  closedAt?: string;
  paidAt?: string;
}

export interface RestaurantSalesBreakdown {
  restaurantId: string;
  restaurantName: string;
  restaurantCode: string;
  status: string;
  orderCount: number;
  totalRevenue: number;
  cashRevenue: number;
  cardRevenue: number;
  averageCheck: number;
}

export interface PlatformReportResponse {
  fromDate: string;
  toDate: string;
  totalOrders: number;
  totalVolume: number;
  activeRestaurantsCount: number;
  breakdown: RestaurantSalesBreakdown[];
}

@Injectable({ providedIn: 'root' })
export class PlatformService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/platform`;

  getStatistics(period = 'TODAY'): Observable<ApiResponse<PlatformStatistics>> {
    const params = new HttpParams().set('period', period);
    return this.http.get<ApiResponse<PlatformStatistics>>(`${this.API}/statistics`, { params });
  }

  getRestaurants(): Observable<ApiResponse<PlatformRestaurantSummary[]>> {
    return this.http.get<ApiResponse<PlatformRestaurantSummary[]>>(`${this.API}/restaurants`);
  }

  getRestaurantDetail(id: string): Observable<ApiResponse<PlatformRestaurantDetail>> {
    return this.http.get<ApiResponse<PlatformRestaurantDetail>>(`${this.API}/restaurants/${id}`);
  }

  updateRestaurant(id: string, payload: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API}/restaurants/${id}`, payload);
  }

  updateRestaurantStatus(id: string, status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.API}/restaurants/${id}/status`, { status });
  }

  getRestaurantEmployees(id: string): Observable<ApiResponse<PlatformEmployeeItem[]>> {
    return this.http.get<ApiResponse<PlatformEmployeeItem[]>>(`${this.API}/restaurants/${id}/employees`);
  }

  getAllEmployees(restaurantId?: string, role?: string, active?: boolean): Observable<ApiResponse<PlatformEmployeeItem[]>> {
    let params = new HttpParams();
    if (restaurantId) params = params.set('restaurantId', restaurantId);
    if (role) params = params.set('role', role);
    if (active !== undefined && active !== null) params = params.set('active', active.toString());
    return this.http.get<ApiResponse<PlatformEmployeeItem[]>>(`${this.API}/employees`, { params });
  }

  updateEmployeeStatus(restaurantId: string, userId: string, active: boolean): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.API}/restaurants/${restaurantId}/employees/${userId}/status`, { active });
  }

  getRestaurantOrders(id: string, page = 0, size = 20): Observable<ApiResponse<PlatformOrderItemMonitoring[]>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<ApiResponse<PlatformOrderItemMonitoring[]>>(`${this.API}/restaurants/${id}/orders`, { params });
  }

  getSalesMonitoring(fromDate?: string, toDate?: string, restaurantId?: string): Observable<ApiResponse<RestaurantSalesBreakdown[]>> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    if (restaurantId) params = params.set('restaurantId', restaurantId);
    return this.http.get<ApiResponse<RestaurantSalesBreakdown[]>>(`${this.API}/sales`, { params });
  }

  getReports(fromDate?: string, toDate?: string, status?: string): Observable<ApiResponse<PlatformReportResponse>> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<PlatformReportResponse>>(`${this.API}/reports`, { params });
  }

  getSuperAdmins(): Observable<ApiResponse<Employee[]>> {
    return this.http.get<ApiResponse<Employee[]>>(`${this.API}/superadmins`);
  }

  createSuperAdmin(request: CreateSuperAdminRequest): Observable<ApiResponse<Employee>> {
    return this.http.post<ApiResponse<Employee>>(`${this.API}/superadmins`, request);
  }

  updateSuperAdminStatus(id: string, active: boolean): Observable<ApiResponse<Employee>> {
    return this.http.put<ApiResponse<Employee>>(`${this.API}/superadmins/${id}/status`, { active });
  }
}
