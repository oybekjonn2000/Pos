import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './auth.service';
import { Order } from './order.service';

export interface KitchenStation {
  id: string;
  name: string;
  code: string;
  description?: string;
  sortOrder?: number;
  active: boolean;
  color?: string;
  autoPrint?: boolean;
  soundNotification?: boolean;
  preparationTimeMinutes?: number;
  printerId?: string;
  printerName?: string;
  printerStatus?: string;
  assignedEmployeesCount?: number;
  assignedCategoriesCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateKitchenRequest {
  name: string;
  code?: string;
  description?: string;
  sortOrder?: number;
  active?: boolean;
  color?: string;
  autoPrint?: boolean;
  soundNotification?: boolean;
  preparationTimeMinutes?: number;
  printerId?: string;
  /** Category UUIDs to assign to this kitchen on creation */
  categoryIds?: string[];
}

export interface UpdateKitchenRequest {
  name?: string;
  code?: string;
  description?: string;
  sortOrder?: number;
  active?: boolean;
  color?: string;
  autoPrint?: boolean;
  soundNotification?: boolean;
  preparationTimeMinutes?: number;
  printerId?: string;
  /** Category UUIDs to assign to this kitchen on update (null = no change; [] = remove all) */
  categoryIds?: string[] | null;
}

export interface AssignedEmployee {
  id: string;
  username: string;
  firstName: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  role?: string;
  active?: boolean;
}

export interface AssignedCategory {
  id: string;
  name: string;
  nameUz?: string;
  nameRu?: string;
  active: boolean;
  kitchenId?: string;
  kitchenName?: string;
}

export interface AssignCategoriesRequest {
  categoryIds: string[];
  forceReassign?: boolean;
}

export interface AssignCategoriesResponse {
  assignedCount: number;
  conflictCount: number;
  conflictingCategoryNames: string[];
  message: string;
}

export interface KitchenOrderBatchItem {
  id: string;
  batchId: string;
  orderItemId?: string;
  productId: string;
  productName: string;
  productSku?: string;
  quantity: number;
  unitPrice?: number;
  status: 'NEW' | 'ACCEPTED' | 'COOKING' | 'PREPARING' | 'READY' | 'SERVED' | 'DELIVERED' | 'CANCELLED';
  notes?: string;
  readyAt?: string;
  totalOrderQuantity?: number;
}

export interface KitchenOrderBatch {
  id: string;
  orderId: string;
  orderNumber: string;
  orderType?: string;
  tableId?: string;
  tableNumber?: string;
  tableName?: string;
  waiterName?: string;
  customerName?: string;
  customerPhone?: string;
  kitchenId?: string;
  kitchenName?: string;
  kitchenCode?: string;
  batchNumber: number;
  batchType: 'INITIAL' | 'ADDON';
  status: 'NEW' | 'ACCEPTED' | 'COOKING' | 'PREPARING' | 'READY' | 'SERVED' | 'DELIVERED' | 'CANCELLED';
  notes?: string;
  createdAt?: string;
  sentAt?: string;
  readyAt?: string;
  servedAt?: string;
  cancelledAt?: string;
  items: KitchenOrderBatchItem[];
}

@Injectable({ providedIn: 'root' })
export class KitchenService {
  private readonly API = `${environment.apiUrl}/kitchen`;

  constructor(private http: HttpClient) { }

  getKitchens(search?: string, status?: string, page?: number, size?: number): Observable<ApiResponse<KitchenStation[]>> {
    let params = new HttpParams();
    if (search && search.trim()) params = params.set('search', search.trim());
    if (status && status !== 'ALL') params = params.set('status', status);
    if (page !== undefined && page !== null) params = params.set('page', page.toString());
    if (size !== undefined && size !== null) params = params.set('size', size.toString());
    return this.http.get<ApiResponse<KitchenStation[]>>(`${environment.apiUrl}/kitchens`, { params });
  }

  getActiveKitchens(): Observable<ApiResponse<KitchenStation[]>> {
    return this.http.get<ApiResponse<KitchenStation[]>>(`${environment.apiUrl}/kitchens/active`);
  }

  getKitchenById(id: string): Observable<ApiResponse<KitchenStation>> {
    return this.http.get<ApiResponse<KitchenStation>>(`${environment.apiUrl}/kitchens/${id}`);
  }

  createKitchen(request: CreateKitchenRequest): Observable<ApiResponse<KitchenStation>> {
    return this.http.post<ApiResponse<KitchenStation>>(`${environment.apiUrl}/kitchens`, request);
  }

  updateKitchen(id: string, request: UpdateKitchenRequest): Observable<ApiResponse<KitchenStation>> {
    return this.http.put<ApiResponse<KitchenStation>>(`${environment.apiUrl}/kitchens/${id}`, request);
  }

