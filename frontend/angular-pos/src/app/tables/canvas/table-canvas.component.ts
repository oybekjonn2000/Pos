import {
  Component, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef,
  HostListener, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TableService, RestaurantTable, TableZone, CreateTableRequest, UpdateLayoutRequest } from '../../core/services/table.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { AppIconComponent } from '../../shared/components/icon/icon.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { Subject, forkJoin, debounceTime, takeUntil } from 'rxjs';

// ─── Types ────────────────────────────────────────────────────────────────────
export type TableShape = 'rectangle' | 'circle' | 'booth' | 'bar' | 'sofa';

interface CanvasTable extends RestaurantTable {
  // local draft state (not yet saved)
  _dirty?: boolean;
  _selected?: boolean;
}

interface DragState {
  active: boolean;
  tableId: string | null;
  startMouseX: number;
  startMouseY: number;
  startTableX: number;
  startTableY: number;
}

interface ResizeState {
  active: boolean;
  tableId: string | null;
  handle: string;
  startMouseX: number;
  startMouseY: number;
  startWidth: number;
  startHeight: number;
  startX: number;
  startY: number;
}

const TABLE_PRESETS: { type: TableShape; labelKey: string; icon: string; defaultW: number; defaultH: number; capacity: number }[] = [
  { type: 'rectangle', labelKey: 'canvas.shapeRect',   icon: 'square',     defaultW: 100, defaultH: 80,  capacity: 4 },
  { type: 'circle',    labelKey: 'canvas.shapeCircle', icon: 'circle',     defaultW: 90,  defaultH: 90,  capacity: 4 },
  { type: 'booth',     labelKey: 'canvas.shapeBooth',  icon: 'armchair',   defaultW: 140, defaultH: 80,  capacity: 6 },
  { type: 'bar',       labelKey: 'canvas.shapeBar',    icon: 'bar-chart-2',defaultW: 180, defaultH: 50,  capacity: 8 },
  { type: 'sofa',      labelKey: 'canvas.shapeSofa',   icon: 'couch',      defaultW: 160, defaultH: 70,  capacity: 6 },
];

const SNAP_GRID = 10;
const MIN_W = 50;
const MIN_H = 40;

