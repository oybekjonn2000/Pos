import { AppIconComponent } from '../icon/icon.component';
import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/services/auth.service';
import { ExcelService, ExcelImportType, ExcelImportPreviewResponse, ExcelImportResultResponse } from '../../../core/services/excel.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-excel-import-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  template: `
    <div class="modal-overlay" *ngIf="visible" (click)="onBackdropClick()">
      <div class="modal-card excel-modal" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header">
          <div class="header-title-wrap">
            <span class="header-icon"><app-icon [name]="getIcon()" [size]="20"></app-icon></span>
            <div>
              <h2 class="modal-title">{{ getTitle() }}</h2>
              <p class="modal-subtitle">{{ getSubtitle() }}</p>
            </div>
          </div>
          <button class="close-btn" (click)="close()" [disabled]="loading || importing"><app-icon name="x" [size]="18"></app-icon></button>
        </div>

        <!-- Body -->
        <div class="modal-body excel-body">
          <!-- STEP 1: If no file selected yet -->
          <div *ngIf="!selectedFile && !result" class="upload-zone-wrapper">
            <div 
              class="drop-zone" 
              [class.dragover]="isDragging"
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave($event)"
              (drop)="onDrop($event)"
              (click)="fileInput.click()">
              <input 
                #fileInput 
                type="file" 
                accept=".xlsx, .xls" 
                style="display: none" 
                (change)="onFileSelected($event)" 
              />
              <div class="drop-icon"><app-icon name="bar-chart" [size]="32"></app-icon></div>
              <h3 class="drop-title">Excel faylni bu yerga tashlang yoki tanlang</h3>
              <p class="drop-hint">Faqat <strong>.xlsx</strong> yoki <strong>.xls</strong> formatidagi fayllar qabul qilinadi (maks. 10 MB)</p>
              <button type="button" class="pos-btn pos-btn--secondary select-btn">
                <app-icon name="folder" [size]="16"></app-icon> Faylni tanlash
              </button>
            </div>

            <!-- Template Download Hint -->
            <div class="template-box">
              <div class="template-info">
                <strong><app-icon name="info" [size]="16"></app-icon> To'g'ri formatdagi shablon kerakmi?</strong>
                <p>Ushbu bo'lim uchun tayyor Excel shablonini yuklab oling va ma'lumotlarni to'ldiring.</p>
              </div>
              <button type="button" class="pos-btn pos-btn--outline" (click)="downloadTemplate()" [disabled]="downloadingTemplate">
                <span *ngIf="downloadingTemplate">Yuklanmoqda...</span><span *ngIf="!downloadingTemplate"><app-icon name="download" [size]="16"></app-icon> Shablonni Yuklab Olish</span>
              </button>
            </div>
          </div>

          <!-- STEP 2: Loading Preview Spinner -->
          <div *ngIf="loading" class="state-container">
            <div class="pos-spinner"></div>
            <h4 class="state-title">Fayl tahlil qilinmoqda va validatsiya qilinmoqda...</h4>
            <p class="state-desc">Qatorlar, dublikatlar va bazadagi bog'liqliklar tekshirilmoqda.</p>
          </div>

          <!-- STEP 3: Preview Table -->
          <div *ngIf="preview && !loading && !result" class="preview-container">
            <!-- File info bar -->
            <div class="file-info-bar">
              <div class="file-meta">
                <span class="file-icon"><app-icon name="file-text" [size]="16"></app-icon></span>
                <div>
                  <strong class="file-name">{{ selectedFile?.name }}</strong>
                  <span class="file-size">{{ formatFileSize(selectedFile?.size || 0) }}</span>
                </div>
              </div>
              <button type="button" class="pos-btn pos-btn--secondary btn-sm" (click)="resetFile()" [disabled]="importing">
                <app-icon name="refresh" [size]="14"></app-icon> Boshqa fayl tanlash
              </button>
            </div>

            <!-- Stats badges -->
            <div class="stats-grid">
              <div class="stat-badge stat-total">
                <span class="stat-num">{{ preview.totalRows }}</span>
                <span class="stat-lbl">Jami qatorlar</span>
              </div>
              <div class="stat-badge stat-valid">
                <span class="stat-num">{{ preview.validRows }}</span>
                <span class="stat-lbl"><app-icon name="check-circle" [size]="14"></app-icon> Yaroqli (OK)</span>
              </div>
              <div class="stat-badge stat-error" [class.has-error]="preview.errorRows > 0">
                <span class="stat-num">{{ preview.errorRows }}</span>
                <span class="stat-lbl"><app-icon name="alert-triangle" [size]="14"></app-icon> Xatoli (ERROR)</span>
              </div>
            </div>

            <!-- Warning notice if errors exist -->
            <div *ngIf="preview.errorRows > 0" class="alert-box alert-warning">
              <span><app-icon name="alert-triangle" [size]="14"></app-icon> <strong>{{ preview.errorRows }} ta</strong> qatorda xatolik aniqlandi. Xatoli qatorlar o'tkazib yuboriladi yoki tuzatib qayta yuklashingiz mumkin.</span>
            </div>

            <!-- Table of preview items -->
            <div class="table-scroll-wrap">
              <table class="preview-table">
                <thead>
                  <tr>
                    <th style="width: 50px;">#</th>
                    <th style="width: 90px;">Holat</th>
                    <th>Identifikator</th>
                    <th>Nomi</th>
                    <th>Bog'liqlik</th>
                    <th>Xatolik / Izoh</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of preview.previewData" [class.row-error]="!item.valid">
                    <td class="cell-num">{{ item.rowNumber }}</td>
                    <td>
                      <span class="status-pill" [class.pill-ok]="item.valid" [class.pill-err]="!item.valid">
                        {{ item.valid ? 'OK' : 'XATO' }}
                      </span>
                    </td>
                    <td>
                      <code>{{ getItemCode(item) }}</code>
                    </td>
                    <td><strong>{{ item.name || '—' }}</strong></td>
                    <td>
                      <span class="relation-tag" *ngIf="getItemRelation(item)">
                        {{ getItemRelation(item) }}
                      </span>
                      <span *ngIf="!getItemRelation(item)" class="text-muted">—</span>
                    </td>
                    <td>
                      <span *ngIf="!item.valid" class="error-text">
                        {{ item.validationError }}
                      </span>
                      <span *ngIf="item.valid" class="success-text">
                        Tayyor
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- STEP 4: Importing In-Progress -->
          <div *ngIf="importing" class="state-container">
            <div class="pos-spinner spinner-primary"></div>
            <h4 class="state-title">Ma'lumotlar bazaga import qilinmoqda...</h4>
            <p class="state-desc">Iltimos kuting, operatsiya xavfsiz transaction rejimida bajarilmoqda.</p>
          </div>

          <!-- STEP 5: Import Result Screen -->
          <div *ngIf="result" class="result-container">
            <div class="result-header" [class.result-success]="result.success">
              <span class="result-icon"><app-icon [name]="result.success ? 'check-circle' : 'alert-triangle'" [size]="32"></app-icon></span>
              <h3 class="result-title">{{ result.message }}</h3>
            </div>

            <div class="result-stats">
              <div class="res-stat-card">
                <span class="res-stat-val">{{ result.totalRows }}</span>
                <span class="res-stat-lbl">Jami</span>
              </div>
              <div class="res-stat-card res-green">
                <span class="res-stat-val">+{{ result.createdCount }}</span>
                <span class="res-stat-lbl">Yaratildi</span>
              </div>
              <div class="res-stat-card res-blue">
                <span class="res-stat-val">↻{{ result.updatedCount }}</span>
                <span class="res-stat-lbl">Yangilandi</span>
              </div>
              <div class="res-stat-card res-amber">
                <span class="res-stat-val">{{ result.errorCount }}</span>
                <span class="res-stat-lbl">O'tkazib yuborildi</span>
              </div>
            </div>

            <!-- Error list if any -->
            <div *ngIf="result.errors && result.errors.length > 0" class="result-errors-list">
              <h5 class="errors-heading">Xatoliklar tafsiloti:</h5>
              <div class="error-item" *ngFor="let err of result.errors">
                <span class="err-row-badge">{{ err.rowNumber }}-qator:</span>
                <span class="err-msg">{{ err.message }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button 
            type="button" 
            class="pos-btn pos-btn--secondary" 
            (click)="close()" 
            [disabled]="importing">
            {{ result ? 'Yopish' : 'Bekor qilish' }}
          </button>

          <button 
            *ngIf="preview && !result && !loading"
            type="button" 
            class="pos-btn pos-btn--primary" 
            (click)="executeImport()" 
            [disabled]="importing || preview.validRows === 0">
            <span *ngIf="!importing"><app-icon name="upload" [size]="16"></app-icon> {{ preview.validRows }} ta qatorni import qilish</span>
            <span *ngIf="importing">Yuklanmoqda...</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(6px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      animation: fadeIn 0.15s ease-out;
    }

    .modal-card.excel-modal {
      background: var(--bg-card, #1e293b);
      border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
      border-radius: 14px;
      width: 100%;
      max-width: 820px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      color: var(--text-primary, #f8fafc);
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border, rgba(255, 255, 255, 0.08));
      background: rgba(0, 0, 0, 0.15);
    }

    .header-title-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-icon {
      font-size: 28px;
    }

    .modal-title {
      font-size: 18px;
      font-weight: 700;
      margin: 0;
      color: var(--text-primary, #f8fafc);
    }

    .modal-subtitle {
      font-size: 13px;
      color: var(--text-secondary, #94a3b8);
      margin: 2px 0 0 0;
    }

    .close-btn {
      background: transparent;
      border: none;
      font-size: 20px;
      color: var(--text-secondary, #94a3b8);
      cursor: pointer;
      padding: 6px 10px;
      border-radius: 6px;
      transition: all 0.15s;
    }

    .close-btn:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .modal-body.excel-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 14px 20px;
      border-top: 1px solid var(--border, rgba(255, 255, 255, 0.08));
      background: rgba(0, 0, 0, 0.15);
    }

    /* Drop Zone */
    .drop-zone {
      border: 2px dashed var(--border, rgba(255, 255, 255, 0.2));
      border-radius: 12px;
      padding: 36px 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      background: rgba(255, 255, 255, 0.02);
    }

    .drop-zone:hover, .drop-zone.dragover {
      border-color: #6366f1;
      background: rgba(99, 102, 241, 0.06);
    }

    .drop-icon {
      font-size: 44px;
      margin-bottom: 8px;
    }

    .drop-title {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 4px 0;
    }

    .drop-hint {
      font-size: 13px;
      color: var(--text-secondary, #94a3b8);
      margin: 0 0 16px 0;
    }

    .select-btn {
      pointer-events: none;
    }

    /* Template Box */
    .template-box {
      margin-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.25);
      border-radius: 10px;
      padding: 14px 18px;
      gap: 14px;
      flex-wrap: wrap;
    }

    .template-info strong {
      display: block;
      font-size: 14px;
      color: #818cf8;
      margin-bottom: 2px;
    }

    .template-info p {
      margin: 0;
      font-size: 12px;
      color: var(--text-secondary, #94a3b8);
    }

    /* States */
    .state-container {
      padding: 40px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .pos-spinner {
      width: 44px;
      height: 44px;
      border: 4px solid rgba(255, 255, 255, 0.1);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 16px;
    }

    .spinner-primary {
      border-top-color: #10b981;
    }

    .state-title {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 6px 0;
    }

    .state-desc {
      font-size: 13px;
      color: var(--text-secondary, #94a3b8);
      margin: 0;
    }

    /* Preview Details */
    .file-info-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.04);
      border-radius: 8px;
      padding: 10px 14px;
      border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
    }

    .file-meta {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .file-icon {
      font-size: 22px;
    }

    .file-name {
      display: block;
      font-size: 14px;
    }

    .file-size {
      font-size: 12px;
      color: var(--text-secondary, #94a3b8);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin: 12px 0;
    }

    .stat-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(255, 255, 255, 0.03);
    }

    .stat-num {
      font-size: 20px;
      font-weight: 700;
    }

    .stat-lbl {
      font-size: 12px;
      color: var(--text-secondary, #94a3b8);
    }

    .stat-valid .stat-num { color: #10b981; }
    .stat-error.has-error { border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.06); }
    .stat-error.has-error .stat-num { color: #ef4444; }

    .alert-box {
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
    }

    .alert-warning {
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #fbbf24;
    }

    /* Table */
    .table-scroll-wrap {
      max-height: 280px;
      overflow-y: auto;
      border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
      border-radius: 8px;
    }

    .preview-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .preview-table th {
      position: sticky;
      top: 0;
      background: #1e293b;
      padding: 8px 12px;
      text-align: left;
      font-weight: 600;
      color: var(--text-secondary, #94a3b8);
      border-bottom: 1px solid var(--border, rgba(255, 255, 255, 0.1));
      z-index: 1;
    }

    .preview-table td {
      padding: 8px 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }

    .preview-table tr.row-error {
      background: rgba(239, 68, 68, 0.06);
    }

    .status-pill {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
    }

    .pill-ok {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
    }

    .pill-err {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
    }

    .relation-tag {
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
    }

    .error-text {
      color: #f87171;
      font-size: 12px;
    }

    .success-text {
      color: #34d399;
      font-size: 12px;
    }

    /* Results */
    .result-container {
      padding: 20px 0;
    }

    .result-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .result-icon {
      font-size: 48px;
      display: block;
      margin-bottom: 8px;
    }

    .result-title {
      font-size: 18px;
      font-weight: 700;
      margin: 0;
    }

    .result-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .res-stat-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 12px;
      text-align: center;
    }

    .res-stat-val {
      font-size: 22px;
      font-weight: 700;
      display: block;
    }

    .res-stat-lbl {
      font-size: 12px;
      color: var(--text-secondary, #94a3b8);
    }

    .res-green .res-stat-val { color: #10b981; }
    .res-blue .res-stat-val { color: #38bdf8; }
    .res-amber .res-stat-val { color: #fbbf24; }

    .result-errors-list {
      max-height: 180px;
      overflow-y: auto;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      padding: 12px;
    }

    .errors-heading {
      margin: 0 0 8px 0;
      font-size: 13px;
      color: #f87171;
    }

    .error-item {
      font-size: 12px;
      margin-bottom: 4px;
    }

    .err-row-badge {
      color: #fbbf24;
      font-weight: 600;
      margin-right: 6px;
    }

    .btn-sm {
      padding: 4px 10px;
      font-size: 12px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* ============================================================
     * RESPONSIVE BREAKPOINTS (Mobile & Tablet)
     * ============================================================ */
    @media (max-width: 767px) {
      .modal-card.excel-modal {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        border-radius: 20px 20px 0 0 !important;
        max-height: 92vh !important;
      }

      .modal-header {
        padding: 14px 16px;
      }

      .modal-body.excel-body {
        padding: 14px;
      }

      .drop-zone {
        padding: 24px 14px;

        .drop-icon {
          font-size: 36px;
        }

        .drop-title {
          font-size: 15px;
        }

        .drop-hint {
          font-size: 11.5px;
        }
      }

      .template-box {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;

        .pos-btn {
          width: 100%;
          justify-content: center;
          min-height: 42px;
        }
      }

      .file-info-bar {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;

        .pos-btn {
          width: 100%;
          justify-content: center;
          min-height: 40px;
        }
      }

      .stats-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;

        .stat-badge {
          padding: 8px 6px;
        }

        .stat-num {
          font-size: 16px;
        }

        .stat-lbl {
          font-size: 10.5px;
        }
      }

      .result-stats {
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }

      .result-errors-list {
        max-height: 220px;

        .error-item {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 6px;
          padding: 8px 10px;
          margin-bottom: 6px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
      }

      .modal-footer {
        flex-direction: column;
        width: 100%;
        padding: 12px 16px;
        gap: 8px;

        .pos-btn {
          width: 100%;
          min-height: 44px;
          justify-content: center;
        }
      }
    }
  `]
})
export class ExcelImportModalComponent implements OnInit {
  @Input() type: ExcelImportType = 'products';
  @Input() visible: boolean = false;
  @Output() closed = new EventEmitter<void>();
  @Output() imported = new EventEmitter<void>();

  isDragging = false;
  selectedFile: File | null = null;
  loading = false;
  importing = false;
  downloadingTemplate = false;

  preview: ExcelImportPreviewResponse<any> | null = null;
  result: ExcelImportResultResponse | null = null;

  constructor(
    private excelService: ExcelService,
    private notify: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  getIcon(): string {
    switch (this.type) {
      case 'kitchens': return 'utensils';
      case 'categories': return 'tag';
      case 'products': return 'package';
    }
  }

  getTitle(): string {
    switch (this.type) {
      case 'kitchens': return 'Oshxonalarni Excel orqali import qilish';
      case 'categories': return 'Kategoriyalarni Excel orqali import qilish';
      case 'products': return 'Mahsulotlarni Excel orqali import qilish';
    }
  }

  getSubtitle(): string {
    switch (this.type) {
      case 'kitchens': return 'Oshxonalar (stansiyalar) ro\'yxatini .xlsx fayldan ommaviy yuklash';
      case 'categories': return 'Kategoriyalarni tegishli oshxona kodi bilan ommaviy yuklash';
      case 'products': return 'Mahsulotlarni tegishli kategoriya kodi bilan ommaviy yuklash';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: any): void {
    const files = event.target?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  handleFile(file: File): void {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      this.notify.error('Faqat .xlsx yoki .xls formatidagi Excel fayllari qabul qilinadi');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.notify.error('Fayl hajmi 10 MB dan oshmasligi kerak');
      return;
    }

    this.selectedFile = file;
    this.loadPreview(file);
  }

  loadPreview(file: File): void {
    this.loading = true;
    this.preview = null;
    this.result = null;

    let previewObs: Observable<ApiResponse<ExcelImportPreviewResponse<any>>>;
    switch (this.type) {
      case 'kitchens': previewObs = this.excelService.previewKitchens(file); break;
      case 'categories': previewObs = this.excelService.previewCategories(file); break;
      case 'products': previewObs = this.excelService.previewProducts(file); break;
    }

    previewObs.subscribe({
      next: (res: ApiResponse<ExcelImportPreviewResponse<any>>) => {
        this.loading = false;
        if (res.success && res.data) {
          this.preview = res.data;
        } else {
          this.notify.error(res.message || 'Excel faylni tahlil qilishda xatolik yuz berdi');
          this.resetFile();
        }
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.loading = false;
        const msg = err.error?.message || 'Excel faylini o\'qishda xatolik yuz berdi';
        this.notify.error(msg);
        this.resetFile();
        this.cdr.markForCheck();
      }
    });
  }

  executeImport(): void {
    if (!this.selectedFile || !this.preview || this.preview.validRows === 0) return;
    this.importing = true;

    let importObs: Observable<ApiResponse<ExcelImportResultResponse>>;
    switch (this.type) {
      case 'kitchens': importObs = this.excelService.importKitchens(this.selectedFile); break;
      case 'categories': importObs = this.excelService.importCategories(this.selectedFile); break;
      case 'products': importObs = this.excelService.importProducts(this.selectedFile); break;
    }

    importObs.subscribe({
      next: (res: ApiResponse<ExcelImportResultResponse>) => {
        this.importing = false;
        if (res.success && res.data) {
          this.result = res.data;
          this.notify.success(res.message || 'Import muvaffaqiyatli bajarildi');
          this.imported.emit();
        } else {
          this.notify.error(res.message || 'Import bajarilmadi');
        }
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.importing = false;
        const msg = err.error?.message || 'Import jarayonida xatolik yuz berdi';
        this.notify.error(msg);
        this.cdr.markForCheck();
      }
    });
  }

  downloadTemplate(): void {
    this.downloadingTemplate = true;
    let templateObs;
    let filename = '';
    switch (this.type) {
      case 'kitchens':
        templateObs = this.excelService.downloadKitchenTemplate();
        filename = 'kitchens_template.xlsx';
        break;
      case 'categories':
        templateObs = this.excelService.downloadCategoryTemplate();
        filename = 'categories_template.xlsx';
        break;
      case 'products':
        templateObs = this.excelService.downloadProductTemplate();
        filename = 'products_template.xlsx';
        break;
    }

    templateObs.subscribe({
      next: (blob) => {
        this.downloadingTemplate = false;
        this.excelService.saveBlob(blob, filename);
        this.notify.success('Shablon yuklab olindi');
        this.cdr.markForCheck();
      },
      error: () => {
        this.downloadingTemplate = false;
        this.notify.error('Shablonni yuklab olishda xatolik');
        this.cdr.markForCheck();
      }
    });
  }

  resetFile(): void {
    this.selectedFile = null;
    this.preview = null;
    this.result = null;
  }

  close(): void {
    if (this.importing) return;
    this.resetFile();
    this.closed.emit();
  }

  onBackdropClick(): void {
    if (!this.importing) {
      this.close();
    }
  }

  getItemCode(item: any): string {
    return item.code || item.sku || '—';
  }

  getItemRelation(item: any): string {
    if (this.type === 'categories') {
      return item.kitchenName ? `Oshxona: ${item.kitchenName} (${item.kitchenCode})` : (item.kitchenCode ? `Oshxona: ${item.kitchenCode}` : '');
    }
    if (this.type === 'products') {
      return item.categoryName ? `Kategoriya: ${item.categoryName}` : (item.categoryCode ? `Kategoriya: ${item.categoryCode}` : '');
    }
    return '';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
