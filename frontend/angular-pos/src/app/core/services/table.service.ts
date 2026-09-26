import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './auth.service';

export interface RestaurantTable {
  id: string;
  zoneId?: string;
  zoneName?: string;
  zonePercentage?: number;
  tableNumber: string;
  name: string;
  capacity: number;
  shape: string;
  tableType: string;
  posX: number;
  posY: number;
  width: number;
  height: number;
  rotation: number;
  status: 'FREE' | 'OCCUPIED' | 'RESERVED' | 'BILL_REQUESTED' | 'CLEANING';
  currentOrderId?: string;
  activeOrderNumber?: string;
  itemCount?: number;
  totalAmount?: number;
  waiterId?: string;
  waiterName?: string;
  myTable?: boolean;
  active: boolean;
}

export interface TableZone {
  id: string;
  name: string;
  description?: string;
  percentage?: number;
  sortOrder: number;
  active: boolean;
  canvasWidth: number;
  canvasHeight: number;
}

export interface CreateTableRequest {
  zoneId?: string;
  zoneName?: string;
  tableNumber: string;
  name?: string;
  capacity: number;
  shape?: string;
  tableType?: string;
  posX?: number;
  posY?: number;
  width?: number;
  height?: number;
  rotation?: number;
}

export interface UpdateLayoutRequest {
  posX: number;
  posY: number;
  width: number;
  height: number;
  rotation: number;
  tableType?: string;
}

@Injectable({ providedIn: 'root' })
export class TableService {
  private readonly API = `${environment.apiUrl}/tables`;

  constructor(private http: HttpClient) { }

  getTables(zoneId?: string): Observable<ApiResponse<RestaurantTable[]>> {
    let params = new HttpParams();
    if (zoneId) params = params.set('zoneId', zoneId);
    return this.http.get<ApiResponse<RestaurantTable[]>>(this.API, { params });
  }

  getZones(): Observable<ApiResponse<TableZone[]>> {
    return this.http.get<ApiResponse<TableZone[]>>(`${this.API}/zones`);
  }

  createZone(request: { name: string; percentage?: number; description?: string; sortOrder?: number }): Observable<ApiResponse<TableZone>> {
    return this.http.post<ApiResponse<TableZone>>(`${this.API}/zones`, request);
  }

  updateZone(id: string, request: { name: string; percentage?: number; description?: string; sortOrder?: number }): Observable<ApiResponse<TableZone>> {
    return this.http.put<ApiResponse<TableZone>>(`${this.API}/zones/${id}`, request);
  }

  updateZoneCanvas(id: string, canvasWidth: number, canvasHeight: number): Observable<ApiResponse<TableZone>> {
    return this.http.patch<ApiResponse<TableZone>>(`${this.API}/zones/${id}/canvas`, { canvasWidth, canvasHeight });
  }

  deleteZone(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API}/zones/${id}`);
  }

  getTableById(id: string): Observable<ApiResponse<RestaurantTable>> {
    return this.http.get<ApiResponse<RestaurantTable>>(`${this.API}/${id}`);
  }

  getZoneMap(zoneId: string): Observable<ApiResponse<{ place: TableZone; tables: RestaurantTable[] }>> {
    return this.http.get<ApiResponse<{ place: TableZone; tables: RestaurantTable[] }>>(`${this.API}/zones/${zoneId}/map`);
  }

  occupyTable(id: string): Observable<ApiResponse<RestaurantTable>> {
    return this.http.post<ApiResponse<RestaurantTable>>(`${this.API}/${id}/occupy`, {});
  }

  releaseTable(id: string): Observable<ApiResponse<RestaurantTable>> {
    return this.http.post<ApiResponse<RestaurantTable>>(`${this.API}/${id}/release`, {});
  }

  updateTableStatus(id: string, status: string, currentOrderId?: string): Observable<ApiResponse<RestaurantTable>> {
    return this.http.put<ApiResponse<RestaurantTable>>(`${this.API}/${id}/status`, { status, currentOrderId });
  }

  updateTableLayout(id: string, layout: UpdateLayoutRequest): Observable<ApiResponse<RestaurantTable>> {
    return this.http.put<ApiResponse<RestaurantTable>>(`${this.API}/${id}/layout`, layout);
  }

  createTable(request: CreateTableRequest): Observable<ApiResponse<RestaurantTable>> {
    return this.http.post<ApiResponse<RestaurantTable>>(this.API, request);
  }

  updateTable(id: string, request: Partial<CreateTableRequest>): Observable<ApiResponse<RestaurantTable>> {
    return this.http.put<ApiResponse<RestaurantTable>>(`${this.API}/${id}`, request);
  }

  deleteTable(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API}/${id}`);
  }
}