@Component({
  selector: 'app-table-canvas',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, TranslatePipe],
  template: `
<div class="canvas-constructor">

  <!-- ══ TOP BAR ══════════════════════════════════════════════════════════ -->
  <div class="canvas-topbar">
    <div class="canvas-topbar__left">
      <button class="topbar-back" (click)="goBack()" title="Orqaga">
        <app-icon name="arrow-left" [size]="18"></app-icon>
      </button>
      <div class="topbar-zone-info">
        <span class="zone-label">{{ 'canvas.floorPlan' | translate }}</span>
        <span class="zone-name">{{ zone()?.name || '...' }}</span>
      </div>
    </div>

    <div class="canvas-topbar__center">
      <!-- Zone selector tabs -->
      <div class="zone-switcher">
        @for (z of zones(); track z.id) {
          <button class="zone-btn" [class.active]="z.id === zoneId()" (click)="switchZone(z.id)">
            {{ z.name }}
          </button>
        }
      </div>
    </div>

    <div class="canvas-topbar__right">
      <div class="topbar-tools">
        <button class="tool-btn" [class.active]="showGrid()" (click)="showGrid.set(!showGrid())" title="{{ 'canvas.grid' | translate }}">
          <app-icon name="grid" [size]="16"></app-icon>
        </button>
        <button class="tool-btn" (click)="fitToView()" title="{{ 'canvas.fitView' | translate }}">
          <app-icon name="maximize" [size]="16"></app-icon>
        </button>
        <button class="tool-btn" (click)="zoomIn()" title="Zoom +">
          <app-icon name="zoom-in" [size]="16"></app-icon>
        </button>
        <span class="zoom-label">{{ (zoom() * 100).toFixed(0) }}%</span>
        <button class="tool-btn" (click)="zoomOut()" title="Zoom -">
          <app-icon name="zoom-out" [size]="16"></app-icon>
        </button>
      </div>

      <div class="topbar-actions">
        <button class="btn-canvas btn-canvas--secondary" (click)="discardChanges()" [disabled]="!hasDirty()">
          <app-icon name="x" [size]="14"></app-icon> {{ 'common.cancel' | translate }}
        </button>
        <button class="btn-canvas btn-canvas--primary" (click)="saveAll()" [disabled]="saving() || !hasDirty()">
          @if (saving()) {
            <span class="spinner-sm"></span>
          } @else {
            <app-icon name="save" [size]="14"></app-icon>
          }
          {{ 'common.save' | translate }}
        </button>
      </div>
    </div>
  </div>

  <!-- ══ MAIN LAYOUT ═══════════════════════════════════════════════════════ -->
  <div class="canvas-layout">

    <!-- LEFT PANEL: Table library -->
    <div class="canvas-sidebar">
      <div class="sidebar-section">
        <div class="sidebar-title">{{ 'canvas.addTable' | translate }}</div>
        <div class="shape-library">
          @for (preset of presets; track preset.type) {
            <div class="shape-item" draggable="true"
                 (dragstart)="onLibraryDragStart($event, preset)"
                 (click)="quickAddTable(preset)">
              <div class="shape-preview shape-preview--{{ preset.type }}">
                <app-icon [name]="preset.icon" [size]="20"></app-icon>
              </div>
              <span class="shape-label">{{ preset.labelKey | translate }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Selected table properties panel -->
      @if (selectedTable()) {
        <div class="sidebar-section props-panel">
          <div class="sidebar-title">
            {{ 'canvas.tableProps' | translate }}
            <button class="props-close" (click)="deselectTable()">
              <app-icon name="x" [size]="14"></app-icon>
            </button>
          </div>

          <div class="prop-group">
            <label>{{ 'tables.tableNumber' | translate }}</label>
            <input type="text" class="prop-input" [(ngModel)]="editForm.tableNumber" (change)="markDirty(selectedTable()!)"/>
          </div>
          <div class="prop-group">
            <label>{{ 'tables.tableName' | translate }}</label>
            <input type="text" class="prop-input" [(ngModel)]="editForm.name" (change)="markDirty(selectedTable()!)"/>
          </div>
          <div class="prop-group">
            <label>{{ 'tables.capacity' | translate }}</label>
            <input type="number" class="prop-input" [(ngModel)]="editForm.capacity" min="1" max="50" (change)="markDirty(selectedTable()!)"/>
          </div>
          <div class="prop-group">
            <label>{{ 'canvas.shape' | translate }}</label>
            <select class="prop-input" [(ngModel)]="editForm.tableType" (change)="applyTableType()">
              @for (p of presets; track p.type) {
                <option [value]="p.type">{{ p.labelKey | translate }}</option>
              }
            </select>
          </div>

          <div class="prop-group prop-group--row">
            <div class="prop-col">
              <label>X</label>
              <input type="number" class="prop-input" [(ngModel)]="editForm.posX" (change)="applyPosition()"/>
            </div>
            <div class="prop-col">
              <label>Y</label>
              <input type="number" class="prop-input" [(ngModel)]="editForm.posY" (change)="applyPosition()"/>
            </div>
          </div>
          <div class="prop-group prop-group--row">
            <div class="prop-col">
              <label>W</label>
              <input type="number" class="prop-input" [(ngModel)]="editForm.width" (change)="applySize()"/>
            </div>
            <div class="prop-col">
              <label>H</label>
              <input type="number" class="prop-input" [(ngModel)]="editForm.height" (change)="applySize()"/>
            </div>
          </div>

          <div class="prop-group">
            <label>{{ 'canvas.rotation' | translate }}</label>
            <div class="rotation-control">
              @for (deg of rotationOptions; track deg) {
                <button class="rot-btn" [class.active]="editForm.rotation === deg" (click)="applyRotation(deg)">
                  {{ deg }}°
                </button>
              }
            </div>
          </div>

          <button class="btn-delete-table" (click)="confirmDeleteTable(selectedTable()!)">
            <app-icon name="trash" [size]="14"></app-icon> {{ 'common.delete' | translate }}
          </button>
        </div>
      }

      <!-- Canvas size panel -->
      <div class="sidebar-section">
        <div class="sidebar-title">{{ 'canvas.canvasSize' | translate }}</div>
        <div class="prop-group prop-group--row">
          <div class="prop-col">
            <label>{{ 'canvas.width' | translate }}</label>
            <input type="number" class="prop-input" [(ngModel)]="canvasForm.width" min="800" step="100"/>
          </div>
          <div class="prop-col">
            <label>{{ 'canvas.height' | translate }}</label>
            <input type="number" class="prop-input" [(ngModel)]="canvasForm.height" min="600" step="100"/>
          </div>
        </div>
        <button class="btn-canvas btn-canvas--secondary btn-full" (click)="applyCanvasSize()">
          {{ 'canvas.applySize' | translate }}
        </button>
      </div>
    </div>

    <!-- CENTER: Canvas -->
    <div class="canvas-viewport" #viewport
         (scroll)="onViewportScroll()"
         (wheel)="onViewportWheel($event)"
         (drop)="onCanvasDrop($event)"
         (dragover)="$event.preventDefault()">

      <div class="canvas-world" #canvasEl
           [style.width.px]="canvasW() * zoom()"
           [style.height.px]="canvasH() * zoom()"
           [style.background-size]="showGrid() ? (SNAP_GRID * zoom()) + 'px ' + (SNAP_GRID * zoom()) + 'px' : 'none'"
           [class.grid-on]="showGrid()"
           (mousedown)="onCanvasMouseDown($event)"
           (mousemove)="onMouseMove($event)"
           (mouseup)="onMouseUp($event)"
           (mouseleave)="onMouseUp($event)">

        <!-- Render all tables -->
        @for (t of tables(); track t.id) {
          <div class="canvas-table"
               [class.canvas-table--selected]="t._selected"
               [class.canvas-table--dirty]="t._dirty"
               [class.canvas-table--occupied]="t.status !== 'FREE'"
               [class.canvas-table--{{ t.tableType || 'rectangle' }}]="true"
               [style.left.px]="t.posX * zoom()"
               [style.top.px]="t.posY * zoom()"
               [style.width.px]="t.width * zoom()"
               [style.height.px]="t.height * zoom()"
               [style.transform]="'rotate(' + (t.rotation || 0) + 'deg)'"
               [style.border-radius]="t.tableType === 'circle' ? '50%' : (t.tableType === 'booth' ? '12px' : '8px')"
               (mousedown)="onTableMouseDown($event, t)"
               (click)="onTableClick($event, t)">

            <div class="table-inner">
              <div class="table-number">#{{ t.tableNumber }}</div>
              <div class="table-icon">
                @if (t.tableType === 'circle') {
                  <app-icon name="circle" [size]="14"></app-icon>
                } @else if (t.tableType === 'booth') {
                  <app-icon name="layout" [size]="14"></app-icon>
                } @else if (t.tableType === 'bar') {
                  <app-icon name="minus" [size]="14"></app-icon>
                } @else {
                  <app-icon name="square" [size]="14"></app-icon>
                }
              </div>
              <div class="table-cap">{{ t.capacity }}<app-icon name="user" [size]="10"></app-icon></div>
            </div>

            <!-- Resize handles (only when selected) -->
            @if (t._selected) {
              <div class="resize-handle rh-nw" (mousedown)="onResizeStart($event, t, 'nw')"></div>
              <div class="resize-handle rh-ne" (mousedown)="onResizeStart($event, t, 'ne')"></div>
              <div class="resize-handle rh-se" (mousedown)="onResizeStart($event, t, 'se')"></div>
              <div class="resize-handle rh-sw" (mousedown)="onResizeStart($event, t, 'sw')"></div>
              <div class="resize-handle rh-n"  (mousedown)="onResizeStart($event, t, 'n')"></div>
              <div class="resize-handle rh-e"  (mousedown)="onResizeStart($event, t, 'e')"></div>
              <div class="resize-handle rh-s"  (mousedown)="onResizeStart($event, t, 's')"></div>
              <div class="resize-handle rh-w"  (mousedown)="onResizeStart($event, t, 'w')"></div>
            }
          </div>
        }

        <!-- Drop ghost -->
        @if (dropGhost()) {
          <div class="drop-ghost"
               [style.left.px]="dropGhost()!.x * zoom()"
               [style.top.px]="dropGhost()!.y * zoom()"
               [style.width.px]="dropGhost()!.w * zoom()"
               [style.height.px]="dropGhost()!.h * zoom()">
          </div>
        }
      </div>
    </div>

    <!-- RIGHT PANEL: Zone stats -->
    <div class="canvas-right-panel">
      <div class="stats-card">
        <div class="stats-title">{{ 'canvas.stats' | translate }}</div>
        <div class="stat-row">
          <span>{{ 'tables.table' | translate }}</span>
          <strong>{{ tables().length }}</strong>
        </div>
        <div class="stat-row stat-row--free">
          <span>{{ 'tables.statusAvailable' | translate }}</span>
          <strong>{{ freeCount() }}</strong>
        </div>
        <div class="stat-row stat-row--occupied">
          <span>{{ 'tables.statusOccupied' | translate }}</span>
          <strong>{{ occupiedCount() }}</strong>
        </div>
        <div class="stat-row">
          <span>{{ 'canvas.totalSeats' | translate }}</span>
          <strong>{{ totalCapacity() }}</strong>
        </div>
      </div>

      @if (hasDirty()) {
        <div class="dirty-badge">
          <app-icon name="alert-circle" [size]="14"></app-icon>
          {{ dirtyCount() }} {{ 'canvas.unsavedChanges' | translate }}
        </div>
      }

      <!-- Legend -->
      <div class="legend-card">
        <div class="legend-title">{{ 'canvas.legend' | translate }}</div>
        <div class="legend-item">
          <span class="legend-dot legend-dot--free"></span>
          <span>{{ 'tables.statusAvailable' | translate }}</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot legend-dot--occupied"></span>
          <span>{{ 'tables.statusOccupied' | translate }}</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot legend-dot--dirty"></span>
          <span>{{ 'canvas.unsaved' | translate }}</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot legend-dot--selected"></span>
          <span>{{ 'canvas.selected' | translate }}</span>
        </div>
      </div>

      <!-- Keyboard shortcuts -->
      <div class="shortcuts-card">
        <div class="legend-title">{{ 'canvas.shortcuts' | translate }}</div>
        <div class="shortcut-row"><kbd>Del</kbd> <span>{{ 'common.delete' | translate }}</span></div>
        <div class="shortcut-row"><kbd>Esc</kbd> <span>Bekor qilish</span></div>
        <div class="shortcut-row"><kbd>Ctrl+Z</kbd> <span>Qaytarish</span></div>
        <div class="shortcut-row"><kbd>Ctrl+S</kbd> <span>{{ 'common.save' | translate }}</span></div>
        <div class="shortcut-row"><kbd>←→↑↓</kbd> <span>Siljitish</span></div>
      </div>
    </div>

  </div>

  <!-- ══ LOADING OVERLAY ════════════════════════════════════════════════════ -->
  @if (loading()) {
    <div class="canvas-loader">
      <div class="spinner-lg"></div>
      <p>{{ 'common.loading' | translate }}</p>
    </div>
  }

  <!-- ══ ADD TABLE QUICK MODAL ════════════════════════════════════════════ -->
  @if (showAddModal()) {
    <div class="cmodal-backdrop" (click)="showAddModal.set(false)">
      <div class="cmodal" (click)="$event.stopPropagation()">
        <div class="cmodal-header">
          <h3>{{ 'canvas.newTable' | translate }}</h3>
          <button (click)="showAddModal.set(false)"><app-icon name="x" [size]="18"></app-icon></button>
        </div>
        <div class="cmodal-body">
          <div class="prop-group">
            <label>{{ 'tables.tableNumber' | translate }} *</label>
            <input type="text" class="prop-input" [(ngModel)]="addForm.tableNumber" placeholder="1, 2, A1..."/>
          </div>
          <div class="prop-group">
            <label>{{ 'tables.tableName' | translate }}</label>
            <input type="text" class="prop-input" [(ngModel)]="addForm.name" placeholder="Stol 1"/>
          </div>
          <div class="prop-group">
            <label>{{ 'tables.capacity' | translate }}</label>
            <input type="number" class="prop-input" [(ngModel)]="addForm.capacity" min="1" max="50"/>
          </div>
        </div>
        <div class="cmodal-footer">
          <button class="btn-canvas btn-canvas--secondary" (click)="showAddModal.set(false)">{{ 'common.cancel' | translate }}</button>
          <button class="btn-canvas btn-canvas--primary" (click)="confirmAddTable()" [disabled]="!addForm.tableNumber">
            {{ 'common.add' | translate }}
          </button>
        </div>
      </div>
    </div>
  }

  <!-- ══ DELETE CONFIRM MODAL ══════════════════════════════════════════════ -->
  @if (confirmDelete()) {
    <div class="cmodal-backdrop" (click)="confirmDelete.set(null)">
      <div class="cmodal cmodal--sm" (click)="$event.stopPropagation()">
        <div class="cmodal-header">
          <h3>Stolni o'chirish</h3>
        </div>
        <div class="cmodal-body">
          <p>{{ confirmDelete()?.name }} (#{{ confirmDelete()?.tableNumber }}) stolni o'chirishni tasdiqlaysizmi?</p>
          @if (confirmDelete()?.status !== 'FREE') {
            <div class="warning-msg">
              <app-icon name="alert-triangle" [size]="14"></app-icon>
              Bu stol band! O'chirishdan oldin buyurtmani yakunlang.
            </div>
          }
        </div>
        <div class="cmodal-footer">
          <button class="btn-canvas btn-canvas--secondary" (click)="confirmDelete.set(null)">{{ 'common.cancel' | translate }}</button>
          <button class="btn-canvas btn-canvas--danger" (click)="executeDeleteTable()" [disabled]="confirmDelete()?.status !== 'FREE'">
            <app-icon name="trash" [size]="14"></app-icon> {{ 'common.delete' | translate }}
          </button>
        </div>
      </div>
    </div>
  }

</div>
  `,
  styleUrls: ['./table-canvas.component.scss']
})
export class TableCanvasComponent implements OnInit, OnDestroy {
  @ViewChild('viewport') viewportEl!: ElementRef<HTMLDivElement>;
  @ViewChild('canvasEl') canvasElRef!: ElementRef<HTMLDivElement>;

