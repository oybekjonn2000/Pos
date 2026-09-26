import {
  Component, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TableService, RestaurantTable, TableZone, CreateTableRequest } from '../core/services/table.service';
import { NotificationService } from '../core/services/notification.service';
import { AuthService } from '../core/services/auth.service';
import { WebsocketService } from '../core/services/websocket.service';
import { AppIconComponent } from '../shared/components/icon/icon.component';
import { TranslatePipe } from '../shared/pipes/translate.pipe';

@Component({
  selector: 'app-tables',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, TranslatePipe],
  styleUrls: ['./tables.component.scss'],
  template: `
    <div class="tables-page fade-in">
      @if (selectedZoneId() === null) {
        <!-- =============================================================== -->
        <!-- 1. INITIAL SCREEN: ZALLAR / JOYLAR RO'YXATI                      -->
        <!-- =============================================================== -->
        <div class="zallar-screen">
          <div class="zallar-header">
            <div class="zallar-title-group">
              <h1 class="page-title">{{ 'tables.title' | translate }}</h1>
              <p class="page-subtitle">Xizmat ko‘rsatish uchun kerakli zalni tanlang</p>
            </div>

            <div class="header-actions">
              <button class="btn btn--secondary" (click)="loadAll()" title="Yangilash">
                <app-icon name="refresh" [size]="16"></app-icon> {{ 'common.refresh' | translate }}
              </button>

              @if (canManageTables()) {
                <button class="btn btn--canvas" (click)="openCanvas()" title="Konstruktor">
                  <app-icon name="layout" [size]="16"></app-icon> {{ 'tables.canvasLayout' | translate }}
                </button>
                <button class="btn btn--secondary" (click)="openAddZoneModal()" title="Yangi joy qo‘shish">
                  <app-icon name="hall" [size]="16"></app-icon> + {{ 'tables.addZone' | translate }}
                </button>
                <button class="btn btn--primary" (click)="openAddModal()" title="Yangi stol qo‘shish">
                  <app-icon name="plus" [size]="16"></app-icon> {{ 'tables.newTable' | translate }}
                </button>
              }
            </div>
          </div>

          <!-- Overall Restaurant Stats Summary -->
          <div class="restaurant-stats-bar">
            <div class="stat-pill stat-pill--total">
              <span class="stat-label">Jami zallar:</span>
              <span class="stat-value">{{ zones().length }}</span>
            </div>
            <div class="stat-pill stat-pill--total">
              <span class="stat-label">{{ 'common.total' | translate }} {{ 'tables.table' | translate }}:</span>
              <span class="stat-value">{{ tables().length }}</span>
            </div>
            <div class="stat-pill stat-pill--free">
              <span class="stat-indicator"></span>
              <span class="stat-label">{{ 'tables.statusAvailable' | translate }}:</span>
              <span class="stat-value">{{ freeCount() }}</span>
            </div>
            <div class="stat-pill stat-pill--occupied">
              <span class="stat-indicator"></span>
              <span class="stat-label">{{ 'tables.statusOccupied' | translate }}:</span>
              <span class="stat-value">{{ occupiedCount() }}</span>
            </div>
          </div>

          <!-- Zallar Cards Grid -->
          @if (loading()) {
            <div class="loading-container">
              <div class="spinner"></div>
              <p>{{ 'common.loading' | translate }}</p>
            </div>
          } @else if (zones().length === 0) {
            <div class="empty-state">
              <div class="empty-icon"><app-icon name="hall" [size]="56"></app-icon></div>
              <h3>Zallar mavjud emas</h3>
              <p>Restoranda hali birorta zal yoki joy yaratilmagan.</p>
              @if (canManageTables()) {
                <button class="btn btn--primary mt-4" (click)="openAddZoneModal()">
                  <app-icon name="plus" [size]="16"></app-icon> Yangi zal yaratish
                </button>
              }
            </div>
          } @else {
            <div class="zallar-grid">
              @for (zone of zones(); track zone.id) {
                <div class="zal-card" (click)="selectZone(zone.id)" role="button" tabindex="0" (keydown.enter)="selectZone(zone.id)">
                  <div class="zal-card__header">
                    <div class="zal-card__icon-wrap">
                      <app-icon [name]="getZoneIcon(zone.name)" [size]="24"></app-icon>
                    </div>
                    @if (zone.percentage && zone.percentage > 0) {
                      <span class="zal-card__pct-badge">+{{ zone.percentage }}% xizmat</span>
                    }
                  </div>

                  <div class="zal-card__body">
                    <h2 class="zal-card__name">{{ zone.name }}</h2>
                    @if (zone.description) {
                      <p class="zal-card__desc">{{ zone.description }}</p>
                    }
                  </div>

                  <div class="zal-card__footer">
                    <div class="zal-card__meta">
                      <span class="zal-meta-item">
                        <strong>{{ countByZone(zone.id) }}</strong> ta stol
                      </span>
                      <span class="zal-meta-dot">•</span>
                      <span class="zal-meta-item zal-meta-item--occupied">
                        <span class="dot dot--danger"></span>
                        <strong>{{ occupiedCountByZone(zone.id) }}</strong> ta band
                      </span>
                      <span class="zal-meta-dot">•</span>
                      <span class="zal-meta-item zal-meta-item--free">
                        <span class="dot dot--success"></span>
                        <strong>{{ freeCountByZone(zone.id) }}</strong> ta bo‘sh
                      </span>
                    </div>

                    <!-- Occupancy Bar -->
                    <div class="zal-occupancy-bar" [title]="getOccupancyRate(zone.id) + '% band'">
                      <div class="zal-occupancy-fill" [style.width.%]="getOccupancyRate(zone.id)"></div>
                    </div>

                    <div class="zal-card__arrow">
                      <span>Xaritani ochish</span>
                      <app-icon name="arrow-right" [size]="14"></app-icon>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      } @else {
        <!-- =============================================================== -->
        <!-- 2. SELECTED ZAL: OPERATIONAL FLOOR MAP CANVAS VIEW              -->
        <!-- =============================================================== -->
        <div class="operational-canvas-screen">
          <!-- Canvas Top Navigation Bar -->
          <div class="canvas-navbar">
            <div class="canvas-navbar__left">
              <button class="btn-back-zallar" (click)="selectZone(null)" title="Zallar ro‘yxatiga qaytish">
                <app-icon name="arrow-left" [size]="18"></app-icon>
                <span>Zallar</span>
              </button>

              <div class="current-zone-badge">
                <div class="zone-icon-chip">
                  <app-icon [name]="getZoneIcon(selectedZone()?.name)" [size]="16"></app-icon>
                </div>
                <div class="zone-title-wrap">
                  <h2 class="current-zone-name">{{ selectedZone()?.name }}</h2>
                  <span class="zone-summary-pill">
                    {{ countByZone(selectedZone()!.id) }} ta stol • 
                    <span class="text-danger">{{ occupiedCountByZone(selectedZone()!.id) }} band</span> • 
                    <span class="text-success">{{ freeCountByZone(selectedZone()!.id) }} bo‘sh</span>
                    @if (selectedZone()?.percentage && selectedZone()!.percentage! > 0) {
                      • <span class="text-amber">+{{ selectedZone()!.percentage }}%</span>
                    }
                  </span>
                </div>
              </div>
            </div>

            <!-- Quick Zone Switcher -->
            <div class="canvas-navbar__center">
              <div class="quick-zone-switcher">
                @for (z of zones(); track z.id) {
                  <button class="quick-zone-tab" [class.active]="z.id === selectedZoneId()" (click)="selectZone(z.id)">
                    <app-icon [name]="getZoneIcon(z.name)" [size]="14"></app-icon>
                    <span>{{ z.name }}</span>
                    <span class="tab-table-count">{{ countByZone(z.id) }}</span>
                  </button>
                }
              </div>
            </div>

            <div class="canvas-navbar__right">
              <!-- View mode toggle: Canvas vs Grid -->
              <div class="view-mode-toggle">
                <button class="btn-mode" [class.active]="viewMode() === 'canvas'" (click)="viewMode.set('canvas')" title="Xarita (Canvas) ko‘rinishi">
                  <app-icon name="layout" [size]="15"></app-icon>
                  <span>Xarita</span>
                </button>
                <button class="btn-mode" [class.active]="viewMode() === 'grid'" (click)="viewMode.set('grid')" title="Ro‘yxat (Kartochkalar) ko‘rinishi">
                  <app-icon name="grid" [size]="15"></app-icon>
                  <span>Ro‘yxat</span>
                </button>
              </div>

              @if (viewMode() === 'canvas') {
                <!-- Zoom Controls -->
                <div class="zoom-controls">
                  <button class="zoom-btn" (click)="zoomOut()" title="Kichiklashtirish (-)">
                    <app-icon name="zoom-out" [size]="15"></app-icon>
                  </button>
                  <button class="zoom-reset-btn" (click)="resetZoom()" title="Haqiqiy o‘lcham (100%)">
                    {{ (zoom() * 100).toFixed(0) }}%
                  </button>
                  <button class="zoom-btn" (click)="zoomIn()" title="Kattalashtirish (+)">
                    <app-icon name="zoom-in" [size]="15"></app-icon>
                  </button>
                  <button class="zoom-btn" (click)="fitToView()" title="Ekranga moslashtirish">
                    <app-icon name="maximize" [size]="15"></app-icon>
                  </button>
                </div>
              }

              @if (canManageTables()) {
                <button class="btn-edit-layout" (click)="openConstructorForZone(selectedZone()!.id)" title="Konstruktorda stollarni joylashtirish va tahrirlash">
                  <app-icon name="edit" [size]="14"></app-icon>
                  <span>Konstruktor</span>
                </button>
              }
            </div>
          </div>

          <!-- Operational Canvas Viewport -->
          @if (viewMode() === 'canvas') {
            <div class="canvas-viewport" #viewport
                 [class.is-panning]="isPanning"
                 (mousedown)="onCanvasMouseDown($event)"
                 (mousemove)="onCanvasMouseMove($event)"
                 (mouseup)="onCanvasMouseUp()"
                 (mouseleave)="onCanvasMouseUp()">

              <div class="canvas-world"
                   [style.width.px]="(selectedZone()?.canvasWidth || 1200) * zoom()"
                   [style.height.px]="(selectedZone()?.canvasHeight || 800) * zoom()"
                   [style.transform]="'translate(' + panX() + 'px, ' + panY() + 'px)'">

                @if (filteredTables().length === 0) {
                  <div class="canvas-empty-state">
                    <app-icon name="tables" [size]="48"></app-icon>
                    <h3>Ushbu zalda stollar mavjud emas</h3>
                    <p>Stollarni joylashtirish uchun konstruktordan foydalaning.</p>
                    @if (canManageTables()) {
                      <button class="btn btn--primary" (click)="openConstructorForZone(selectedZone()!.id)">
                        <app-icon name="layout" [size]="16"></app-icon> Konstruktorni ochish
                      </button>
                    }
                  </div>
                } @else {
                  @for (t of filteredTables(); track t.id) {
                    <div class="canvas-table"
                         [class.canvas-table--free]="t.status === 'FREE'"
                         [class.canvas-table--occupied]="t.status === 'OCCUPIED' && t.myTable !== false"
                         [class.canvas-table--other-waiter]="t.status === 'OCCUPIED' && t.myTable === false"
                         [class.canvas-table--reserved]="t.status === 'RESERVED'"
                         [class.canvas-table--disabled]="!t.active"
                         [class.canvas-table--circle]="t.tableType === 'circle'"
                         [class.canvas-table--booth]="t.tableType === 'booth'"
                         [class.canvas-table--bar]="t.tableType === 'bar'"
                         [class.canvas-table--sofa]="t.tableType === 'sofa'"
                         [style.left.px]="t.posX * zoom()"
                         [style.top.px]="t.posY * zoom()"
                         [style.width.px]="t.width * zoom()"
                         [style.height.px]="t.height * zoom()"
                         [style.transform]="'rotate(' + (t.rotation || 0) + 'deg)'"
                         [style.border-radius]="t.tableType === 'circle' ? '50%' : (t.tableType === 'booth' ? '12px' : '8px')"
                         (click)="onSelectTable(t, $event)"
                         [title]="t.name + ' - ' + (t.status === 'FREE' ? 'BO‘SH' : ('BAND: ' + formatPrice(t.totalAmount || 0)))">

                      <div class="table-card-inner">
                        <!-- Top: Table number / name & badge -->
                        <div class="table-card-top">
                          <span class="table-num-tag">#{{ t.tableNumber }}</span>
                          <span class="table-status-pill"
                                [class.pill--free]="t.status === 'FREE'"
                                [class.pill--occupied]="t.status === 'OCCUPIED' && t.myTable !== false"
                                [class.pill--locked]="t.status === 'OCCUPIED' && t.myTable === false"
                                [class.pill--reserved]="t.status === 'RESERVED'"
                                [class.pill--disabled]="!t.active">
                            @if (t.status === 'FREE') {
                              BO‘SH
                            } @else if (t.status === 'OCCUPIED' && t.myTable === false) {
                              <app-icon name="lock" [size]="9"></app-icon> BAND
                            } @else if (t.status === 'OCCUPIED') {
                              BAND
                            } @else if (t.status === 'RESERVED') {
                              BAND QILINGAN
                            } @else {
                              FAOL EMAS
                            }
                          </span>
                        </div>

                        <div class="table-card-name">{{ t.name }}</div>

                        <!-- Content: Amounts, Products, Waiter or Capacity -->
                        @if (t.status === 'FREE') {
                          <div class="table-free-content">
                            <span class="capacity-hint"><app-icon name="users" [size]="11"></app-icon> {{ t.capacity }} kishilik</span>
                          </div>
                        } @else if (t.status === 'OCCUPIED' && t.myTable === false) {
                          <div class="table-locked-content">
                            <span class="waiter-name-tag"><app-icon name="user" [size]="10"></app-icon> Ofitsant: {{ t.waiterName || 'Ali' }}</span>
                          </div>
                        } @else if (t.status === 'OCCUPIED') {
                          <div class="table-active-content">
                            <div class="table-live-amount">{{ formatPrice(t.totalAmount || 0) }}</div>
                            <div class="table-live-items"><app-icon name="products" [size]="10"></app-icon> {{ t.itemCount || 0 }} ta mahsulot</div>
                            @if (t.waiterName) {
                              <div class="table-live-waiter"><app-icon name="user" [size]="10"></app-icon> Ofitsant: {{ t.waiterName }}</div>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  }
                }
              </div>
            </div>
          } @else {
            <!-- Fallback Grid Mode -->
            <div class="tables-grid">
              @for (table of filteredTables(); track table.id) {
                <div class="table-card" 
                     [class.table-card--free]="table.status === 'FREE'"
                     [class.table-card--occupied]="table.status === 'OCCUPIED' && table.myTable !== false"
                     [class.table-card--other-waiter]="table.status === 'OCCUPIED' && table.myTable === false"
                     (click)="onSelectTable(table, $event)">
                  <div class="table-card__header">
                    <span class="table-card__number">#{{ table.tableNumber }}</span>
                    @if (table.status === 'FREE') {
                      <span class="table-status-badge badge--free">BO‘SH</span>
                    } @else if (table.myTable === false) {
                      <span class="table-status-badge badge--other-waiter"><app-icon name="lock" [size]="12"></app-icon> BAND ({{ table.waiterName || 'Ali' }})</span>
                    } @else {
                      <span class="table-status-badge badge--occupied">BAND</span>
                    }
                  </div>

                  <div class="table-card__body">
                    <div class="table-card__name">{{ table.name }}</div>
                    @if (table.status === 'FREE') {
                      <div class="table-card__capacity">
                        <span><app-icon name="users" [size]="14"></app-icon> {{ table.capacity }} kishilik</span>
                      </div>
                    } @else if (table.myTable === false) {
                      <div class="table-card__other-waiter-info">
                        <span class="other-waiter-badge"><app-icon name="user" [size]="12"></app-icon> Ofitsant: {{ table.waiterName || 'Ali' }}</span>
                      </div>
                    } @else {
                      <div class="table-card__amount">{{ formatPrice(table.totalAmount || 0) }}</div>
                      <div class="table-card__item-count">
                        <app-icon name="products" [size]="14"></app-icon> {{ table.itemCount || 0 }} ta mahsulot
                        @if (table.waiterName) {
                          <span> • Ofitsant: {{ table.waiterName }}</span>
                        }
                      </div>
                    }
                  </div>

                  <div class="table-card__footer">
                    @if (table.status === 'FREE') {
                      <button class="btn btn--primary" style="padding: 6px 12px; font-size: 12.5px;">
                        <app-icon name="plus" [size]="13"></app-icon> Zakaz ochish
                      </button>
                    } @else if (table.myTable === false) {
                      <button class="btn btn--secondary" disabled style="padding: 6px 12px; font-size: 12.5px; opacity: 0.6;">
                        <app-icon name="lock" [size]="13"></app-icon> Biriktirilgan
                      </button>
                    } @else {
                      <button class="btn btn--primary" style="padding: 6px 12px; font-size: 12.5px;">
                        <app-icon name="eye" [size]="13"></app-icon> Buyurtmani ko‘rish
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Add Table Modal -->
      @if (showAddModal() && canManageTables()) {
        <div class="modal-backdrop">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h3 class="modal-title">{{ 'tables.newTable' | translate }}</h3>
                <p class="modal-sub">Stol ma'lumotlari va uning joylashuvini belgilang</p>
              </div>
              <button class="modal-close" (click)="closeModal()"><app-icon name="close" [size]="18"></app-icon></button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Stol Joylashuvi (Zona) *</label>
                <div class="zone-select-row">
                  <select [(ngModel)]="newTable.zoneId" class="pos-input pos-select">
                    <option value="" disabled>-- Joylashuvni tanlang --</option>
                    @for (zone of zones(); track zone.id) {
                      <option [value]="zone.id">{{ zone.name }}</option>
                    }
                  </select>
                  <button type="button" class="btn-add-zone" (click)="toggleCustomZone()">
                    {{ showCustomZone() ? 'Bekor qilish' : '+ Yangi joy' }}
                  </button>
                </div>
                
                @if (showCustomZone()) {
                  <div class="custom-zone-input-wrap">
                    <input type="text" [(ngModel)]="customZoneName" placeholder="Masalan: Ayvon, Podval, Bog'..." class="pos-input" />
                    <button type="button" class="btn btn--primary" (click)="addNewZone()" [disabled]="!customZoneName.trim()">
                      Qo'shish
                    </button>
                  </div>
                }
              </div>

              <div class="form-group">
                <label>Stol Raqami *</label>
                <input type="text" [(ngModel)]="newTable.tableNumber" placeholder="Masalan: 11 yoki K-1, AY-1" class="pos-input" />
              </div>

              <div class="form-group">
                <label>Stol Nomi</label>
                <input type="text" [(ngModel)]="newTable.name" placeholder="Masalan: Stol 11 yoki Ayvon 1" class="pos-input" />
              </div>

              <div class="form-group">
                <label>Sig'imi (Odamlar soni)</label>
                <input type="number" [(ngModel)]="newTable.capacity" min="1" max="50" class="pos-input" />
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn--secondary" (click)="closeModal()">{{ 'common.cancel' | translate }}</button>
              <button class="btn btn--primary" 
                      (click)="saveNewTable()" 
                      [disabled]="!newTable.tableNumber || (!newTable.zoneId && !newTable.zoneName)">
                <app-icon name="save" [size]="16"></app-icon> {{ 'common.save' | translate }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Zone Add/Edit Modal -->
      @if (showZoneModal() && canManageTables()) {
        <div class="modal-backdrop">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h3 class="modal-title">{{ editingZoneId ? 'Joyni tahrirlash' : 'Yangi joy qo‘shish' }}</h3>
                <p class="modal-sub">Zal yoki joylashuv parametrlarini belgilang</p>
              </div>
              <button class="modal-close" (click)="closeZoneModal()"><app-icon name="close" [size]="18"></app-icon></button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label>Joy nomi *</label>
                <input type="text" [(ngModel)]="zoneForm.name" placeholder="Masalan: Asosiy zal, VIP zal, Terassa" class="pos-input" />
              </div>

              <div class="form-group">
                <label>Xizmat haqi foizi (%)</label>
                <input type="number" [(ngModel)]="zoneForm.percentage" min="0" max="100" class="pos-input" />
              </div>

              <div class="form-group">
                <label>Izoh</label>
                <input type="text" [(ngModel)]="zoneForm.description" placeholder="Qisqacha tavsif" class="pos-input" />
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn--secondary" (click)="closeZoneModal()">{{ 'common.cancel' | translate }}</button>
              <button class="btn btn--primary" (click)="saveZone()" [disabled]="!zoneForm.name.trim()">
                <app-icon name="save" [size]="16"></app-icon> {{ 'common.save' | translate }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class TablesComponent implements OnInit, OnDestroy {
  @ViewChild('viewport') viewportEl?: ElementRef<HTMLDivElement>;

  tables = signal<RestaurantTable[]>([]);
  zones = signal<TableZone[]>([]);
  selectedZoneId = signal<string | null>(null);
  viewMode = signal<'canvas' | 'grid'>('canvas');
  loading = signal(true);

  // Canvas Pan & Zoom State
  zoom = signal<number>(1.0);
  panX = signal<number>(0);
  panY = signal<number>(0);
  isPanning = false;
  private panStartX = 0;
  private panStartY = 0;
  private initialPanX = 0;
  private initialPanY = 0;

  // Modals state
  showAddModal = signal(false);
  showCustomZone = signal(false);
  customZoneName = '';
  showZoneModal = signal(false);
  editingZoneId: string | null = null;
  zoneForm = {
    name: '',
    percentage: 5,
    description: ''
  };

  newTable: CreateTableRequest = {
    zoneId: '',
    tableNumber: '',
    name: '',
    capacity: 4
  };

  private wsUnsub?: () => void;

  freeCount = () => this.tables().filter(t => t.status === 'FREE').length;
  occupiedCount = () => this.tables().filter(t => t.status === 'OCCUPIED').length;

  isWaiter = computed(() => this.auth.isWaiter());

  selectedZone = computed(() => {
    const id = this.selectedZoneId();
    if (!id) return null;
    return this.zones().find(z => z.id === id) || null;
  });

  filteredTables = computed(() => {
    const zoneId = this.selectedZoneId();
    if (!zoneId) return this.tables();
    return this.tables().filter(t => t.zoneId === zoneId);
  });

  constructor(
    private tableService: TableService,
    private router: Router,
    private route: ActivatedRoute,
    private notify: NotificationService,
    public auth: AuthService,
    private wsService: WebsocketService
  ) {}

  ngOnInit(): void {
    this.loadAll();
    this.setupWebSocket();

    // Check query params if zoneId was passed (e.g. returning from /pos)
    this.route.queryParams.subscribe(params => {
      if (params['zoneId']) {
        this.selectedZoneId.set(params['zoneId']);
        setTimeout(() => this.fitToView(), 150);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.wsUnsub) {
      this.wsUnsub();
    }
  }

  private setupWebSocket(): void {
    const user = this.auth.user();
    if (user?.tenantId) {
      this.wsUnsub = this.wsService.subscribe<RestaurantTable>(
        `/topic/tables/${user.tenantId}`,
        (updatedTable) => {
          if (updatedTable && updatedTable.id) {
            this.tables.update(list => {
              const idx = list.findIndex(t => t.id === updatedTable.id);
              if (idx >= 0) {
                const next = [...list];
                next[idx] = { ...next[idx], ...updatedTable };
                return next;
              }
              return list;
            });
          }
        }
      );
    }
  }

  formatPrice(val?: number): string {
    if (!val) return '0 so‘m';
    return val.toLocaleString('uz-UZ') + ' so‘m';
  }

  loadAll(): void {
    this.loading.set(true);
    this.loadZones();
    this.loadTables();
  }

  loadZones(): void {
    this.tableService.getZones().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.zones.set(res.data);
        }
      },
      error: () => {}
    });
  }

  loadTables(): void {
    this.tableService.getTables().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.tables.set(res.data);
        }
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('Stollarni yuklashda xatolik yuz berdi');
      }
    });
  }

  selectZone(zoneId: string | null): void {
    this.selectedZoneId.set(zoneId);
    this.panX.set(0);
    this.panY.set(0);
    if (zoneId) {
      if (this.viewportEl) {
        this.fitToView();
      } else {
        setTimeout(() => this.fitToView(), 30);
      }
    }
  }

  countByZone(zoneId: string): number {
    return this.tables().filter(t => t.zoneId === zoneId).length;
  }

  occupiedCountByZone(zoneId: string): number {
    return this.tables().filter(t => t.zoneId === zoneId && t.status === 'OCCUPIED').length;
  }

  freeCountByZone(zoneId: string): number {
    return this.tables().filter(t => t.zoneId === zoneId && t.status === 'FREE').length;
  }

  getOccupancyRate(zoneId: string): number {
    const total = this.countByZone(zoneId);
    if (total === 0) return 0;
    return Math.round((this.occupiedCountByZone(zoneId) / total) * 100);
  }

  getZoneIcon(name?: string): string {
    if (!name) return 'map-pin';
    const n = name.toLowerCase();
    if (n.includes('zal')) return 'hall';
    if (n.includes('ko\'cha') || n.includes('kocha') || n.includes('tashqari')) return 'globe';
    if (n.includes('ayvon') || n.includes('terrasa')) return 'sun';
    if (n.includes('podval') || n.includes('padval') || n.includes('lounge')) return 'products';
    if (n.includes('vip')) return 'crown';
    return 'map-pin';
  }

  canManageTables(): boolean {
    return !this.isWaiter() && this.auth.hasPermission('MANAGE_TABLES');
  }

  openCanvas(): void {
    const zoneId = this.selectedZoneId();
    if (zoneId) {
      this.router.navigate(['/tables/canvas', zoneId]);
    } else {
      this.router.navigate(['/tables/canvas']);
    }
  }

  openConstructorForZone(zoneId: string): void {
    this.router.navigate(['/tables/canvas', zoneId]);
  }

  onSelectTable(table: RestaurantTable, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (table.status === 'OCCUPIED' && table.myTable === false) {
      this.notify.warning("Bu stol boshqa ofitsantga biriktirilgan.");
      return;
    }

    if (table.status === 'FREE') {
      this.router.navigate(['/pos'], {
        queryParams: {
          tableId: table.id,
          zoneId: table.zoneId,
          tableNumber: table.tableNumber,
          tableName: table.name
        }
      });
      return;
    }

    this.router.navigate(['/pos'], {
      queryParams: {
        tableId: table.id,
        zoneId: table.zoneId,
        tableNumber: table.tableNumber,
        tableName: table.name,
        orderId: table.currentOrderId
      }
    });
  }

  // ─── Canvas Pan & Zoom Controls ───────────────────────────────────────────
  zoomIn(): void {
    this.zoom.update(z => Math.min(2.5, +(z + 0.15).toFixed(2)));
  }

  zoomOut(): void {
    this.zoom.update(z => Math.max(0.4, +(z - 0.15).toFixed(2)));
  }

  resetZoom(): void {
    this.zoom.set(1.0);
    this.panX.set(0);
    this.panY.set(0);
  }

  fitToView(): void {
    if (!this.viewportEl) return;
    const vp = this.viewportEl.nativeElement;
    const zone = this.selectedZone();
    const w = zone?.canvasWidth || 1200;
    const h = zone?.canvasHeight || 800;
    const pad = 48;
    const availW = Math.max(100, vp.clientWidth - pad);
    const availH = Math.max(100, vp.clientHeight - pad);
    const scaleX = availW / w;
    const scaleY = availH / h;
    const scale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.2), 1.5);
    this.zoom.set(+scale.toFixed(2));
    this.panX.set(0);
    this.panY.set(0);
  }

  onCanvasMouseDown(event: MouseEvent): void {
    if ((event.target as HTMLElement).closest('.canvas-table')) return;
    this.isPanning = true;
    this.panStartX = event.clientX;
    this.panStartY = event.clientY;
    this.initialPanX = this.panX();
    this.initialPanY = this.panY();
  }

  onCanvasMouseMove(event: MouseEvent): void {
    if (!this.isPanning) return;
    const dx = event.clientX - this.panStartX;
    const dy = event.clientY - this.panStartY;
    this.panX.set(this.initialPanX + dx);
    this.panY.set(this.initialPanY + dy);
  }

  onCanvasMouseUp(): void {
    this.isPanning = false;
  }

  // ─── Modal Management ─────────────────────────────────────────────────────
  openAddModal(): void {
    if (this.isWaiter()) return;
    this.newTable = {
      zoneId: this.selectedZoneId() || (this.zones()[0]?.id || ''),
      tableNumber: '',
      name: '',
      capacity: 4
    };
    this.showCustomZone.set(false);
    this.customZoneName = '';
    this.showAddModal.set(true);
  }

  closeModal(): void {
    this.showAddModal.set(false);
  }

  toggleCustomZone(): void {
    this.showCustomZone.set(!this.showCustomZone());
    if (!this.showCustomZone()) {
      this.customZoneName = '';
    }
  }

  addNewZone(): void {
    if (!this.customZoneName.trim()) return;
    this.tableService.createZone({ name: this.customZoneName.trim() }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.notify.success(`"${res.data.name}" zonasi muvaffaqiyatli yaratildi`);
          this.loadZones();
          this.newTable.zoneId = res.data.id;
          this.showCustomZone.set(false);
          this.customZoneName = '';
        }
      },
      error: (err) => {
        this.notify.error(err.error?.message || "Zonani yaratishda xatolik yuz berdi");
      }
    });
  }

  saveNewTable(): void {
    if (!this.newTable.tableNumber || (!this.newTable.zoneId && !this.newTable.zoneName)) {
      this.notify.warning("Stol raqami va joylashuv zonasi kiritilishi shart!");
      return;
    }

    this.tableService.createTable(this.newTable).subscribe({
      next: (res) => {
        if (res.success) {
          this.notify.success("Stol muvaffaqiyatli qo'shildi");
          this.closeModal();
          this.loadAll();
        }
      },
      error: (err) => {
        this.notify.error(err.error?.message || "Stol qo'shishda xatolik yuz berdi");
      }
    });
  }

  openAddZoneModal(): void {
    this.editingZoneId = null;
    this.zoneForm = { name: '', percentage: 5, description: '' };
    this.showZoneModal.set(true);
  }

  openEditZoneModal(zone: TableZone): void {
    this.editingZoneId = zone.id;
    this.zoneForm = {
      name: zone.name,
      percentage: zone.percentage || 0,
      description: zone.description || ''
    };
    this.showZoneModal.set(true);
  }

  closeZoneModal(): void {
    this.showZoneModal.set(false);
    this.editingZoneId = null;
  }

  saveZone(): void {
    if (!this.zoneForm.name.trim()) return;

    if (this.editingZoneId) {
      this.tableService.updateZone(this.editingZoneId, this.zoneForm).subscribe({
        next: (res) => {
          if (res.success) {
            this.notify.success("Zona muvaffaqiyatli yangilandi");
            this.closeZoneModal();
            this.loadZones();
          }
        },
        error: (err) => {
          this.notify.error(err.error?.message || "Zonani saqlashda xatolik yuz berdi");
        }
      });
    } else {
      this.tableService.createZone(this.zoneForm).subscribe({
        next: (res) => {
          if (res.success) {
            this.notify.success("Zona muvaffaqiyatli yaratildi");
            this.closeZoneModal();
            this.loadZones();
          }
        },
        error: (err) => {
          this.notify.error(err.error?.message || "Zonani yaratishda xatolik yuz berdi");
        }
      });
    }
  }

  deleteCurrentZone(zone: TableZone): void {
    if (!confirm(`"${zone.name}" zonasini va unga tegishli barcha stollarni o‘chirmoqchimisiz?`)) {
      return;
    }

    this.tableService.deleteZone(zone.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.notify.success("Zona muvaffaqiyatli o‘chirildi");
          this.selectedZoneId.set(null);
          this.loadAll();
        }
      },
      error: (err) => {
        this.notify.error(err.error?.message || "Zonani o‘chirishda xatolik yuz berdi");
      }
    });
  }
}
