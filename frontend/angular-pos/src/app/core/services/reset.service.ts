import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './auth.service';

export interface OrdersResetResult {
  orders: number;
  orderItems: number;
  payments: number;
  kitchenBatches: number;
  kitchenTickets: number;
  cancellationReceipts: number;
  tablesFreed: number;
}

export interface EntityResetResult {
  entityType: string;
  deletedCount: number;
  message: string;
  details?: Record<string, number>;
}

export interface AllResetResult {
  orders: number;
  orderItems: number;
  payments: number;
  kitchenBatches: number;
  kitchenTickets: number;
  cancellationReceipts: number;
  products: number;
  categories: number;
  kitchens: number;
  tables: number;
  zones: number;
  usersPreserved: number;
  printersPreserved: number;
  rolesPreserved: number;
}

@Injectable({
  providedIn: 'root'
})
export class ResetService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl || 'http://localhost:8080/api'}/settings/reset`;

  resetOrders(): Observable<ApiResponse<OrdersResetResult>> {
    return this.http.post<ApiResponse<OrdersResetResult>>(`${this.baseUrl}/orders`, {});
  }

  resetProducts(): Observable<ApiResponse<EntityResetResult>> {
    return this.http.post<ApiResponse<EntityResetResult>>(`${this.baseUrl}/products`, {});
  }

  resetCategories(): Observable<ApiResponse<EntityResetResult>> {
    return this.http.post<ApiResponse<EntityResetResult>>(`${this.baseUrl}/categories`, {});
  }

  resetKitchens(): Observable<ApiResponse<EntityResetResult>> {
    return this.http.post<ApiResponse<EntityResetResult>>(`${this.baseUrl}/kitchens`, {});
  }

  resetTables(): Observable<ApiResponse<EntityResetResult>> {
    return this.http.post<ApiResponse<EntityResetResult>>(`${this.baseUrl}/tables`, {});
  }

  resetZones(): Observable<ApiResponse<EntityResetResult>> {
    return this.http.post<ApiResponse<EntityResetResult>>(`${this.baseUrl}/zones`, {});
  }

  resetAll(): Observable<ApiResponse<AllResetResult>> {
    return this.http.post<ApiResponse<AllResetResult>>(`${this.baseUrl}/all`, {});
  }
}
