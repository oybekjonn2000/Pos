import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './auth.service';

export interface ExcelRowError {
  rowNumber: number;
  field: string;
  message: string;
  rawValue?: string;
}

export interface ExcelImportPreviewResponse<T> {
  totalRows: number;
  validRows: number;
  errorRows: number;
  errors: ExcelRowError[];
  previewData: T[];
}

export interface ExcelImportResultResponse {
  success: boolean;
  totalRows: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: ExcelRowError[];
  message: string;
}

export interface KitchenExcelRow {
  rowNumber: number;
  code: string;
  name: string;
  description: string;
  sortOrder: number;
  active: boolean;
  color: string;
  preparationTimeMinutes: number;
  valid: boolean;
  validationError?: string;
}

export interface CategoryExcelRow {
  rowNumber: number;
  code: string;
  name: string;
  kitchenCode: string;
  kitchenName?: string;
  description: string;
  sortOrder: number;
  active: boolean;
  color: string;
  valid: boolean;
  validationError?: string;
}

export interface ProductExcelRow {
  rowNumber: number;
  sku: string;
  barcode: string;
  name: string;
  categoryCode: string;
  categoryName?: string;
  kitchenCode?: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  trackStock: boolean;
  minStockLevel: number;
  description: string;
  active: boolean;
  valid: boolean;
  validationError?: string;
}

export type ExcelImportType = 'kitchens' | 'categories' | 'products';

@Injectable({ providedIn: 'root' })
export class ExcelService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ==================== KITCHENS ====================

  downloadKitchenTemplate(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/kitchens/excel/template`, { responseType: 'blob' });
  }

  exportKitchens(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/kitchens/excel/export`, { responseType: 'blob' });
  }

  previewKitchens(file: File): Observable<ApiResponse<ExcelImportPreviewResponse<KitchenExcelRow>>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<ExcelImportPreviewResponse<KitchenExcelRow>>>(
      `${this.baseUrl}/kitchens/excel/preview`,
      formData
    );
  }

  importKitchens(file: File): Observable<ApiResponse<ExcelImportResultResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<ExcelImportResultResponse>>(
      `${this.baseUrl}/kitchens/excel/import`,
      formData
    );
  }

  // ==================== CATEGORIES ====================

  downloadCategoryTemplate(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/categories/excel/template`, { responseType: 'blob' });
  }

  exportCategories(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/categories/excel/export`, { responseType: 'blob' });
  }

  previewCategories(file: File): Observable<ApiResponse<ExcelImportPreviewResponse<CategoryExcelRow>>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<ExcelImportPreviewResponse<CategoryExcelRow>>>(
      `${this.baseUrl}/categories/excel/preview`,
      formData
    );
  }

  importCategories(file: File): Observable<ApiResponse<ExcelImportResultResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<ExcelImportResultResponse>>(
      `${this.baseUrl}/categories/excel/import`,
      formData
    );
  }

  // ==================== PRODUCTS ====================

  downloadProductTemplate(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/products/excel/template`, { responseType: 'blob' });
  }

  exportProducts(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/products/excel/export`, { responseType: 'blob' });
  }

  previewProducts(file: File): Observable<ApiResponse<ExcelImportPreviewResponse<ProductExcelRow>>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<ExcelImportPreviewResponse<ProductExcelRow>>>(
      `${this.baseUrl}/products/excel/preview`,
      formData
    );
  }

  importProducts(file: File): Observable<ApiResponse<ExcelImportResultResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<ExcelImportResultResponse>>(
      `${this.baseUrl}/products/excel/import`,
      formData
    );
  }

  // ==================== HELPER ====================

  saveBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