  private tableService = inject(TableService);
  private notif = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private destroy$ = new Subject<void>();
  private saveQueue$ = new Subject<void>();

  readonly SNAP_GRID = SNAP_GRID;
  readonly presets = TABLE_PRESETS;
  readonly rotationOptions = [0, 45, 90, 135, 180, 225, 270, 315];

  // ─── Signals ───────────────────────────────────────────────────────────────
  loading = signal(true);
  saving = signal(false);
  zoneId = signal<string>('');
  zones = signal<TableZone[]>([]);
  zone = computed(() => this.zones().find(z => z.id === this.zoneId()) ?? null);
  tables = signal<CanvasTable[]>([]);
  zoom = signal(1.0);
  showGrid = signal(true);
  showAddModal = signal(false);
  confirmDelete = signal<CanvasTable | null>(null);
  dropGhost = signal<{ x: number; y: number; w: number; h: number } | null>(null);
  rulerOffsetX = signal(0);
  rulerOffsetY = signal(0);

  canvasW = computed(() => this.zone()?.canvasWidth ?? 1200);
  canvasH = computed(() => this.zone()?.canvasHeight ?? 800);

  selectedTable = computed(() => this.tables().find(t => t._selected) ?? null);
  hasDirty = computed(() => this.tables().some(t => t._dirty));
  dirtyCount = computed(() => this.tables().filter(t => t._dirty).length);
  freeCount = computed(() => this.tables().filter(t => t.status === 'FREE').length);
  occupiedCount = computed(() => this.tables().filter(t => t.status !== 'FREE').length);
  totalCapacity = computed(() => this.tables().reduce((s, t) => s + t.capacity, 0));

