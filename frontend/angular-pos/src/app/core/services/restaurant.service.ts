import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './auth.service';

export interface RestaurantItem {
  id: string;
  name: string;
  code: string;
  phone?: string;
  address?: string;
  inn?: string;
  currency?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateRestaurantPayload {
  name: string;
  code: string;
  phone?: string;
  address?: string;
  inn?: string;
  currency?: string;
  status?: string;
}

export interface UpdateRestaurantPayload {
  name: string;
  phone?: string;
  address?: string;
  inn?: string;
  currency?: string;
}

export interface CreateAdminPayload {
  username: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone?: string;
}

export interface RestaurantAdminInfo {
  id: string;
  username: string;
  fullName: string;
  restaurantId: string;
  restaurantCode: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class RestaurantService {
  private readonly API = `${environment.apiUrl}/restaurants`;

  constructor(private http: HttpClient) {}

  getRestaurants(): Observable<ApiResponse<RestaurantItem[]>> {
    return this.http.get<ApiResponse<RestaurantItem[]>>(this.API);
  }

  getRestaurantById(id: string): Observable<ApiResponse<RestaurantItem>> {
    return this.http.get<ApiResponse<RestaurantItem>>(`${this.API}/${id}`);
  }

  createRestaurant(payload: CreateRestaurantPayload): Observable<ApiResponse<RestaurantItem>> {
    return this.http.post<ApiResponse<RestaurantItem>>(this.API, payload);
  }

  updateRestaurant(id: string, payload: UpdateRestaurantPayload): Observable<ApiResponse<RestaurantItem>> {
    return this.http.put<ApiResponse<RestaurantItem>>(`${this.API}/${id}`, payload);
  }

  updateStatus(id: string, status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'): Observable<ApiResponse<RestaurantItem>> {
    return this.http.put<ApiResponse<RestaurantItem>>(`${this.API}/${id}/status`, { status });
  }

  createAdmin(restaurantId: string, payload: CreateAdminPayload): Observable<ApiResponse<RestaurantAdminInfo>> {
    return this.http.post<ApiResponse<RestaurantAdminInfo>>(`${this.API}/${restaurantId}/admins`, payload);
  }
}
