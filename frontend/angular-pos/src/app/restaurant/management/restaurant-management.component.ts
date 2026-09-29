import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TableService, RestaurantTable, TableZone, CreateTableRequest } from '../../core/services/table.service';
import { ProductService, Product } from '../../core/services/product.service';
import { CategoryService, Category, CreateCategoryRequest } from '../../core/services/category.service';
import { KitchenService, KitchenStation, CreateKitchenRequest } from '../../core/services/kitchen.service';
import { PrinterService, Printer, AvailablePrinter, CreatePrinterRequest } from '../../core/services/printer.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { AppIconComponent } from '../../shared/components/icon/icon.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

type ManagementTab = 'overview' | 'places' | 'tables' | 'products' | 'kitchens' | 'printers';

@Component({
  selector: 'app-restaurant-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppIconComponent],
  templateUrl: './restaurant-management.component.html',
  styleUrls: ['./restaurant-management.component.scss']
})
export class RestaurantManagementComponent implements OnInit {
  private tableService = inject(TableService);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private kitchenService = inject(KitchenService);
  private printerService = inject(PrinterService);
  private notif = inject(NotificationService);
  private route = inject(ActivatedRoute);
  public router = inject(Router);
  public auth = inject(AuthService);

  // Active sub-page tab
  activeTab = signal<ManagementTab>('overview');
  loading = signal(false);

  // Entities Data
  zones = signal<TableZone[]>([]);
  tables = signal<RestaurantTable[]>([]);
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  kitchens = signal<KitchenStation[]>([]);
  printers = signal<Printer[]>([]);
  availableSystemPrinters = signal<AvailablePrinter[]>([]);

  // Tables Filtering
  tableFilterZoneId = signal<string>('ALL');
  tableFilterStatus = signal<string>('ALL');
  tableSearchQuery = signal<string>('');

  // -------------------------------------------------------------
  // ZONE (HALL / PLACE) FORM
  // -------------------------------------------------------------
  showZoneForm = signal(false);
  editingZone = signal<TableZone | null>(null);
  zoneForm = {
    name: '',
    description: '',
    percentage: 0,
    canvasWidth: 1200,
    canvasHeight: 800
  };

  // -------------------------------------------------------------
  // TABLE FORM
  // -------------------------------------------------------------
  showTableForm = signal(false);
  editingTable = signal<RestaurantTable | null>(null);
  tableForm = {
    tableNumber: '',
    name: '',
    zoneId: '',
    capacity: 4,
    tableType: 'rectangle'
  };

  // -------------------------------------------------------------
  // KITCHEN FORM
  // -------------------------------------------------------------
  showKitchenForm = signal(false);
  kitchenForm = {
    name: '',
    code: '',
    description: ''
  };

  // -------------------------------------------------------------
  // CATEGORY FORM
  // -------------------------------------------------------------
  showCategoryForm = signal(false);
  categoryForm = {
    name: '',
    kitchenId: '',
    sortOrder: 0
  };

  // -------------------------------------------------------------
  // PRINTER FORM
  // -------------------------------------------------------------
  showPrinterForm = signal(false);
  editingPrinter = signal<Printer | null>(null);
  printerForm = {
    systemPrinterName: '',
    name: '',
    purpose: 'CASHIER' as 'CASHIER' | 'KITCHEN',
    kitchenId: '',
    paperWidth: 80,
    isDefault: true,
    autoPrint: true
  };

  // Computed Filters for Tables
  filteredTables = computed(() => {
    let list = this.tables();
    const zoneId = this.tableFilterZoneId();
    if (zoneId !== 'ALL') {
      list = list.filter(t => t.zoneId === zoneId);
    }
    const status = this.tableFilterStatus();
    if (status !== 'ALL') {
      list = list.filter(t => t.status === status);
    }
    const query = this.tableSearchQuery().trim().toLowerCase();
    if (query) {
      list = list.filter(t => 
        (t.name && t.name.toLowerCase().includes(query)) ||
        (t.tableNumber && t.tableNumber.toLowerCase().includes(query)) ||
        (t.zoneName && t.zoneName.toLowerCase().includes(query))
      );
    }
    return list;
  });