  // ─── Forms ──────────────────────────────────────────────────────────────────
  editForm = { tableNumber: '', name: '', capacity: 4, tableType: 'rectangle', posX: 0, posY: 0, width: 100, height: 80, rotation: 0 };
  addForm  = { tableNumber: '', name: '', capacity: 4, tableType: 'rectangle', width: 100, height: 80 };
  canvasForm = { width: 1200, height: 800 };

  // ─── Drag/Resize state ──────────────────────────────────────────────────────
  private drag: DragState = { active: false, tableId: null, startMouseX: 0, startMouseY: 0, startTableX: 0, startTableY: 0 };
  private resize: ResizeState = { active: false, tableId: null, handle: '', startMouseX: 0, startMouseY: 0, startWidth: 0, startHeight: 0, startX: 0, startY: 0 };
  private pendingAddPreset: typeof TABLE_PRESETS[0] | null = null;
  private dropX = 0;
  private dropY = 0;

  // ─── Undo stack ─────────────────────────────────────────────────────────────
  private undoStack: CanvasTable[][] = [];

  // ──────────────────────────────────────────────────────────────────────────
  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.zoneId.set(params['zoneId'] || '');
      this.loadAll();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Data Loading ───────────────────────────────────────────────────────────
  loadAll() {
    this.loading.set(true);
    forkJoin({
      zones: this.tableService.getZones(),
      tables: this.tableService.getTables(this.zoneId() || undefined)
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ zones, tables }) => {
        const zoneList = zones.data ?? [];
        this.zones.set(zoneList);

        // If no zoneId set but zones exist, pick first
        if (!this.zoneId() && zoneList.length > 0) {
          this.zoneId.set(zoneList[0].id);
          this.loadTablesForZone(zoneList[0].id);
          return;
        }

        this.canvasForm.width  = this.zone()?.canvasWidth  ?? 1200;
        this.canvasForm.height = this.zone()?.canvasHeight ?? 800;

        this.tables.set((tables.data ?? []).map(t => ({ ...t, _dirty: false, _selected: false })));
        this.loading.set(false);
        setTimeout(() => this.fitToView(), 50);
      },
      error: () => { this.loading.set(false); this.notif.error('Ma\'lumot yuklanmadi'); }
    });
  }

  loadTablesForZone(zoneId: string) {
    this.loading.set(true);
    this.tableService.getTables(zoneId).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        this.tables.set((res.data ?? []).map(t => ({ ...t, _dirty: false, _selected: false })));
        this.canvasForm.width  = this.zone()?.canvasWidth  ?? 1200;
        this.canvasForm.height = this.zone()?.canvasHeight ?? 800;
        this.loading.set(false);
        setTimeout(() => this.fitToView(), 50);
      },
      error: () => this.loading.set(false)
    });
  }

  switchZone(zoneId: string) {
    if (this.hasDirty()) {
      const ok = confirm('Saqlash amalga oshirilmagan o\'zgarishlar mavjud. Boshqa bo\'limga o\'tishni xohlaysizmi?');
      if (!ok) return;
    }
    this.zoneId.set(zoneId);
    this.router.navigate(['/tables/canvas', zoneId]);
    this.loadTablesForZone(zoneId);
  }

  goBack() {
    if (this.hasDirty()) {
      const ok = confirm('Saqlash amalga oshirilmagan o\'zgarishlar mavjud. Chiqqandan so\'ng yo\'qoladi. Davom etasizmi?');
      if (!ok) return;
    }
    this.router.navigate(['/tables']);
  }

  // ─── Zoom & Fit ─────────────────────────────────────────────────────────────
  zoomIn()  { this.zoom.set(Math.min(2.0, +(this.zoom() + 0.1).toFixed(2))); }
  zoomOut() { this.zoom.set(Math.max(0.2, +(this.zoom() - 0.1).toFixed(2))); }

  fitToView() {
    if (!this.viewportEl) return;
    const vp = this.viewportEl.nativeElement;
    // 32px safe padding (16px on each side)
    const availW = Math.max(100, vp.clientWidth - 32);
    const availH = Math.max(100, vp.clientHeight - 32);
    if (availW <= 0 || availH <= 0) return;
    const scaleX = availW / this.canvasW();
    const scaleY = availH / this.canvasH();
    const scale = Math.min(scaleX, scaleY);
    // Auto-fit so the entire hall is visible with 0 scrollbar
    this.zoom.set(Math.min(1.5, Math.max(0.15, Math.round(scale * 100) / 100)));
    vp.scrollLeft = 0;
    vp.scrollTop = 0;
  }

  @HostListener('window:resize')
  onResize() {
    this.fitToView();
  }

  onViewportWheel(e: WheelEvent) {
    if (e.ctrlKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        this.zoomIn();
      } else {
        this.zoomOut();
      }
    }
  }

  onViewportScroll() {
    if (!this.viewportEl) return;
    const el = this.viewportEl.nativeElement;
    this.rulerOffsetX.set(-el.scrollLeft);
    this.rulerOffsetY.set(-el.scrollTop);
  }

  // ─── Selection ──────────────────────────────────────────────────────────────
  onTableClick(e: MouseEvent, t: CanvasTable) {
    e.stopPropagation();
    this.selectTable(t);
  }

  selectTable(t: CanvasTable) {
    this.tables.update(ts => ts.map(x => ({ ...x, _selected: x.id === t.id })));
    const found = this.tables().find(x => x.id === t.id)!;
    this.editForm = {
      tableNumber: found.tableNumber,
      name:        found.name,
      capacity:    found.capacity,
      tableType:   found.tableType || 'rectangle',
      posX:        found.posX,
      posY:        found.posY,
      width:       found.width,
      height:      found.height,
      rotation:    found.rotation ?? 0
    };
  }

  deselectTable() {
    this.applyEditFormToSelected();
    this.tables.update(ts => ts.map(x => ({ ...x, _selected: false })));
  }

  onCanvasMouseDown(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('canvas-world')) {
      this.deselectTable();
    }
  }

  // ─── Drag ───────────────────────────────────────────────────────────────────
  onTableMouseDown(e: MouseEvent, t: CanvasTable) {
    if ((e.target as HTMLElement).classList.contains('resize-handle')) return;
    e.stopPropagation();
    e.preventDefault();
    this.selectTable(t);
    this.drag = {
      active:       true,
      tableId:      t.id,
      startMouseX:  e.clientX,
      startMouseY:  e.clientY,
      startTableX:  t.posX,
      startTableY:  t.posY
    };
  }

  onMouseMove(e: MouseEvent) {
    if (this.drag.active && this.drag.tableId) {
      const dx = (e.clientX - this.drag.startMouseX) / this.zoom();
      const dy = (e.clientY - this.drag.startMouseY) / this.zoom();
      const newX = Math.max(0, Math.round((this.drag.startTableX + dx) / SNAP_GRID) * SNAP_GRID);
      const newY = Math.max(0, Math.round((this.drag.startTableY + dy) / SNAP_GRID) * SNAP_GRID);

      this.tables.update(ts => ts.map(t => t.id === this.drag.tableId
        ? { ...t, posX: newX, posY: newY, _dirty: true }
        : t
      ));
      this.syncEditForm();
    }

    if (this.resize.active && this.resize.tableId) {
      const dx = (e.clientX - this.resize.startMouseX) / this.zoom();
      const dy = (e.clientY - this.resize.startMouseY) / this.zoom();
      const h = this.resize.handle;

      let newX = this.resize.startX;
      let newY = this.resize.startY;
      let newW = this.resize.startWidth;
      let newH = this.resize.startHeight;

      if (h.includes('e'))  newW = Math.max(MIN_W, Math.round((this.resize.startWidth  + dx) / SNAP_GRID) * SNAP_GRID);
      if (h.includes('s'))  newH = Math.max(MIN_H, Math.round((this.resize.startHeight + dy) / SNAP_GRID) * SNAP_GRID);
      if (h.includes('w')) { newW = Math.max(MIN_W, Math.round((this.resize.startWidth  - dx) / SNAP_GRID) * SNAP_GRID); newX = this.resize.startX + (this.resize.startWidth - newW); }
      if (h.includes('n')) { newH = Math.max(MIN_H, Math.round((this.resize.startHeight - dy) / SNAP_GRID) * SNAP_GRID); newY = this.resize.startY + (this.resize.startHeight - newH); }

      this.tables.update(ts => ts.map(t => t.id === this.resize.tableId
        ? { ...t, posX: Math.max(0, newX), posY: Math.max(0, newY), width: newW, height: newH, _dirty: true }
        : t
      ));
      this.syncEditForm();
    }
  }

  onMouseUp(e: MouseEvent) {
    if (this.drag.active || this.resize.active) {
      this.pushUndo();
    }
    this.drag   = { active: false, tableId: null, startMouseX: 0, startMouseY: 0, startTableX: 0, startTableY: 0 };
    this.resize = { active: false, tableId: null, handle: '', startMouseX: 0, startMouseY: 0, startWidth: 0, startHeight: 0, startX: 0, startY: 0 };
  }

  // ─── Resize handles ─────────────────────────────────────────────────────────
  onResizeStart(e: MouseEvent, t: CanvasTable, handle: string) {
    e.stopPropagation();
    e.preventDefault();
    this.resize = {
      active:       true,
      tableId:      t.id,
      handle,
      startMouseX:  e.clientX,
      startMouseY:  e.clientY,
      startWidth:   t.width,
      startHeight:  t.height,
      startX:       t.posX,
      startY:       t.posY
    };
  }

  // ─── Library Drag-and-Drop ──────────────────────────────────────────────────
  onLibraryDragStart(e: DragEvent, preset: typeof TABLE_PRESETS[0]) {
    e.dataTransfer?.setData('text/plain', preset.type);
    this.pendingAddPreset = preset;
  }

  onCanvasDrop(e: DragEvent) {
    e.preventDefault();
    if (!this.pendingAddPreset) return;
    const rect = this.canvasElRef.nativeElement.getBoundingClientRect();
    const rawX = (e.clientX - rect.left) / this.zoom();
    const rawY = (e.clientY - rect.top)  / this.zoom();
    this.dropX = Math.round(rawX / SNAP_GRID) * SNAP_GRID;
    this.dropY = Math.round(rawY / SNAP_GRID) * SNAP_GRID;
    this.addForm = {
      tableNumber: this.nextTableNumber(),
      name:        'Stol ' + this.nextTableNumber(),
      capacity:    this.pendingAddPreset.capacity,
      tableType:   this.pendingAddPreset.type,
      width:       this.pendingAddPreset.defaultW,
      height:      this.pendingAddPreset.defaultH
    };
    this.showAddModal.set(true);
  }

  // ─── Quick Add (click on library item) ──────────────────────────────────────
  quickAddTable(preset: typeof TABLE_PRESETS[0]) {
    this.pendingAddPreset = preset;
    this.dropX = 20;
    this.dropY = 20;
    this.addForm = {
      tableNumber: this.nextTableNumber(),
      name:        'Stol ' + this.nextTableNumber(),
      capacity:    preset.capacity,
      tableType:   preset.type,
      width:       preset.defaultW,
      height:      preset.defaultH
    };
    this.showAddModal.set(true);
  }

  confirmAddTable() {
    if (!this.addForm.tableNumber.trim() || !this.zoneId()) return;
    const req: CreateTableRequest = {
      zoneId:      this.zoneId(),
      tableNumber: this.addForm.tableNumber.trim(),
      name:        this.addForm.name.trim() || 'Stol ' + this.addForm.tableNumber,
      capacity:    this.addForm.capacity,
      tableType:   this.pendingAddPreset?.type ?? 'rectangle',
      shape:       this.pendingAddPreset?.type ?? 'rectangle',
      posX:        this.dropX,
      posY:        this.dropY,
      width:       this.addForm.width,
      height:      this.addForm.height,
      rotation:    0
    };

    this.tableService.createTable(req).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        const t: CanvasTable = { ...res.data!, _dirty: false, _selected: true };
        this.tables.update(ts => [...ts.map(x => ({ ...x, _selected: false })), t]);
        this.showAddModal.set(false);
        this.notif.success('Stol qo\'shildi');
      },
      error: (err) => this.notif.error(err?.error?.message || 'Stol qo\'shilmadi')
    });
  }

  nextTableNumber(): string {
    const nums = this.tables().map(t => parseInt(t.tableNumber)).filter(n => !isNaN(n));
    return nums.length > 0 ? String(Math.max(...nums) + 1) : '1';
  }

  // ─── Edit form sync ─────────────────────────────────────────────────────────
  syncEditForm() {
    const sel = this.selectedTable();
    if (!sel) return;
    this.editForm.posX   = sel.posX;
    this.editForm.posY   = sel.posY;
    this.editForm.width  = sel.width;
    this.editForm.height = sel.height;
  }

  applyEditFormToSelected() {
    const sel = this.selectedTable();
    if (!sel) return;
    this.tables.update(ts => ts.map(t => t.id === sel.id ? {
      ...t,
      tableNumber: this.editForm.tableNumber,
      name:        this.editForm.name,
      capacity:    this.editForm.capacity,
      tableType:   this.editForm.tableType,
      posX:        this.editForm.posX,
      posY:        this.editForm.posY,
      width:       this.editForm.width,
      height:      this.editForm.height,
      rotation:    this.editForm.rotation,
      _dirty:      true
    } : t));
  }

  applyTableType() {
    const sel = this.selectedTable();
    if (!sel) return;
    this.tables.update(ts => ts.map(t => t.id === sel.id ? { ...t, tableType: this.editForm.tableType, _dirty: true } : t));
  }

  applyPosition() {
    const sel = this.selectedTable();
    if (!sel) return;
    this.tables.update(ts => ts.map(t => t.id === sel.id ? {
      ...t,
      posX: Math.max(0, this.editForm.posX),
      posY: Math.max(0, this.editForm.posY),
      _dirty: true
    } : t));
  }

  applySize() {
    const sel = this.selectedTable();
    if (!sel) return;
    this.tables.update(ts => ts.map(t => t.id === sel.id ? {
      ...t,
      width:  Math.max(MIN_W, this.editForm.width),
      height: Math.max(MIN_H, this.editForm.height),
      _dirty: true
    } : t));
  }

  applyRotation(deg: number) {
    const sel = this.selectedTable();
    if (!sel) return;
    this.editForm.rotation = deg;
    this.tables.update(ts => ts.map(t => t.id === sel.id ? { ...t, rotation: deg, _dirty: true } : t));
  }

  markDirty(t: CanvasTable) {
    this.tables.update(ts => ts.map(x => x.id === t.id ? { ...x, _dirty: true } : x));
  }

  // ─── Canvas size ────────────────────────────────────────────────────────────
  applyCanvasSize() {
    if (!this.zoneId()) return;
    this.tableService.updateZoneCanvas(this.zoneId(), this.canvasForm.width, this.canvasForm.height)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: res => {
          this.zones.update(zs => zs.map(z => z.id === this.zoneId() ? { ...z, canvasWidth: res.data!.canvasWidth, canvasHeight: res.data!.canvasHeight } : z));
          this.notif.success('Canvas o\'lchami yangilandi');
          setTimeout(() => this.fitToView(), 50);
        },
        error: () => this.notif.error('Canvas o\'lchamini saqlashda xatolik')
      });
  }

  // ─── Save all dirty tables ──────────────────────────────────────────────────
  saveAll() {
    const dirty = this.tables().filter(t => t._dirty);
    if (!dirty.length) return;
    this.saving.set(true);

    // Apply edit form to selected before saving
    this.applyEditFormToSelected();
    const toSave = this.tables().filter(t => t._dirty);

    const requests = toSave.map(t => {
      const layout: UpdateLayoutRequest = {
        posX: t.posX, posY: t.posY, width: t.width, height: t.height,
        rotation: t.rotation ?? 0, tableType: t.tableType || 'rectangle'
      };
      return this.tableService.updateTableLayout(t.id, layout);
    });

    // Save table details too (name, number, capacity if changed)
    const detailRequests = toSave.map(t =>
      this.tableService.updateTable(t.id, {
        tableNumber: t.tableNumber,
        name:        t.name,
        capacity:    t.capacity,
        tableType:   t.tableType || 'rectangle'
      })
    );

    forkJoin([...requests, ...detailRequests]).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.tables.update(ts => ts.map(t => ({ ...t, _dirty: false })));
        this.saving.set(false);
        this.notif.success(`${toSave.length} ta stol saqlandi`);
      },
      error: () => {
        this.saving.set(false);
        this.notif.error('Saqlashda xatolik yuz berdi');
      }
    });
  }

  discardChanges() {
    const ok = confirm('Barcha saqlash amalga oshirilmagan o\'zgarishlarni bekor qilasizmi?');
    if (!ok) return;
    this.loadTablesForZone(this.zoneId());
  }

  // ─── Delete ─────────────────────────────────────────────────────────────────
  confirmDeleteTable(t: CanvasTable) {
    this.confirmDelete.set(t);
  }

  executeDeleteTable() {
    const t = this.confirmDelete();
    if (!t) return;
    this.tableService.deleteTable(t.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.tables.update(ts => ts.filter(x => x.id !== t.id));
        this.confirmDelete.set(null);
        this.notif.success('Stol o\'chirildi');
      },
      error: (err) => this.notif.error(err?.error?.message || 'Stol o\'chirilmadi')
    });
  }

  // ─── Undo ───────────────────────────────────────────────────────────────────
  pushUndo() {
    this.undoStack.push(JSON.parse(JSON.stringify(this.tables())));
    if (this.undoStack.length > 30) this.undoStack.shift();
  }

  undo() {
    if (!this.undoStack.length) return;
    this.tables.set(this.undoStack.pop()!);
  }

  // ─── Keyboard shortcuts ──────────────────────────────────────────────────────
  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); this.saveAll(); return; }
    if (e.ctrlKey && e.key === 'z') { e.preventDefault(); this.undo(); return; }
    if (e.key === 'Escape') { this.deselectTable(); return; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedTable() && document.activeElement?.tagName !== 'INPUT') {
      this.confirmDeleteTable(this.selectedTable()!);
    }
    const sel = this.selectedTable();
    if (!sel) return;
    const step = e.shiftKey ? SNAP_GRID * 5 : SNAP_GRID;
    if (e.key === 'ArrowLeft')  { this.moveSelected(-step, 0); e.preventDefault(); }
    if (e.key === 'ArrowRight') { this.moveSelected(step,  0); e.preventDefault(); }
    if (e.key === 'ArrowUp')    { this.moveSelected(0, -step); e.preventDefault(); }
    if (e.key === 'ArrowDown')  { this.moveSelected(0,  step); e.preventDefault(); }
  }

  moveSelected(dx: number, dy: number) {
    const sel = this.selectedTable();
    if (!sel) return;
    this.tables.update(ts => ts.map(t => t.id === sel.id
      ? { ...t, posX: Math.max(0, t.posX + dx), posY: Math.max(0, t.posY + dy), _dirty: true }
      : t
    ));
    this.syncEditForm();
  }
}