  toggleKitchenStatus(id: string, active: boolean): Observable<ApiResponse<KitchenStation>> {
    return this.http.patch<ApiResponse<KitchenStation>>(`${environment.apiUrl}/kitchens/${id}/status`, { active });
  }

  getKitchenEmployees(id: string): Observable<ApiResponse<AssignedEmployee[]>> {
    return this.http.get<ApiResponse<AssignedEmployee[]>>(`${environment.apiUrl}/kitchens/${id}/employees`);
  }

  assignKitchenEmployees(id: string, employeeIds: string[]): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${environment.apiUrl}/kitchens/${id}/employees`, { employeeIds });
  }

  detachKitchenEmployee(kitchenId: string, employeeId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${environment.apiUrl}/kitchens/${kitchenId}/employees/${employeeId}`);
  }

  getAvailableCooks(): Observable<ApiResponse<AssignedEmployee[]>> {
    return this.http.get<ApiResponse<AssignedEmployee[]>>(`${environment.apiUrl}/kitchens/available-cooks`);
  }

  transferKitchenEmployee(sourceKitchenId: string, employeeId: string, targetKitchenId: string): Observable<ApiResponse<void>> {
    const params = new HttpParams().set('targetKitchenId', targetKitchenId);
    return this.http.post<ApiResponse<void>>(`${environment.apiUrl}/kitchens/${sourceKitchenId}/employees/${employeeId}/transfer`, null, { params });
  }

  getKitchenCategories(id: string): Observable<ApiResponse<AssignedCategory[]>> {
    return this.http.get<ApiResponse<AssignedCategory[]>>(`${environment.apiUrl}/kitchens/${id}/categories`);
  }

  assignKitchenCategories(id: string, request: AssignCategoriesRequest): Observable<ApiResponse<AssignCategoriesResponse>> {
    return this.http.post<ApiResponse<AssignCategoriesResponse>>(`${environment.apiUrl}/kitchens/${id}/categories`, request);
  }

  /** Fetch ALL non-deleted categories across all kitchens for use in assignment dropdowns */
  getAllCategoriesForAssignment(): Observable<ApiResponse<AssignedCategory[]>> {
    return this.http.get<ApiResponse<AssignedCategory[]>>(`${environment.apiUrl}/categories`);
  }

  getKitchenBatches(kitchenId?: string, includeServed: boolean = true): Observable<ApiResponse<KitchenOrderBatch[]>> {
    let params = new HttpParams().set('includeServed', includeServed.toString());
    if (kitchenId) {
      params = params.set('kitchenId', kitchenId);
    }
    return this.http.get<ApiResponse<KitchenOrderBatch[]>>(`${this.API}/batches`, { params });
  }

  updateBatchStatus(batchId: string, status: string): Observable<ApiResponse<KitchenOrderBatch>> {
    return this.http.put<ApiResponse<KitchenOrderBatch>>(`${this.API}/batches/${batchId}/status`, {}, {
      params: new HttpParams().set('status', status)
    });
  }

  updateBatchItemStatus(itemId: string, status: string): Observable<ApiResponse<KitchenOrderBatchItem>> {
    return this.http.put<ApiResponse<KitchenOrderBatchItem>>(`${this.API}/batches/items/${itemId}/status`, {}, {
      params: new HttpParams().set('status', status)
    });
  }

  updateTableStatus(tableId: string, status: string, kitchenId?: string): Observable<ApiResponse<KitchenOrderBatch[]>> {
    let params = new HttpParams().set('status', status);
    if (kitchenId) {
      params = params.set('kitchenId', kitchenId);
    }
    return this.http.put<ApiResponse<KitchenOrderBatch[]>>(`${this.API}/tables/${tableId}/status`, {}, { params });
  }

  updateOrderBatchesStatus(orderId: string, status: string, kitchenId?: string): Observable<ApiResponse<KitchenOrderBatch[]>> {
    let params = new HttpParams().set('status', status);
    if (kitchenId) {
      params = params.set('kitchenId', kitchenId);
    }
    return this.http.put<ApiResponse<KitchenOrderBatch[]>>(`${this.API}/orders/${orderId}/batches/status`, {}, { params });
  }

  getKitchenOrders(kitchenId?: string): Observable<ApiResponse<Order[]>> {
    let params = new HttpParams();
    if (kitchenId) {
      params = params.set('kitchenId', kitchenId);
    }
    return this.http.get<ApiResponse<Order[]>>(`${this.API}/orders`, { params });
  }

  updateItemStatus(itemId: string, status: 'NEW' | 'ACCEPTED' | 'COOKING' | 'READY' | 'SERVED'): Observable<ApiResponse<void>> {
    const params = new HttpParams().set('status', status);
    return this.http.put<ApiResponse<void>>(`${this.API}/items/${itemId}/status`, null, { params });
  }

  deleteKitchen(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${environment.apiUrl}/kitchens/${id}`);
  }
}