  ngOnInit(): void {
    // Check route parameter tab if present
    this.route.params.subscribe(params => {
      const tabParam = params['tab'] as ManagementTab;
      if (tabParam && ['overview', 'places', 'tables', 'products', 'kitchens', 'printers'].includes(tabParam)) {
        this.activeTab.set(tabParam);
      }
    });

    this.route.queryParams.subscribe(q => {
      const tab = q['tab'] as ManagementTab;
      if (tab && ['overview', 'places', 'tables', 'products', 'kitchens', 'printers'].includes(tab)) {
        this.activeTab.set(tab);
      }
    });

    this.loadAllData();
  }

  setTab(tab: ManagementTab): void {
    this.activeTab.set(tab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
  }

  loadAllData(): void {
    this.loading.set(true);

    // Load Zones
    this.tableService.getZones().subscribe({
      next: res => {
        this.zones.set(res.data || []);
      },
      error: () => {}
    });

    // Load Tables
    this.tableService.getTables().subscribe({
      next: res => {
        this.tables.set(res.data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    // Load Kitchens
    this.kitchenService.getKitchens().subscribe({
      next: (res: any) => {
        this.kitchens.set(res.data || []);
      },
      error: () => {}
    });

    // Load Categories
    this.categoryService.getCategories().subscribe({
      next: res => {
        this.categories.set(res.data || []);
      },
      error: () => {}
    });

    // Load Products sample
    this.productService.getProducts(undefined, undefined, false, 0, 50).subscribe({
      next: res => {
        this.products.set(res.data || []);
      },
      error: () => {}
    });

    // Load Printers & available system printers
    this.printerService.getPrinters().subscribe({
      next: res => {
        this.printers.set(res.data || []);
      },
      error: () => {}
    });

    this.printerService.getAvailablePrinters().subscribe({
      next: res => {
        this.availableSystemPrinters.set(res.data || []);
      },
      error: () => {}
    });
  }

  // -------------------------------------------------------------
  // ZONE (HALL / PLACE) ACTIONS
  // -------------------------------------------------------------
  countTablesInZone(zoneId: string): number {
    return this.tables().filter(t => t.zoneId === zoneId).length;
  }

  countOccupiedInZone(zoneId: string): number {
    return this.tables().filter(t => t.zoneId === zoneId && t.status !== 'FREE').length;
  }

  countFreeInZone(zoneId: string): number {
    return this.tables().filter(t => t.zoneId === zoneId && t.status === 'FREE').length;
  }

  openCreateZone(): void {
    this.editingZone.set(null);
    this.zoneForm = {
      name: '',
      description: '',
      percentage: 0,
      canvasWidth: 1200,
      canvasHeight: 800
    };
    this.showZoneForm.set(true);
  }

  editZone(zone: TableZone): void {
    this.editingZone.set(zone);
    this.zoneForm = {
      name: zone.name,
      description: zone.description || '',
      percentage: zone.percentage || 0,
      canvasWidth: zone.canvasWidth || 1200,
      canvasHeight: zone.canvasHeight || 800
    };
    this.showZoneForm.set(true);
  }

  cancelZoneForm(): void {
    this.showZoneForm.set(false);
    this.editingZone.set(null);
  }

  saveZone(openConstructorAfter: boolean = false): void {
    if (!this.zoneForm.name.trim()) {
      this.notif.error('Zal nomini kiriting');
      return;
    }

    const current = this.editingZone();
    if (current) {
      // Update
      this.tableService.updateZone(current.id, {
        name: this.zoneForm.name.trim(),
        description: this.zoneForm.description.trim(),
        percentage: Number(this.zoneForm.percentage) || 0
      }).subscribe({
        next: () => {
          // Also update canvas if changed
          if (this.zoneForm.canvasWidth && this.zoneForm.canvasHeight) {
            this.tableService.updateZoneCanvas(current.id, this.zoneForm.canvasWidth, this.zoneForm.canvasHeight).subscribe();
          }
          this.notif.success('Zal muvaffaqiyatli yangilandi');
          this.showZoneForm.set(false);
          this.editingZone.set(null);
          this.loadAllData();
          if (openConstructorAfter) {
            this.router.navigate(['/tables/canvas', current.id]);
          }
        },
        error: err => this.notif.error(err?.error?.message || 'Zalni saqlashda xatolik')
      });
    } else {
      // Create new
      this.tableService.createZone({
        name: this.zoneForm.name.trim(),
        description: this.zoneForm.description.trim(),
        percentage: Number(this.zoneForm.percentage) || 0
      }).subscribe({
        next: res => {
          const newZone = res.data;
          if (newZone && this.zoneForm.canvasWidth && this.zoneForm.canvasHeight) {
            this.tableService.updateZoneCanvas(newZone.id, this.zoneForm.canvasWidth, this.zoneForm.canvasHeight).subscribe();
          }
          this.notif.success('Yangi zal muvaffaqiyatli yaratildi');
          this.showZoneForm.set(false);
          this.loadAllData();
          if (openConstructorAfter && newZone) {
            this.router.navigate(['/tables/canvas', newZone.id]);
          }
        },
        error: err => this.notif.error(err?.error?.message || 'Zal yaratishda xatolik')
      });
    }
  }

  deleteZone(zone: TableZone): void {
    const tableCount = this.countTablesInZone(zone.id);
    const msg = tableCount > 0 
      ? `"${zone.name}" zalida ${tableCount} ta stol mavjud. Zal o'chirilsa uning stollari ham o'chiriladi. Davom etasizmi?`
      : `"${zone.name}" zalini o'chirishni tasdiqlaysizmi?`;

    if (!confirm(msg)) return;

    this.tableService.deleteZone(zone.id).subscribe({
      next: () => {
        this.notif.success('Zal o\'chirildi');
        this.loadAllData();
      },
      error: err => this.notif.error(err?.error?.message || 'Zalni o\'chirishda xatolik yuz berdi (ehtimol faol buyurtmalar mavjud)')
    });
  }

  openZoneConstructor(zoneId: string): void {
    this.router.navigate(['/tables/canvas', zoneId]);
  }

  // -------------------------------------------------------------
  // TABLE ACTIONS
  // -------------------------------------------------------------
  openCreateTable(): void {
    this.editingTable.set(null);
    const defaultZone = this.zones().length > 0 ? this.zones()[0].id : '';
    this.tableForm = {
      tableNumber: '',
      name: '',
      zoneId: defaultZone,
      capacity: 4,
      tableType: 'rectangle'
    };
    this.showTableForm.set(true);
  }

  editTable(table: RestaurantTable): void {
    this.editingTable.set(table);
    this.tableForm = {
      tableNumber: table.tableNumber,
      name: table.name || '',
      zoneId: table.zoneId || '',
      capacity: table.capacity || 4,
      tableType: table.tableType || 'rectangle'
    };
    this.showTableForm.set(true);
  }

  cancelTableForm(): void {
    this.showTableForm.set(false);
    this.editingTable.set(null);
  }

  saveTable(): void {
    if (!this.tableForm.tableNumber.trim()) {
      this.notif.error('Stol raqamini kiriting');
      return;
    }
    if (!this.tableForm.zoneId) {
      this.notif.error('Stol joylashadigan zalni tanlang');
      return;
    }

    const current = this.editingTable();
    if (current) {
      this.tableService.updateTable(current.id, {
        tableNumber: this.tableForm.tableNumber.trim(),
        name: this.tableForm.name.trim() || `Stol ${this.tableForm.tableNumber}`,
        zoneId: this.tableForm.zoneId,
        capacity: Number(this.tableForm.capacity) || 4,
        tableType: this.tableForm.tableType
      }).subscribe({
        next: () => {
          this.notif.success('Stol muvaffaqiyatli yangilandi');
          this.showTableForm.set(false);
          this.editingTable.set(null);
          this.loadAllData();
        },
        error: err => this.notif.error(err?.error?.message || 'Stolni saqlashda xatolik')
      });
    } else {
      const selectedZone = this.zones().find(z => z.id === this.tableForm.zoneId);
      const req: CreateTableRequest = {
        tableNumber: this.tableForm.tableNumber.trim(),
        name: this.tableForm.name.trim() || `Stol ${this.tableForm.tableNumber}`,
        zoneId: this.tableForm.zoneId,
        zoneName: selectedZone?.name || '',
        capacity: Number(this.tableForm.capacity) || 4,
        tableType: this.tableForm.tableType,
        shape: this.tableForm.tableType,
        posX: 60,
        posY: 60,
        width: this.tableForm.tableType === 'circle' ? 90 : 100,
        height: this.tableForm.tableType === 'circle' ? 90 : 80,
        rotation: 0
      };

      this.tableService.createTable(req).subscribe({
        next: () => {
          this.notif.success('Yangi stol muvaffaqiyatli yaratildi');
          this.showTableForm.set(false);
          this.loadAllData();
        },
        error: err => this.notif.error(err?.error?.message || 'Stol yaratishda xatolik')
      });
    }
  }

  deleteTable(table: RestaurantTable): void {
    if (table.status !== 'FREE') {
      this.notif.error('Band yoki faol buyurtmaga ega stolni o\'chirib bo\'lmaydi');
      return;
    }
    if (!confirm(`"${table.name || table.tableNumber}" stolini o'chirishni tasdiqlaysizmi?`)) {
      return;
    }
    this.tableService.deleteTable(table.id).subscribe({
      next: () => {
        this.notif.success('Stol o\'chirildi');
        this.loadAllData();
      },
      error: err => this.notif.error(err?.error?.message || 'Stolni o\'chirishda xatolik')
    });
  }

  // -------------------------------------------------------------
  // KITCHEN ACTIONS
  // -------------------------------------------------------------
  openCreateKitchen(): void {
    this.kitchenForm = { name: '', code: '', description: '' };
    this.showKitchenForm.set(true);
  }

  saveKitchen(): void {
    if (!this.kitchenForm.name.trim() || !this.kitchenForm.code.trim()) {
      this.notif.error('Oshxona nomi va kodini kiriting');
      return;
    }
    const req: CreateKitchenRequest = {
      name: this.kitchenForm.name.trim(),
      code: this.kitchenForm.code.trim().toUpperCase(),
      description: this.kitchenForm.description.trim(),
      active: true,
      color: '#3b82f6',
      preparationTimeMinutes: 15
    };
    this.kitchenService.createKitchen(req).subscribe({
      next: () => {
        this.notif.success('Yangi oshxona stansiyasi yaratildi');
        this.showKitchenForm.set(false);
        this.loadAllData();
      },
      error: (err: any) => this.notif.error(err?.error?.message || 'Oshxona yaratishda xatolik')
    });
  }

  // -------------------------------------------------------------
  // CATEGORY ACTIONS
  // -------------------------------------------------------------
  openCreateCategory(): void {
    const defaultKitchen = this.kitchens().length > 0 ? this.kitchens()[0].id : '';
    this.categoryForm = { name: '', kitchenId: defaultKitchen, sortOrder: 0 };
    this.showCategoryForm.set(true);
  }

  saveCategory(): void {
    if (!this.categoryForm.name.trim()) {
      this.notif.error('Kategoriya nomini kiriting');
      return;
    }
    if (!this.categoryForm.kitchenId) {
      this.notif.error('Tegishli oshxona bo\'limini tanlang');
      return;
    }
    const req: CreateCategoryRequest = {
      name: this.categoryForm.name.trim(),
      kitchenId: this.categoryForm.kitchenId,
      sortOrder: Number(this.categoryForm.sortOrder) || 0,
      active: true
    };
    this.categoryService.createCategory(req).subscribe({
      next: () => {
        this.notif.success('Kategoriya muvaffaqiyatli yaratildi');
        this.showCategoryForm.set(false);
        this.loadAllData();
      },
      error: err => this.notif.error(err?.error?.message || 'Kategoriya yaratishda xatolik')
    });
  }

  // -------------------------------------------------------------
  // PRINTER ACTIONS
  // -------------------------------------------------------------
  openCreatePrinter(): void {
    this.editingPrinter.set(null);
    const defaultSysPrinter = this.availableSystemPrinters().length > 0 ? this.availableSystemPrinters()[0].systemPrinterName : '';
    this.printerForm = {
      systemPrinterName: defaultSysPrinter,
      name: defaultSysPrinter,
      purpose: 'CASHIER',
      kitchenId: '',
      paperWidth: 80,
      isDefault: true,
      autoPrint: true
    };
    this.showPrinterForm.set(true);
  }

  savePrinter(): void {
    if (!this.printerForm.systemPrinterName) {
      this.notif.error('Windows printerini tanlang');
      return;
    }
    if (this.printerForm.purpose === 'KITCHEN' && !this.printerForm.kitchenId) {
      this.notif.error('Oshxona printeri uchun tegishli oshxona bo\'limini tanlang');
      return;
    }

    const req: CreatePrinterRequest = {
      systemPrinterName: this.printerForm.systemPrinterName,
      name: this.printerForm.name.trim() || this.printerForm.systemPrinterName,
      purpose: this.printerForm.purpose,
      paperWidth: Number(this.printerForm.paperWidth) || 80,
      isDefault: this.printerForm.isDefault,
      isPrimary: this.printerForm.isDefault,
      autoPrint: this.printerForm.autoPrint,
      kitchenId: this.printerForm.purpose === 'KITCHEN' ? this.printerForm.kitchenId : undefined
    };

    this.printerService.createPrinter(req).subscribe({
      next: () => {
        this.notif.success('Printer muvaffaqiyatli qo\'shildi');
        this.showPrinterForm.set(false);
        this.loadAllData();
      },
      error: err => this.notif.error(err?.error?.message || 'Printer saqlashda xatolik')
    });
  }

  deletePrinter(printer: Printer): void {
    if (!confirm(`"${printer.name}" printerini o'chirishni tasdiqlaysizmi?`)) {
      return;
    }
    this.printerService.deletePrinter(printer.id).subscribe({
      next: () => {
        this.notif.success('Printer o\'chirildi');
        this.loadAllData();
      },
      error: err => this.notif.error(err?.error?.message || 'Printerni o\'chirishda xatolik')
    });
  }

  testPrint(printer: Printer): void {
    this.notif.info(`"${printer.name}" printeriga test buyrug'i yuborilmoqda...`);
    this.printerService.testPrint(printer.id).subscribe({
      next: res => {
        if (res.data?.success) {
          this.notif.success('Test cheki muvaffaqiyatli chop etildi!');
        } else {
          this.notif.error(res.data?.message || 'Chop etishda xatolik yuz berdi');
        }
      },
      error: err => this.notif.error(err?.error?.message || 'Printer bilan bog\'lanishda xatolik')
    });
  }

  // Format Price
  formatPrice(amount?: number): string {
    if (amount === undefined || amount === null) return '0 UZS';
    return amount.toLocaleString('uz-UZ') + ' UZS';
  }
}
