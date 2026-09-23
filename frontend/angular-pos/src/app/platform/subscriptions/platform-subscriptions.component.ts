import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  BillingService,
  PlatformSubscriptionOverview,
  TenantSubscriptionSummary,
  PlanResponse,
  PlanSaveRequest,
  InvoiceResponse,
  DiscountRuleDto,
  AuditLogResponse,
  ManualActivationRequest,
  PaymentProviderSettingResponse,
  PaymentProviderSettingUpdateRequest,
  SubscriptionRequestResponse
} from '../../core/services/billing.service';

@Component({
  selector: 'app-platform-subscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="platform-subs-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">SaaS Obunalar va Billing Monitoringi</h1>
          <p class="page-subtitle">Barcha restoranlar obunalari, hisob-fakturalar, tariflar va daromadlar nazorati</p>
        </div>

        <div class="header-actions">
          <button class="btn btn-warning" (click)="openManualActivateModal()">
            ⚡ Qo'lda Faollashtirish
          </button>
          <button class="btn btn-outline" (click)="openNewPlanModal()">
            ➕ Yangi Tarif Yaratish
          </button>
          <button class="btn btn-primary" (click)="refreshAll()">
            🔄 Yangilash
          </button>
        </div>
      </div>

      <!-- KPI Metrics Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon icon-purple">💳</div>
          <div class="kpi-data">
            <span class="kpi-label">Jami Obunalar</span>
            <span class="kpi-value">{{ overview()?.totalSubscriptions || 0 }}</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-green">✅</div>
          <div class="kpi-data">
            <span class="kpi-label">Faol (Active)</span>
            <span class="kpi-value">{{ overview()?.activeSubscriptions || 0 }}</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-blue">⭐️</div>
          <div class="kpi-data">
            <span class="kpi-label">Standard Obunalar</span>
            <span class="kpi-value">{{ overview()?.standardSubscriptions || 0 }}</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-gold">🚀</div>
          <div class="kpi-data">
            <span class="kpi-label">PRO Obunalar</span>
            <span class="kpi-value">{{ overview()?.proSubscriptions || 0 }}</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-amber">⏳</div>
          <div class="kpi-data">
            <span class="kpi-label">Sinov Davri (Trial)</span>
            <span class="kpi-value">{{ overview()?.trialSubscriptions || 0 }}</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-warning">⚠️</div>
          <div class="kpi-data">
            <span class="kpi-label">Tugayotgan (7 kun ichida)</span>
            <span class="kpi-value">{{ overview()?.expiringSoonSubscriptions || 0 }}</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-red">🚫</div>
          <div class="kpi-data">
            <span class="kpi-label">Muddati Tugagan (Expired)</span>
            <span class="kpi-value">{{ overview()?.expiredSubscriptions || 0 }}</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-warning">⏸️</div>
          <div class="kpi-data">
            <span class="kpi-label">To'xtatilgan (Suspended)</span>
            <span class="kpi-value">{{ overview()?.suspendedSubscriptions || 0 }}</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon icon-blue">🧾</div>
          <div class="kpi-data">
            <span class="kpi-label">To'lov Kutilayotgan</span>
            <span class="kpi-value">{{ overview()?.pendingPaymentSubscriptions || 0 }}</span>
          </div>
        </div>

        <div class="kpi-card highlight-card">
          <div class="kpi-icon icon-emerald">📈</div>
          <div class="kpi-data">
            <span class="kpi-label">MRR (Oylik Doimiy Tushum)</span>
            <span class="kpi-value">{{ formatPrice(overview()?.monthlyRecurringRevenue || 0) }} <small>UZS</small></span>
          </div>
        </div>

        <div class="kpi-card highlight-card">
          <div class="kpi-icon icon-gold">💰</div>
          <div class="kpi-data">
            <span class="kpi-label">Jami To'langan Daromad</span>
            <span class="kpi-value">{{ formatPrice(overview()?.totalRevenue || 0) }} <small>UZS</small></span>
          </div>
        </div>
      </div>

      <!-- Main Navigation Tabs -->
      <div class="tabs-nav">
        <button class="tab-btn" [class.active]="activeTab === 'subscriptions'" (click)="activeTab = 'subscriptions'">
          🏢 Restoranlar Obunalari ({{ filteredSubscriptions().length }})
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'invoices'" (click)="activeTab = 'invoices'; loadInvoices()">
          🧾 Hisob-fakturalar ({{ invoices().length }})
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'plans'" (click)="activeTab = 'plans'; loadPlans()">
          ⚙️ Tariflar Ro'yxati ({{ plans().length }})
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'discounts'" (click)="activeTab = 'discounts'; loadDiscounts()">
          🏷️ Muddat Chegirmalari ({{ discounts().length }})
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'providers'" (click)="activeTab = 'providers'; loadPaymentProviders()">
          💳 To'lov Sozlamalari ({{ providers().length }})
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'requests'" (click)="activeTab = 'requests'; loadSubscriptionRequests()">
          📥 Obuna So'rovlari
          @if (pendingRequestsCount() > 0) {
            <span class="tab-counter-badge">{{ pendingRequestsCount() }}</span>
          }
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'audit'" (click)="activeTab = 'audit'; loadAuditLogs()">
          📜 Audit Jurnali
        </button>
      </div>

      <!-- TAB 1: SUBSCRIPTIONS LIST -->
      @if (activeTab === 'subscriptions') {
        <div class="card table-card">
          <div class="card-header">
            <div class="search-filter-row">
              <input type="text" [(ngModel)]="searchQuery" placeholder="Restoran nomi yoki kodi bo'yicha qidirish..." class="form-control search-input" />
              <div class="filter-pills">
                <span class="filter-pill" [class.active]="statusFilter === 'ALL'" (click)="statusFilter = 'ALL'">Barchasi</span>
                <span class="filter-pill" [class.active]="statusFilter === 'ACTIVE'" (click)="statusFilter = 'ACTIVE'">Faol</span>
                <span class="filter-pill" [class.active]="statusFilter === 'TRIAL'" (click)="statusFilter = 'TRIAL'">Trial</span>
                <span class="filter-pill" [class.active]="statusFilter === 'EXPIRING_SOON'" (click)="statusFilter = 'EXPIRING_SOON'">7 kun qolgan</span>
                <span class="filter-pill" [class.active]="statusFilter === 'EXPIRED'" (click)="statusFilter = 'EXPIRED'">Tugagan</span>
                <span class="filter-pill" [class.active]="statusFilter === 'SUSPENDED'" (click)="statusFilter = 'SUSPENDED'">To'xtatilgan</span>
              </div>
            </div>
          </div>

          @if (loading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Ma'lumotlar yuklanmoqda...</p>
            </div>
          } @else if (filteredSubscriptions().length === 0) {
            <div class="empty-state">
              <p>Mos keluvchi obunalar topilmadi.</p>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Restoran</th>
                    <th>Restoran Statusi</th>
                    <th>Tarif</th>
                    <th>Narxi</th>
                    <th>Obuna Statusi</th>
                    <th>Boshlanish</th>
                    <th>Tugash</th>
                    <th>Qolgan Kun</th>
                    <th>POS Ruxsat</th>
                    <th>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  @for (s of filteredSubscriptions(); track s.id) {
                    <tr>
                      <td>
                        <div class="rest-cell">
                          <strong class="rest-name">{{ s.restaurantName }}</strong>
                          <span class="rest-code">{{ s.restaurantCode }}</span>
                        </div>
                      </td>
                      <td>
                        <span class="badge" [ngClass]="getRestStatusClass(s.restaurantStatus)">
                          {{ s.restaurantStatus }}
                        </span>
                      </td>
                      <td>
                        <span class="plan-tag">{{ s.planName }} ({{ s.planCode }})</span>
                        @if (s.nextPlanName) {
                          <span class="next-plan-tag">→ {{ s.nextPlanName }}</span>
                        }
                      </td>
                      <td class="price-cell">
                        {{ formatPrice(s.price) }} UZS
                      </td>
                      <td>
                        <span class="badge" [ngClass]="getSubStatusClass(s.status)">
                          {{ s.status }}
                        </span>
                      </td>
                      <td>{{ formatDate(s.startDate) }}</td>
                      <td>{{ formatDate(s.endDate) }}</td>
                      <td>
                        <span class="days-pill" [class.danger]="s.daysRemaining <= 0" [class.warning]="s.daysRemaining > 0 && s.daysRemaining <= 3">
                          {{ s.daysRemaining }} kun
                        </span>
                      </td>
                      <td>
                        <span class="access-dot" [class.active]="s.operating" [title]="s.operating ? 'POS Ochiq' : 'POS Cheklangan'"></span>
                        <span class="access-text">{{ s.operating ? 'Ruxsat' : 'Cheklangan' }}</span>
                      </td>
                      <td>
                        <div class="table-actions">
                          @if (s.status === 'SUSPENDED') {
                            <button class="btn btn-sm btn-success" (click)="resumeSubscription(s)" title="Obunani qayta faollashtirish">
                              ⚡ Faollashtirish
                            </button>
                          } @else if (s.status === 'ACTIVE' || s.status === 'TRIAL' || s.status === 'EXPIRING_SOON') {
                            <button class="btn btn-sm btn-warning" (click)="suspendSubscription(s)" title="Obunani vaqtincha to'xtatish">
                              ⏸️ Vaqtincha to'xtatish
                            </button>
                          } @else {
                            <button class="btn btn-sm btn-primary" (click)="openManualActivateModal(s)" title="Obunani faollashtirish">
                              ⚡ Faollashtirish
                            </button>
                          }
                          <a [routerLink]="['/platform/restaurants', s.tenantId]" class="btn btn-sm btn-outline">
                            Ko'rish
                          </a>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      <!-- TAB 2: INVOICES -->
      @if (activeTab === 'invoices') {
        <div class="card table-card">
          <div class="card-header">
            <span class="card-title">Barcha Hisob-fakturalar</span>
            <button class="btn btn-sm btn-outline" (click)="loadInvoices()">Yangilash</button>
          </div>

          @if (invoices().length === 0) {
            <div class="empty-state">
              <p>Hisob-fakturalar mavjud emas.</p>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Hisob-faktura #</th>
                    <th>Restoran</th>
                    <th>Tarif</th>
                    <th>Muddat</th>
                    <th>Asosiy Summa</th>
                    <th>Chegirma</th>
                    <th>Yakuniy Summa</th>
                    <th>Holat</th>
                    <th>Sana</th>
                    <th>Amal</th>
                  </tr>
                </thead>
                <tbody>
                  @for (inv of invoices(); track inv.id) {
                    <tr>
                      <td class="code-cell"><strong>{{ inv.invoiceNumber }}</strong></td>
                      <td>
                        <strong>{{ inv.restaurantName }}</strong> ({{ inv.restaurantCode }})
                      </td>
                      <td>{{ inv.planName }}</td>
                      <td>{{ inv.durationMonths }} oy</td>
                      <td>{{ formatPrice(inv.baseAmount) }} {{ inv.currency }}</td>
                      <td class="text-success">
                        {{ inv.discountPercent > 0 ? '-' + inv.discountPercent + '% (-' + formatPrice(inv.discountAmount) + ')' : '-' }}
                      </td>
                      <td class="amount-cell">{{ formatPrice(inv.finalAmount) }} {{ inv.currency }}</td>
                      <td>
                        <span class="badge" [ngClass]="getInvoiceBadgeClass(inv.status)">
                          {{ inv.status }}
                        </span>
                      </td>
                      <td>{{ formatDate(inv.createdAt) }}</td>
                      <td>
                        @if (inv.status === 'PENDING') {
                          <button class="btn btn-sm btn-success" (click)="markPaid(inv)">
                            ✅ To'langan deb belgilash
                          </button>
                        } @else if (inv.status === 'PAID') {
                          <span class="text-success font-bold">To'langan</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      <!-- TAB 3: PLANS MANAGEMENT -->
      @if (activeTab === 'plans') {
        <div class="card">
          <div class="card-header">
            <span class="card-title">SaaS Tarif Rejalari</span>
            <button class="btn btn-primary" (click)="openNewPlanModal()">➕ Yangi Tarif</button>
          </div>

          <div class="plans-admin-grid">
            @for (p of plans(); track p.id) {
              <div class="plan-card-item" [class.archived]="p.archived">
                <div class="p-header">
                  <div>
                    <h3>{{ p.name }}</h3>
                    <span class="badge badge-purple">{{ p.code }}</span>
                    @if (p.archived) {
                      <span class="badge badge-red">Arxivlangan</span>
                    }
                  </div>
                  <div class="p-price-tag">
                    <strong>{{ formatPrice(p.price) }}</strong> {{ p.currency }} / oy
                    @if (p.yearlyPrice) {
                      <div class="p-yearly-price">{{ formatPrice(p.yearlyPrice) }} {{ p.currency }} / yil</div>
                    }
                  </div>
                </div>

                <p class="p-desc">{{ p.description || 'Tavsif berilmagan' }}</p>

                <div class="p-limits-grid">
                  <div>👥 Xodimlar: <strong>{{ p.maxUsers > 0 ? p.maxUsers : 'Cheksiz' }}</strong></div>
                  <div>🪑 Stollar: <strong>{{ p.maxTables > 0 ? p.maxTables : 'Cheksiz' }}</strong></div>
                  <div>🍔 Mahsulotlar: <strong>{{ p.maxProducts > 0 ? p.maxProducts : 'Cheksiz' }}</strong></div>
                  <div>👨‍🍳 Oshxonalar: <strong>{{ p.maxKitchens > 0 ? p.maxKitchens : 'Cheksiz' }}</strong></div>
                  <div>📱 Qurilmalar: <strong>{{ p.maxDevices > 0 ? p.maxDevices : 'Cheksiz' }}</strong></div>
                  <div>🏢 Filiallar: <strong>{{ p.maxBranches > 0 ? p.maxBranches : 'Cheksiz' }}</strong></div>
                  <div>🧾 Buyurtmalar: <strong>{{ p.maxOrdersPerMonth > 0 ? p.maxOrdersPerMonth : 'Cheksiz' }}</strong></div>
                  <div>✨ Trial: <strong>{{ p.trialEnabled ? p.trialDays + ' kun' : 'Yo‘q' }}</strong></div>
                </div>

                <div class="p-features-list">
                  <span class="feat-tag" *ngFor="let f of p.features">{{ f }}</span>
                </div>

                <div class="p-actions">
                  <button class="btn btn-sm btn-outline" (click)="editPlan(p)">Tahrirlash</button>
                  @if (!p.archived) {
                    <button class="btn btn-sm btn-danger" (click)="archivePlan(p.id)">Arxivlash</button>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- TAB 4: DISCOUNT RULES -->
      @if (activeTab === 'discounts') {
        <div class="card">
          <div class="card-header">
            <div>
              <span class="card-title">Muddat Chegirma Qoidalari</span>
              <p class="card-subtitle">Foydalanuvchi tanlagan oylar soniga qarab tizim mos qoidani qo'llaydi</p>
            </div>
            <button class="btn btn-primary" (click)="openNewDiscountModal()">➕ Yangi Qoida</button>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nomi</th>
                  <th>Minimal Muddat (Oylar)</th>
                  <th>Chegirma Foizi</th>
                  <th>Holat</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                @for (d of discounts(); track d.id) {
                  <tr>
                    <td><strong>{{ d.name }}</strong></td>
                    <td>{{ d.minMonths }} oy</td>
                    <td class="text-success font-bold">{{ d.discountPercent }}%</td>
                    <td>
                      <span class="badge" [class.badge-green]="d.active" [class.badge-red]="!d.active">
                        {{ d.active ? 'Faol' : 'Nofaol' }}
                      </span>
                    </td>
                    <td>
                      <div class="table-actions">
                        <button class="btn btn-sm btn-outline" (click)="editDiscount(d)">Tahrirlash</button>
                        <button class="btn btn-sm btn-danger" (click)="deleteDiscount(d.id!)">O'chirish</button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- TAB 5: AUDIT LOGS -->
      @if (activeTab === 'audit') {
        <div class="card table-card">
          <div class="card-header">
            <span class="card-title">Billing va Obuna Audit Jurnali</span>
            <button class="btn btn-sm btn-outline" (click)="loadAuditLogs()">Yangilash</button>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Vaqt</th>
                  <th>Foydalanuvchi / Rol</th>
                  <th>Restoran</th>
                  <th>Amal (Action)</th>
                  <th>Obyekt</th>
                  <th>Tafsilotlar</th>
                </tr>
              </thead>
              <tbody>
                @for (log of auditLogs(); track log.id) {
                  <tr>
                    <td>{{ formatDate(log.createdAt) }}</td>
                    <td>
                      <strong>{{ log.username }}</strong>
                      <span class="role-badge">{{ log.role }}</span>
                    </td>
                    <td>{{ log.restaurantName }}</td>
                    <td>
                      <span class="action-tag">{{ log.action }}</span>
                    </td>
                    <td class="code-cell">{{ log.entityType }}</td>
                    <td>
                      <small class="details-json">{{ log.details | json }}</small>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- TAB 6: PAYMENT PROVIDERS SETTINGS -->
      @if (activeTab === 'providers') {
        <div class="card table-card">
          <div class="card-header">
            <div>
              <span class="card-title">To'lov Tizimlari Shlyuzlari (Payment Providers)</span>
              <p class="provider-header-subtitle">Restoranlar uchun onlayn to'lov tizimlarini faollashtirish va API kalitlarini sozlash</p>
            </div>
            <button class="btn btn-sm btn-outline" (click)="loadPaymentProviders()">Yangilash</button>
          </div>

          <div class="providers-container">
            @for (provider of providers(); track provider.id) {
              <div class="provider-card" [class.provider-enabled]="provider.enabled">
                <div class="provider-card-header">
                  <div class="provider-title-wrap">
                    <div class="provider-logo-icon">
                      @if (provider.providerCode === 'MOCK') { 🧪 }
                      @else if (provider.providerCode === 'PAYME') { 🔵 }
                      @else if (provider.providerCode === 'CLICK') { 🟡 }
                      @else if (provider.providerCode === 'UZCARD') { 💳 }
                      @else if (provider.providerCode === 'HUMO') { 🟢 }
                      @else { 💳 }
                    </div>
                    <div>
                      <h3 class="provider-title">{{ provider.displayName }}</h3>
                      <span class="provider-code-tag">{{ provider.providerCode }}</span>
                    </div>
                  </div>

                  <div class="provider-header-badges">
                    <span class="provider-status-badge" [class.badge-active]="provider.enabled" [class.badge-disabled]="!provider.enabled">
                      {{ provider.enabled ? 'Faol (Yoqilgan)' : 'O\'chirilgan' }}
                    </span>
                    <span class="provider-mode-badge" [class.mode-test]="provider.testMode" [class.mode-live]="!provider.testMode">
                      {{ provider.testMode ? 'Test Rejimi' : 'Ishchi (Live)' }}
                    </span>
                  </div>
                </div>

                <div class="provider-card-body">
                  <div class="provider-toggles-row">
                    <label class="toggle-control">
                      <input type="checkbox" [(ngModel)]="provider.enabled" />
                      <span>Shlyuzni yoqish (Enable)</span>
                    </label>

                    <label class="toggle-control">
                      <input type="checkbox" [(ngModel)]="provider.testMode" />
                      <span>Test / Sandbox rejimi</span>
                    </label>
                  </div>

                  <div class="form-grid-2">
                    <div class="form-group">
                      <label>Ko'rsatiladigan nom:</label>
                      <input type="text" [(ngModel)]="provider.displayName" class="form-control" />
                    </div>

                    <div class="form-group">
                      <label>Merchant / Service ID:</label>
                      <input type="text" [(ngModel)]="provider.merchantId" class="form-control" placeholder="ID raqami..." />
                    </div>
                  </div>

                  <div class="form-grid-2">
                    <div class="form-group">
                      <label>API Kalit (Public / Secret Key):</label>
                      <input type="text" [(ngModel)]="providerApiKeys[provider.id]" class="form-control" [placeholder]="provider.maskedApiKey || 'Yangi API kalit kiriting...'" />
                      @if (provider.hasApiKey && !providerApiKeys[provider.id]) {
                        <span class="key-hint text-success">✓ Kalit o'rnatilgan: {{ provider.maskedApiKey }}</span>
                      }
                    </div>

                    <div class="form-group">
                      <label>Yashirin Kalit (Secret Key):</label>
                      <input type="password" [(ngModel)]="providerSecretKeys[provider.id]" class="form-control" [placeholder]="provider.maskedSecretKey || 'Yangi yashirin kalit kiriting...'" />
                      @if (provider.hasSecretKey && !providerSecretKeys[provider.id]) {
                        <span class="key-hint text-success">✓ Yashirin kalit o'rnatilgan: {{ provider.maskedSecretKey }}</span>
                      }
                    </div>
                  </div>

                  <div class="form-group">
                    <label>Callback / Webhook URL:</label>
                    <input type="text" [(ngModel)]="provider.callbackUrl" class="form-control" placeholder="https://api.domain.com/api/billing/webhook/..." />
                  </div>

                  <div class="form-group">
                    <label>Tavsif yoki yo'riqnoma:</label>
                    <textarea [(ngModel)]="provider.description" class="form-control" rows="2" placeholder="To'lov tizimi haqida eslatma..."></textarea>
                  </div>

                  <div class="provider-card-footer">
                    @if (providerSaveStatus[provider.id]) {
                      <span class="save-status-msg" [class.success]="providerSaveStatus[provider.id].success" [class.error]="!providerSaveStatus[provider.id].success">
                        {{ providerSaveStatus[provider.id].msg }}
                      </span>
                    }
                    <button class="btn btn-primary btn-sm" [disabled]="savingProviderId === provider.id" (click)="saveProviderSettings(provider)">
                      {{ savingProviderId === provider.id ? 'Saqlanmoqda...' : '💾 Sozlamalarni Saqlash' }}
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- TAB: SUBSCRIPTION REQUESTS (B2B APPROVAL ENGINE) -->
      @if (activeTab === 'requests') {
        <div class="card table-card">
          <div class="card-header">
            <div class="search-filter-row">
              <input type="text" [(ngModel)]="requestSearchQuery" placeholder="Restoran nomi yoki kodi bo'yicha qidirish..." class="form-control search-input" />
              <div class="filter-pills">
                <span class="filter-pill" [class.active]="requestStatusFilter === 'ALL'" (click)="setRequestFilter('ALL')">
                  Barchasi ({{ requests().length }})
                </span>
                <span class="filter-pill" [class.active]="requestStatusFilter === 'PENDING_APPROVAL'" (click)="setRequestFilter('PENDING_APPROVAL')">
                  Kutilmoqda ({{ pendingRequestsCount() }})
                </span>
                <span class="filter-pill" [class.active]="requestStatusFilter === 'APPROVED'" (click)="setRequestFilter('APPROVED')">
                  Tasdiqlangan
                </span>
                <span class="filter-pill" [class.active]="requestStatusFilter === 'REJECTED'" (click)="setRequestFilter('REJECTED')">
                  Rad etilgan
                </span>
                <span class="filter-pill" [class.active]="requestStatusFilter === 'CANCELLED'" (click)="setRequestFilter('CANCELLED')">
                  Bekor qilingan
                </span>
              </div>
            </div>
            <button class="btn btn-outline btn-sm" (click)="loadSubscriptionRequests()">🔄 Yangilash</button>
          </div>

          @if (loadingRequests()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Arizalar yuklanmoqda...</p>
            </div>
          } @else if (filteredRequests().length === 0) {
            <div class="empty-state">
              <p>Belgilangan filtr bo'yicha arizalar topilmadi.</p>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Restoran</th>
                    <th>Tanlangan Tarif</th>
                    <th>Muddat</th>
                    <th>Summa</th>
                    <th>To'lov Usuli</th>
                    <th>To'lov Cheki</th>
                    <th>Yuborilgan Vaqt</th>
                    <th>Holat</th>
                    <th>Izoh / Tafsilot</th>
                    <th>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  @for (req of filteredRequests(); track req.id) {
                    <tr>
                      <td>
                        <div class="tenant-cell">
                          <strong>{{ req.tenantName }}</strong>
                          <span class="code-badge">{{ req.tenantCode }}</span>
                        </div>
                      </td>
                      <td>
                        <strong>{{ req.planName }}</strong>
                        <span class="code-badge">{{ req.planCode }}</span>
                      </td>
                      <td>{{ req.durationMonths }} oy</td>
                      <td class="amount-cell">{{ formatPrice(req.amount) }} {{ req.currency }}</td>
                      <td>
                        <span class="provider-badge">{{ getPaymentMethodLabel(req.paymentMethod) }}</span>
                      </td>
                      <td>
                        @if (req.receiptUrl) {
                          <button class="btn btn-xs btn-outline" (click)="viewReceipt(req.receiptUrl)">
                            📎 Chekni ko'rish
                          </button>
                        } @else {
                          <span class="text-muted">Chek yuklanmagan</span>
                        }
                      </td>
                      <td>{{ formatDate(req.createdAt) }}</td>
                      <td>
                        <span class="status-badge" [ngClass]="getRequestStatusBadge(req.status)">
                          {{ getRequestStatusLabel(req.status) }}
                        </span>
                      </td>
                      <td>
                        @if (req.clientNotes) {
                          <div class="note-text"><small class="text-muted">Mijoz:</small> {{ req.clientNotes }}</div>
                        }
                        @if (req.adminNotes) {
                          <div class="note-text text-success"><small>Admin:</small> {{ req.adminNotes }}</div>
                        }
                        @if (req.rejectionReason) {
                          <div class="note-text text-danger"><small>Rad:</small> {{ req.rejectionReason }}</div>
                        }
                        @if (req.reviewedByUsername) {
                          <div class="note-text"><small class="text-muted">Ko'rgan:</small> {{ req.reviewedByUsername }}</div>
                        }
                      </td>
                      <td>
                        <div class="action-btn-group">
                          @if (req.status === 'PENDING_APPROVAL') {
                            <button class="btn btn-sm btn-success" (click)="openApproveModal(req)">
                              ✅ Tasdiqlash
                            </button>
                            <button class="btn btn-sm btn-danger" (click)="openRejectModal(req)">
                              ❌ Rad etish
                            </button>
                          } @else {
                            <span class="text-muted">-</span>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      <!-- MODAL: MANUAL SUBSCRIPTION ACTIVATION -->
      @if (showManualModal) {
        <div class="modal-overlay" (click)="showManualModal = false">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Qo'lda Obuna Faollashtirish (Super Admin)</h2>
              <button class="btn-close" (click)="showManualModal = false">✕</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label>Restoran:</label>
                <select [(ngModel)]="manualReq.tenantId" class="form-control">
                  <option [ngValue]="null">-- Tanlang --</option>
                  @for (s of overview()?.subscriptions || []; track s.tenantId) {
                    <option [value]="s.tenantId">{{ s.restaurantName }} ({{ s.restaurantCode }})</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Tarif Rejasi:</label>
                <select [(ngModel)]="manualReq.planCode" class="form-control">
                  @for (p of plans(); track p.code) {
                    <option [value]="p.code">{{ p.name }} ({{ formatPrice(p.price) }} UZS)</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Muddat (Oylar soni):</label>
                <input type="number" [(ngModel)]="manualReq.months" min="1" max="60" class="form-control" />
              </div>

              <div class="form-group">
                <label>Chegirma foizi (%):</label>
                <input type="number" [(ngModel)]="manualReq.discountPercent" min="0" max="100" class="form-control" />
              </div>

              <div class="form-group">
                <label>Qo'shimcha sozlash (Adjustment summasi):</label>
                <input type="number" [(ngModel)]="manualReq.adjustmentAmount" class="form-control" placeholder="Masalan: -50000 yoki 20000" />
              </div>

              <div class="form-group">
                <label>Izoh (Admin Note):</label>
                <textarea [(ngModel)]="manualReq.notes" class="form-control" rows="3" placeholder="Naqd qabul qilindi yoki boshqa sabab..."></textarea>
              </div>

              <div class="modal-actions">
                <button class="btn btn-outline" (click)="showManualModal = false">Bekor qilish</button>
                <button class="btn btn-primary" (click)="submitManualActivate()">Faollashtirish</button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: PLAN CREATE / EDIT -->
      @if (showPlanModal) {
        <div class="modal-overlay" (click)="showPlanModal = false">
          <div class="modal-card wide-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editingPlanId ? 'Tarifni Tahrirlash' : 'Yangi Tarif Yaratish' }}</h2>
              <button class="btn-close" (click)="showPlanModal = false">✕</button>
            </div>

            <div class="modal-body">
              <div class="form-row">
                <div class="form-group">
                  <label>Tarif Nomi:</label>
                  <input type="text" [(ngModel)]="planForm.name" class="form-control" placeholder="Masalan: Business Pro" />
                </div>
                <div class="form-group">
                  <label>Kod (Slug):</label>
                  <input type="text" [(ngModel)]="planForm.code" [disabled]="!!editingPlanId" class="form-control" placeholder="BUSINESS_PRO" />
                </div>
              </div>

              <div class="form-group">
                <label>Tavsif:</label>
                <textarea [(ngModel)]="planForm.description" class="form-control" rows="2"></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Oylik Narx (UZS):</label>
                  <input type="number" [(ngModel)]="planForm.price" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Yillik Narx (UZS):</label>
                  <input type="number" [(ngModel)]="planForm.yearlyPrice" class="form-control" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Trial Davri mavjudmi:</label>
                  <select [(ngModel)]="planForm.trialEnabled" class="form-control">
                    <option [ngValue]="true">Ha</option>
                    <option [ngValue]="false">Yo'q</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Trial kunlari:</label>
                  <input type="number" [(ngModel)]="planForm.trialDays" class="form-control" />
                </div>
              </div>

              <h4>Resurs Limitlari (-1 = Cheksiz, 0 = O'chirilgan)</h4>
              <div class="form-grid-3">
                <div class="form-group">
                  <label>Maksimal Xodimlar:</label>
                  <input type="number" [(ngModel)]="planForm.maxUsers" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Maksimal Stollar:</label>
                  <input type="number" [(ngModel)]="planForm.maxTables" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Maksimal Mahsulotlar:</label>
                  <input type="number" [(ngModel)]="planForm.maxProducts" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Maksimal Oshxonalar:</label>
                  <input type="number" [(ngModel)]="planForm.maxKitchens" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Maksimal Qurilmalar:</label>
                  <input type="number" [(ngModel)]="planForm.maxDevices" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Maksimal Filiallar:</label>
                  <input type="number" [(ngModel)]="planForm.maxBranches" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Oylik Buyurtmalar:</label>
                  <input type="number" [(ngModel)]="planForm.maxOrdersPerMonth" class="form-control" />
                </div>
              </div>

              <h4>Funksiyalar (Feature Permissions)</h4>
              <div class="features-checkbox-grid">
                <label *ngFor="let feat of allFeatureOptions" class="checkbox-label">
                  <input type="checkbox" [checked]="hasFeature(feat)" (change)="toggleFeature(feat)" />
                  {{ feat }}
                </label>
              </div>

              <div class="modal-actions">
                <button class="btn btn-outline" (click)="showPlanModal = false">Bekor qilish</button>
                <button class="btn btn-primary" (click)="savePlanSubmit()">Saqlash</button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: DISCOUNT RULE CREATE / EDIT -->
      @if (showDiscountModal) {
        <div class="modal-overlay" (click)="showDiscountModal = false">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editingDiscountId ? 'Chegirmani Tahrirlash' : 'Yangi Chegirma Qoidasi' }}</h2>
              <button class="btn-close" (click)="showDiscountModal = false">✕</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label>Qoida Nomi:</label>
                <input type="text" [(ngModel)]="discountForm.name" class="form-control" placeholder="6 oylik chegirma" />
              </div>
              <div class="form-group">
                <label>Minimal Muddat (Oylar soni):</label>
                <input type="number" [(ngModel)]="discountForm.minMonths" min="1" class="form-control" />
              </div>
              <div class="form-group">
                <label>Chegirma Foizi (%):</label>
                <input type="number" [(ngModel)]="discountForm.discountPercent" min="0" max="100" class="form-control" />
              </div>
              <div class="form-group">
                <label>Holat:</label>
                <select [(ngModel)]="discountForm.active" class="form-control">
                  <option [ngValue]="true">Faol</option>
                  <option [ngValue]="false">Nofaol</option>
                </select>
              </div>

              <div class="modal-actions">
                <button class="btn btn-outline" (click)="showDiscountModal = false">Bekor qilish</button>
                <button class="btn btn-primary" (click)="saveDiscountSubmit()">Saqlash</button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: APPROVE SUBSCRIPTION REQUEST -->
      @if (showApproveModal && selectedApproveRequest) {
        <div class="modal-overlay" (click)="showApproveModal = false">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>✅ Obuna So'rovini Tasdiqlash va Faollashtirish</h2>
              <button class="btn-close" (click)="showApproveModal = false">✕</button>
            </div>

            <div class="modal-body">
              <div class="request-summary-box">
                <div class="rs-row">
                  <span>Restoran:</span>
                  <strong>{{ selectedApproveRequest.tenantName }} ({{ selectedApproveRequest.tenantCode }})</strong>
                </div>
                <div class="rs-row">
                  <span>Tanlangan Tarif:</span>
                  <strong>{{ selectedApproveRequest.planName }} ({{ selectedApproveRequest.planCode }})</strong>
                </div>
                <div class="rs-row">
                  <span>Asosiy Muddat:</span>
                  <span>{{ selectedApproveRequest.durationMonths }} oy</span>
                </div>
                <div class="rs-row">
                  <span>To'lov Summasi:</span>
                  <strong>{{ formatPrice(selectedApproveRequest.amount) }} {{ selectedApproveRequest.currency }}</strong>
                </div>
                <div class="rs-row">
                  <span>To'lov Usuli:</span>
                  <span class="provider-badge">{{ getPaymentMethodLabel(selectedApproveRequest.paymentMethod) }}</span>
                </div>
                @if (selectedApproveRequest.receiptUrl) {
                  <div class="rs-row">
                    <span>To'lov Cheki:</span>
                    <button class="btn btn-xs btn-outline" (click)="viewReceipt(selectedApproveRequest.receiptUrl)">
                      📎 Chekni Ko'rish
                    </button>
                  </div>
                }
                @if (selectedApproveRequest.clientNotes) {
                  <div class="rs-row">
                    <span>Mijoz Izohi:</span>
                    <em>{{ selectedApproveRequest.clientNotes }}</em>
                  </div>
                }
              </div>

              <div class="form-group" style="margin-top: 16px;">
                <label>Sovg'a / Bonus Kunlar (Ixtiyoriy):</label>
                <input type="number" [(ngModel)]="customBonusDays" min="0" max="365" class="form-control" placeholder="0" />
                <small class="text-muted">Masalan: 5 kun qo'shilsa, obuna muddati +5 kunga ko'proq beriladi</small>
              </div>

              <div class="form-group">
                <label>Admin Izohi / Qayd (Ixtiyoriy):</label>
                <input type="text" [(ngModel)]="adminApproveNotes" class="form-control" placeholder="Masalan: Ipoteka bank orqali to'lov to'liq tushdi" />
              </div>

              <div class="modal-actions">
                <button class="btn btn-outline" (click)="showApproveModal = false">Bekor qilish</button>
                <button class="btn btn-success" [disabled]="approvingRequest" (click)="submitApproveRequest()">
                  {{ approvingRequest ? 'Faollashtirilmoqda...' : '✅ Tasdiqlash va Faollashtirish' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: REJECT SUBSCRIPTION REQUEST -->
      @if (showRejectModal && selectedRejectRequest) {
        <div class="modal-overlay" (click)="showRejectModal = false">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>❌ Obuna So'rovini Rad Etish</h2>
              <button class="btn-close" (click)="showRejectModal = false">✕</button>
            </div>

            <div class="modal-body">
              <p>
                <strong>{{ selectedRejectRequest.tenantName }}</strong> restoranining 
                <strong>{{ selectedRejectRequest.planName }}</strong> tarifiga bergan arizasi rad etilmoqda.
              </p>

              <div class="form-group">
                <label>Rad Etish Sababi (Mijozga ko'rsatiladi):</label>
                <textarea [(ngModel)]="rejectReason" class="form-control" rows="3" placeholder="Masalan: To'lov cheki bo'yicha mablag' hisob raqamimizga tushmadi..."></textarea>
              </div>

              <div class="modal-actions">
                <button class="btn btn-outline" (click)="showRejectModal = false">Bekor qilish</button>
                <button class="btn btn-danger" [disabled]="rejectingRequest || !rejectReason.trim()" (click)="submitRejectRequest()">
                  {{ rejectingRequest ? 'Rad etilmoqda...' : '❌ Rad Etishni Tasdiqlash' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- MODAL: VIEW RECEIPT IMAGE -->
      @if (showReceiptModal) {
        <div class="modal-overlay" (click)="showReceiptModal = false">
          <div class="modal-card modal-receipt-viewer" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>📎 To'lov Cheki / Kvitansiya</h2>
              <button class="btn-close" (click)="showReceiptModal = false">✕</button>
            </div>
            <div class="modal-body text-center" style="padding: 16px;">
              <img [src]="receiptModalUrl" alt="Payment Receipt" style="max-width: 100%; max-height: 550px; border-radius: 8px; object-fit: contain; box-shadow: 0 4px 12px rgba(0,0,0,0.5);" />
              <div style="margin-top: 14px;">
                <a [href]="receiptModalUrl" target="_blank" class="btn btn-outline btn-sm">Yangi oynada ochish ↗</a>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .platform-subs-page {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
      color: var(--text-primary, #f8fafc);
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;

      .page-title { font-size: 26px; font-weight: 800; margin-bottom: 4px; }
      .page-subtitle { font-size: 14px; color: var(--text-secondary, #94a3b8); }
    }

    .header-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
      margin-bottom: 24px;
    }

    .kpi-card {
      background: var(--bg-secondary, #1e293b);
      border: 1px solid var(--border, #334155);
      border-radius: 12px;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 14px;

      .kpi-icon {
        width: 40px; height: 40px;
        border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        font-size: 20px;
        background: rgba(255,255,255,0.06);
      }

      .kpi-data {
        display: flex;
        flex-direction: column;

        .kpi-label { font-size: 11px; color: var(--text-secondary, #94a3b8); font-weight: 500; }
        .kpi-value { font-size: 18px; font-weight: 800; color: white; }
      }

      &.highlight-card {
        border-color: rgba(99, 102, 241, 0.4);
        background: linear-gradient(135deg, rgba(30, 41, 59, 1), rgba(15, 23, 42, 1));
      }
    }

    .tabs-nav {
      display: flex;
      gap: 8px;
      margin-bottom: 18px;
      flex-wrap: wrap;

      .tab-btn {
        padding: 10px 18px;
        background: var(--bg-secondary, #1e293b);
        border: 1px solid var(--border, #334155);
        color: var(--text-secondary, #94a3b8);
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;

        &:hover { color: white; border-color: #6366f1; }
        &.active {
          background: #6366f1;
          color: white;
          border-color: #6366f1;
        }
      }
    }

    .card {
      background: var(--bg-secondary, #1e293b);
      border: 1px solid var(--border, #334155);
      border-radius: 14px;
      padding: 20px;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--border, #334155);

        .card-title { font-size: 16px; font-weight: 700; }
        .card-subtitle { font-size: 12px; color: var(--text-muted, #64748b); margin: 2px 0 0 0; }
      }
    }

    .search-filter-row {
      display: flex;
      gap: 16px;
      align-items: center;
      width: 100%;
      flex-wrap: wrap;

      .search-input {
        max-width: 350px;
      }

      .filter-pills {
        display: flex;
        gap: 6px;

        .filter-pill {
          padding: 6px 12px;
          border-radius: 9999px;
          font-size: 12px;
          background: rgba(255,255,255,0.05);
          cursor: pointer;
          color: var(--text-secondary, #94a3b8);

          &:hover { color: white; }
          &.active { background: #6366f1; color: white; }
        }
      }
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;

      th, td {
        padding: 12px 14px;
        text-align: left;
        border-bottom: 1px solid var(--border, #334155);
      }

      th {
        color: var(--text-muted, #64748b);
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
      }

      .rest-cell {
        display: flex;
        flex-direction: column;
        .rest-name { font-weight: 700; }
        .rest-code { font-size: 11px; color: var(--text-muted, #64748b); }
      }

      .plan-tag {
        font-weight: 600;
        color: #818cf8;
      }

      .next-plan-tag {
        font-size: 11px;
        color: #f59e0b;
        display: block;
      }

      .days-pill {
        padding: 2px 8px;
        border-radius: 4px;
        background: rgba(255,255,255,0.05);
        font-size: 12px;
        font-weight: 600;

        &.warning { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
        &.danger { background: rgba(239, 68, 68, 0.2); color: #f87171; }
      }

      .access-dot {
        display: inline-block;
        width: 8px; height: 8px;
        border-radius: 50%;
        background: #ef4444;
        margin-right: 6px;

        &.active { background: #10b981; }
      }

      .access-text { font-size: 12px; }

      .table-actions {
        display: flex;
        gap: 6px;
      }
    }

    .badge {
      display: inline-flex;
      padding: 3px 8px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;

      &-green { background: rgba(16, 185, 129, 0.15); color: #34d399; }
      &-amber { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
      &-red { background: rgba(239, 68, 68, 0.15); color: #f87171; }
      &-purple { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
      &-gray { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }
    }

    .plans-admin-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;

      .plan-card-item {
        background: var(--bg-primary, #0f172a);
        border: 1px solid var(--border, #334155);
        border-radius: 12px;
        padding: 16px;

        &.archived {
          opacity: 0.6;
          border-style: dashed;
        }

        .p-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;

          h3 { font-size: 16px; font-weight: 700; margin: 0 0 4px 0; }
          .p-price-tag {
            text-align: right;
            font-size: 14px;
            .p-yearly-price { font-size: 11px; color: var(--text-muted, #64748b); }
          }
        }

        .p-desc { font-size: 12px; color: var(--text-secondary, #94a3b8); margin-bottom: 12px; }

        .p-limits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          font-size: 12px;
          margin-bottom: 12px;
          background: rgba(255,255,255,0.02);
          padding: 8px;
          border-radius: 6px;
        }

        .p-features-list {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-bottom: 14px;

          .feat-tag {
            font-size: 10px;
            background: rgba(99, 102, 241, 0.15);
            color: #818cf8;
            padding: 2px 6px;
            border-radius: 4px;
          }
        }

        .p-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
      }
    }

    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
      overflow-y: auto;
    }

    .modal-card {
      background: var(--bg-secondary, #1e293b);
      border: 1px solid var(--border, #334155);
      border-radius: 16px;
      width: 100%;
      max-width: 580px;
      padding: 24px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);
      margin: auto;

      &.wide-modal {
        max-width: 800px;
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      h2 { font-size: 18px; font-weight: 700; margin: 0; }
      .btn-close {
        background: transparent; border: none;
        color: var(--text-secondary, #94a3b8); font-size: 18px; cursor: pointer;
        &:hover { color: white; }
      }
    }

    .modal-body {
      overflow-y: auto;
      max-height: calc(85vh - 80px);
    }

    .form-group {
      margin-bottom: 14px;
      label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .form-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }

    .features-checkbox-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 16px;

      .checkbox-label {
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
      }
    }

    .form-control {
      width: 100%;
      padding: 8px 12px;
      background: var(--bg-primary, #0f172a);
      border: 1px solid var(--border, #334155);
      border-radius: 6px;
      color: white;
      font-size: 13px;
      box-sizing: border-box;

      &:focus { border-color: #6366f1; outline: none; }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }

    .btn {
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1px solid transparent;

      &-primary { background: #6366f1; color: white; &:hover { background: #4f46e5; } }
      &-warning { background: #f59e0b; color: #1e1b4b; font-weight: 700; &:hover { background: #d97706; } }
      &-success { background: #10b981; color: white; &:hover { background: #059669; } }
      &-danger { background: #ef4444; color: white; &:hover { background: #dc2626; } }
      &-outline { background: transparent; border-color: var(--border, #334155); color: var(--text-primary, #f8fafc); }
      &-sm { padding: 4px 10px; font-size: 12px; }
    }

    .role-badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      margin-left: 6px;
    }

    .action-tag {
      font-family: monospace;
      font-size: 12px;
      font-weight: 600;
      color: #38bdf8;
    }

    .details-json {
      color: var(--text-muted, #94a3b8);
      max-width: 250px;
      display: inline-block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .provider-header-subtitle {
      font-size: 13px;
      color: var(--text-muted, #64748b);
      margin: 4px 0 0 0;
    }

    .providers-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
      gap: 20px;
      padding: 16px;

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }

    .provider-card {
      background: var(--bg-primary, #0f172a);
      border: 1px solid var(--border, #334155);
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.2s ease;

      &.provider-enabled {
        border-color: rgba(99, 102, 241, 0.4);
      }

      .provider-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background: rgba(255, 255, 255, 0.02);
        border-bottom: 1px solid var(--border, #334155);
      }

      .provider-title-wrap {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .provider-logo-icon {
        font-size: 26px;
      }

      .provider-title {
        font-size: 16px;
        font-weight: 700;
        margin: 0 0 2px 0;
      }

      .provider-code-tag {
        font-size: 11px;
        font-family: monospace;
        color: var(--text-muted, #94a3b8);
        background: rgba(255, 255, 255, 0.05);
        padding: 2px 6px;
        border-radius: 4px;
      }

      .provider-header-badges {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
      }

      .provider-status-badge {
        font-size: 10px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 9999px;
        text-transform: uppercase;

        &.badge-active { background: rgba(16, 185, 129, 0.15); color: #34d399; }
        &.badge-disabled { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }
      }

      .provider-mode-badge {
        font-size: 10px;
        font-weight: 600;
        padding: 1px 6px;
        border-radius: 4px;

        &.mode-test { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
        &.mode-live { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
      }

      .provider-card-body {
        padding: 16px;
      }

      .provider-toggles-row {
        display: flex;
        gap: 20px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }

      .toggle-control {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        cursor: pointer;
        user-select: none;
      }

      .form-grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;

        @media (max-width: 500px) {
          grid-template-columns: 1fr;
        }
      }

      .key-hint {
        display: block;
        font-size: 11px;
        margin-top: 4px;
        font-family: monospace;
      }

      .provider-card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);

        .save-status-msg {
          font-size: 12px;
          font-weight: 600;

          &.success { color: #10b981; }
          &.error { color: #ef4444; }
        }
      }
    }

    .text-success { color: #10b981; }
    .font-bold { font-weight: 700; }

    .tab-counter-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: 9999px;
      background: #f59e0b;
      color: #1e1b4b;
      font-size: 11px;
      font-weight: 800;
      margin-left: 6px;
    }

    .tenant-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .action-btn-group {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .btn-success {
      background: #10b981;
      color: white;
      border: none;
      &:hover { background: #059669; }
    }

    .btn-danger {
      background: #ef4444;
      color: white;
      border: none;
      &:hover { background: #dc2626; }
    }

    .request-summary-box {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid var(--border, #334155);
      border-radius: 10px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .rs-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
        span:first-child { color: var(--text-muted, #94a3b8); }
      }
    }

    .note-text {
      font-size: 12px;
      line-height: 1.3;
      margin-bottom: 2px;
    }

    .modal-receipt-viewer {
      max-width: 650px;
    }
  `]
})
export class PlatformSubscriptionsComponent implements OnInit {
  private billingService = inject(BillingService);

  overview = signal<PlatformSubscriptionOverview | null>(null);
  invoices = signal<InvoiceResponse[]>([]);
  plans = signal<PlanResponse[]>([]);
  discounts = signal<DiscountRuleDto[]>([]);
  auditLogs = signal<AuditLogResponse[]>([]);
  providers = signal<PaymentProviderSettingResponse[]>([]);
  loading = signal(true);

  activeTab: 'subscriptions' | 'invoices' | 'plans' | 'discounts' | 'audit' | 'providers' | 'requests' = 'subscriptions';
  searchQuery = '';
  statusFilter = 'ALL';

  // Subscription Requests state
  requests = signal<SubscriptionRequestResponse[]>([]);
  pendingRequestsCount = signal<number>(0);
  loadingRequests = signal<boolean>(false);
  requestSearchQuery = '';
  requestStatusFilter = 'ALL';

  showApproveModal = false;
  selectedApproveRequest: SubscriptionRequestResponse | null = null;
  customBonusDays = 0;
  adminApproveNotes = '';
  approvingRequest = false;

  showRejectModal = false;
  selectedRejectRequest: SubscriptionRequestResponse | null = null;
  rejectReason = '';
  rejectingRequest = false;

  showReceiptModal = false;
  receiptModalUrl = '';

  // Providers settings state
  providerApiKeys: { [key: string]: string } = {};
  providerSecretKeys: { [key: string]: string } = {};
  providerSaveStatus: { [key: string]: { success: boolean; msg: string } } = {};
  savingProviderId: string | null = null;

  // Manual activate modal
  showManualModal = false;
  manualReq: ManualActivationRequest = {
    tenantId: '',
    planCode: 'STANDARD',
    months: 6,
    discountPercent: 10,
    adjustmentAmount: 0,
    notes: 'Qo\'lda to\'lov tasdiqlandi'
  };

  // Plan modal
  showPlanModal = false;
  editingPlanId: string | null = null;
  planForm: PlanSaveRequest = this.getEmptyPlanForm();

  readonly allFeatureOptions = [
    'POS', 'KITCHEN', 'INVENTORY', 'RECIPES', 'REPORTS', 'ADVANCED_REPORTS',
    'OWNER_APP', 'WAITER_APP', 'API_ACCESS', 'MULTI_BRANCH', 'MOBILE_APP', 'KITCHEN_DISPLAY'
  ];

  // Discount modal
  showDiscountModal = false;
  editingDiscountId: string | null = null;
  discountForm: DiscountRuleDto = {
    minMonths: 3,
    discountPercent: 5,
    name: '3 oylik chegirma',
    active: true
  };

  ngOnInit(): void {
    this.refreshAll();
  }

  refreshAll(): void {
    this.loadOverview();
    this.loadInvoices();
    this.loadPlans();
    this.loadDiscounts();
    this.loadAuditLogs();
    this.loadPaymentProviders();
    this.loadPendingRequestsCount();
    this.loadSubscriptionRequests();
  }

  loadPaymentProviders(): void {
    this.billingService.getPaymentProviderSettings().subscribe({
      next: (items) => this.providers.set(items),
      error: () => {}
    });
  }

  saveProviderSettings(provider: PaymentProviderSettingResponse): void {
    this.savingProviderId = provider.id;
    this.providerSaveStatus[provider.id] = { success: false, msg: '' };

    const req: PaymentProviderSettingUpdateRequest = {
      displayName: provider.displayName,
      enabled: provider.enabled,
      testMode: provider.testMode,
      merchantId: provider.merchantId,
      callbackUrl: provider.callbackUrl,
      description: provider.description,
      apiKey: this.providerApiKeys[provider.id] || undefined,
      secretKey: this.providerSecretKeys[provider.id] || undefined
    };

    this.billingService.updatePaymentProviderSetting(provider.id, req).subscribe({
      next: () => {
        this.savingProviderId = null;
        this.providerSaveStatus[provider.id] = { success: true, msg: '✓ Sozlamalar muvaffaqiyatli saqlandi!' };
        this.providerApiKeys[provider.id] = '';
        this.providerSecretKeys[provider.id] = '';
        this.loadPaymentProviders();
        setTimeout(() => {
          delete this.providerSaveStatus[provider.id];
        }, 3500);
      },
      error: (err) => {
        this.savingProviderId = null;
        this.providerSaveStatus[provider.id] = { success: false, msg: err?.error?.message || 'Saqlashda xatolik yuz berdi' };
      }
    });
  }

  loadOverview(): void {
    this.loading.set(true);
    this.billingService.getPlatformOverview().subscribe({
      next: (data) => {
        this.overview.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadInvoices(): void {
    this.billingService.getPlatformInvoices().subscribe({
      next: (items) => this.invoices.set(items)
    });
  }

  loadPlans(): void {
    this.billingService.getPlatformPlans().subscribe({
      next: (items) => this.plans.set(items)
    });
  }

  loadDiscounts(): void {
    this.billingService.getDiscountRules().subscribe({
      next: (items) => this.discounts.set(items)
    });
  }

  loadAuditLogs(): void {
    this.billingService.getAuditLogs().subscribe({
      next: (items) => this.auditLogs.set(items)
    });
  }

  filteredSubscriptions(): TenantSubscriptionSummary[] {
    const list = this.overview()?.subscriptions || [];
    return list.filter(s => {
      const matchQuery = !this.searchQuery ||
        s.restaurantName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        s.restaurantCode.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchStatus = this.statusFilter === 'ALL' ||
        (this.statusFilter === 'EXPIRING_SOON' ? s.daysRemaining <= 7 && s.daysRemaining > 0 : s.status === this.statusFilter);

      return matchQuery && matchStatus;
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('uz-UZ').format(price || 0);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '-';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}.${month}.${year}, ${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
  }

  getRestStatusClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'badge-green';
      case 'PENDING': return 'badge-amber';
      case 'SUSPENDED': return 'badge-red';
      default: return 'badge-gray';
    }
  }

  getSubStatusClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'badge-green';
      case 'TRIAL': return 'badge-amber';
      case 'EXPIRING_SOON': return 'badge-amber';
      case 'EXPIRED': return 'badge-red';
      case 'SUSPENDED': return 'badge-red';
      case 'PENDING_PAYMENT': return 'badge-gray';
      default: return 'badge-gray';
    }
  }

  getInvoiceBadgeClass(status: string): string {
    switch (status) {
      case 'PAID': return 'badge-green';
      case 'PENDING': return 'badge-amber';
      case 'CANCELLED': return 'badge-red';
      default: return 'badge-gray';
    }
  }

  // Action: Suspend Subscription (Vaqtincha to'xtatish)
  suspendSubscription(s: TenantSubscriptionSummary): void {
    const reason = prompt(
      `"${s.restaurantName}" obunasini vaqtincha to'xtatishni tasdiqlaysizmi?\n\n` +
      `Eslatma: Restoran foydalanuvchilarining POS tizimiga kirishi va yangi buyurtma olishi to'xtatiladi.\n\n` +
      `Sabab (ixtiyoriy):`,
      'Platforma ma\'muriyati tomonidan vaqtincha to\'xtatildi'
    );
    if (reason === null) return;

    this.billingService.suspendSubscription(s.id, reason).subscribe({
      next: () => {
        alert(`"${s.restaurantName}" obunasi muvaffaqiyatli vaqtincha to'xtatildi!`);
        this.refreshAll();
      },
      error: (err) => alert(err?.error?.message || 'Obunani to\'xtatishda xatolik yuz berdi')
    });
  }

  // Action: Resume Subscription (Qayta faollashtirish)
  resumeSubscription(s: TenantSubscriptionSummary): void {
    if (!confirm(
      `"${s.restaurantName}" obunasini qayta faollashtirishni tasdiqlaysizmi?\n\n` +
      `Restoranning POS tizimiga kirishi va buyurtma olish ruxsati to'liq tiklanadi.`
    )) {
      return;
    }

    this.billingService.resumeSubscription(s.id).subscribe({
      next: () => {
        alert(`"${s.restaurantName}" obunasi muvaffaqiyatli qayta faollashtirildi!`);
        this.refreshAll();
      },
      error: (err) => alert(err?.error?.message || 'Obunani faollashtirishda xatolik yuz berdi')
    });
  }

  // Action: Mark Invoice As Paid
  markPaid(inv: InvoiceResponse): void {
    const notes = prompt(`"${inv.invoiceNumber}" hisob-fakturasini to'langan deb belgilaysizmi?\nIzoh (ixtiyoriy):`, 'Qo\'lda to\'landi');
    if (notes === null) return;

    this.billingService.markInvoiceAsPaid(inv.id, notes).subscribe({
      next: () => {
        alert('Hisob-faktura to\'landi va obuna faollashtirildi!');
        this.refreshAll();
      },
      error: (err) => alert(err?.error?.message || 'Xatolik yuz berdi')
    });
  }

  // Manual activate
  openManualActivateModal(sub?: TenantSubscriptionSummary): void {
    this.manualReq = {
      tenantId: sub ? sub.tenantId : '',
      planCode: sub ? sub.planCode : 'PRO',
      months: 1,
      discountPercent: 0,
      adjustmentAmount: 0,
      notes: 'Super Admin qo\'lda faollashtirdi'
    };
    this.showManualModal = true;
  }

  submitManualActivate(): void {
    if (!this.manualReq.tenantId) {
      alert('Iltimos, restoranni tanlang!');
      return;
    }
    this.billingService.manualActivate(this.manualReq).subscribe({
      next: () => {
        alert('Obuna muvaffaqiyatli faollashtirildi!');
        this.showManualModal = false;
        this.refreshAll();
      },
      error: (err) => alert(err?.error?.message || 'Xatolik yuz berdi')
    });
  }

  // Plan management
  openNewPlanModal(): void {
    this.editingPlanId = null;
    this.planForm = this.getEmptyPlanForm();
    this.showPlanModal = true;
  }

  editPlan(p: PlanResponse): void {
    this.editingPlanId = p.id;
    this.planForm = {
      name: p.name,
      code: p.code,
      description: p.description,
      price: p.price,
      yearlyPrice: p.yearlyPrice,
      currency: p.currency,
      billingPeriod: p.billingPeriod,
      trialEnabled: p.trialEnabled,
      trialDays: p.trialDays,
      maxUsers: p.maxUsers,
      maxTables: p.maxTables,
      maxProducts: p.maxProducts,
      maxKitchens: p.maxKitchens,
      maxDevices: p.maxDevices,
      maxBranches: p.maxBranches,
      maxOrdersPerMonth: p.maxOrdersPerMonth,
      features: [...(p.features || [])],
      active: p.active,
      archived: p.archived,
      sortOrder: p.sortOrder
    };
    this.showPlanModal = true;
  }

  hasFeature(f: string): boolean {
    return (this.planForm.features || []).includes(f);
  }

  toggleFeature(f: string): void {
    const list = this.planForm.features || [];
    if (list.includes(f)) {
      this.planForm.features = list.filter(item => item !== f);
    } else {
      this.planForm.features = [...list, f];
    }
  }

  savePlanSubmit(): void {
    if (this.editingPlanId) {
      this.billingService.updatePlan(this.editingPlanId, this.planForm).subscribe({
        next: () => {
          this.showPlanModal = false;
          this.loadPlans();
        },
        error: (err) => alert(err?.error?.message || 'Xatolik')
      });
    } else {
      this.billingService.createPlan(this.planForm).subscribe({
        next: () => {
          this.showPlanModal = false;
          this.loadPlans();
        },
        error: (err) => alert(err?.error?.message || 'Xatolik')
      });
    }
  }

  archivePlan(planId: string): void {
    if (!confirm('Haqiqatdan ham ushbu tarifni arxivlamoqchimisiz?')) return;
    this.billingService.archivePlan(planId).subscribe({
      next: () => this.loadPlans(),
      error: (err) => alert(err?.error?.message || 'Xatolik')
    });
  }

  // Discount rules
  openNewDiscountModal(): void {
    this.editingDiscountId = null;
    this.discountForm = {
      minMonths: 3,
      discountPercent: 5,
      name: '3 oylik chegirma',
      active: true
    };
    this.showDiscountModal = true;
  }

  editDiscount(d: DiscountRuleDto): void {
    this.editingDiscountId = d.id || null;
    this.discountForm = { ...d };
    this.showDiscountModal = true;
  }

  saveDiscountSubmit(): void {
    if (this.editingDiscountId) {
      this.billingService.updateDiscountRule(this.editingDiscountId, this.discountForm).subscribe({
        next: () => {
          this.showDiscountModal = false;
          this.loadDiscounts();
        },
        error: (err) => alert(err?.error?.message || 'Xatolik')
      });
    } else {
      this.billingService.saveDiscountRule(this.discountForm).subscribe({
        next: () => {
          this.showDiscountModal = false;
          this.loadDiscounts();
        },
        error: (err) => alert(err?.error?.message || 'Xatolik')
      });
    }
  }

  deleteDiscount(id: string): void {
    if (!confirm('Chegirma qoidasini o\'chirmoqchimisiz?')) return;
    this.billingService.deleteDiscountRule(id).subscribe({
      next: () => this.loadDiscounts(),
      error: (err) => alert(err?.error?.message || 'Xatolik')
    });
  }

  private getEmptyPlanForm(): PlanSaveRequest {
    return {
      name: '',
      code: '',
      description: '',
      price: 100000,
      yearlyPrice: 1000000,
      currency: 'UZS',
      billingPeriod: 'MONTHLY',
      trialEnabled: false,
      trialDays: 14,
      maxUsers: 10,
      maxTables: 20,
      maxProducts: 200,
      maxKitchens: 2,
      maxDevices: 5,
      maxBranches: 1,
      maxOrdersPerMonth: -1,
      features: ['POS', 'KITCHEN'],
      active: true,
      archived: false,
      sortOrder: 1
    };
  }

  // --- Subscription Requests (B2B Approval Engine) ---

  loadSubscriptionRequests(): void {
    this.loadingRequests.set(true);
    this.billingService.getAllSubscriptionRequests(this.requestStatusFilter).subscribe({
      next: (data) => {
        this.requests.set(data);
        this.loadingRequests.set(false);
      },
      error: () => this.loadingRequests.set(false)
    });
  }

  loadPendingRequestsCount(): void {
    this.billingService.getPendingSubscriptionRequestsCount().subscribe({
      next: (count) => this.pendingRequestsCount.set(count),
      error: () => {}
    });
  }

  setRequestFilter(filter: string): void {
    this.requestStatusFilter = filter;
    this.loadSubscriptionRequests();
  }

  filteredRequests(): SubscriptionRequestResponse[] {
    const q = this.requestSearchQuery.trim().toLowerCase();
    if (!q) return this.requests();
    return this.requests().filter(r =>
      (r.tenantName && r.tenantName.toLowerCase().includes(q)) ||
      (r.tenantCode && r.tenantCode.toLowerCase().includes(q)) ||
      (r.planName && r.planName.toLowerCase().includes(q))
    );
  }

  getPaymentMethodLabel(method: string): string {
    switch (method) {
      case 'BANK_TRANSFER': return '🏦 Bank hisob-raqami';
      case 'CASH': return '💵 Naqd pul';
      case 'CLICK_PAYME_MANUAL': return '💳 Karta / Click / Payme';
      case 'CARD_TRANSFER': return '💳 Karta orqali';
      default: return method || '-';
    }
  }

  getRequestStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING_APPROVAL': return 'Kutilmoqda';
      case 'APPROVED': return 'Tasdiqlangan';
      case 'REJECTED': return 'Rad etilgan';
      case 'CANCELLED': return 'Bekor qilingan';
      default: return status || '-';
    }
  }

  getRequestStatusBadge(status: string): string {
    switch (status) {
      case 'PENDING_APPROVAL': return 'badge-amber';
      case 'APPROVED': return 'badge-green';
      case 'REJECTED': return 'badge-red';
      case 'CANCELLED': return 'badge-gray';
      default: return 'badge-gray';
    }
  }

  openApproveModal(req: SubscriptionRequestResponse): void {
    this.selectedApproveRequest = req;
    this.customBonusDays = 0;
    this.adminApproveNotes = '';
    this.showApproveModal = true;
  }

  submitApproveRequest(): void {
    if (!this.selectedApproveRequest) return;
    this.approvingRequest = true;
    this.billingService.approveSubscriptionRequest(this.selectedApproveRequest.id, {
      customDaysBonus: this.customBonusDays,
      adminNotes: this.adminApproveNotes
    }).subscribe({
      next: () => {
        this.approvingRequest = false;
        this.showApproveModal = false;
        this.selectedApproveRequest = null;
        alert('Obuna so\'rovi tasdiqlandi va restoran obunasi muvaffaqiyatli faollashtirildi!');
        this.refreshAll();
      },
      error: (err) => {
        this.approvingRequest = false;
        alert(err?.error?.message || 'Tasdiqlashda xatolik yuz berdi');
      }
    });
  }

  openRejectModal(req: SubscriptionRequestResponse): void {
    this.selectedRejectRequest = req;
    this.rejectReason = '';
    this.showRejectModal = true;
  }

  submitRejectRequest(): void {
    if (!this.selectedRejectRequest || !this.rejectReason.trim()) return;
    this.rejectingRequest = true;
    this.billingService.rejectSubscriptionRequest(this.selectedRejectRequest.id, {
      reason: this.rejectReason.trim()
    }).subscribe({
      next: () => {
        this.rejectingRequest = false;
        this.showRejectModal = false;
        this.selectedRejectRequest = null;
        alert('Obuna so\'rovi rad etildi!');
        this.refreshAll();
      },
      error: (err) => {
        this.rejectingRequest = false;
        alert(err?.error?.message || 'Rad etishda xatolik yuz berdi');
      }
    });
  }

  viewReceipt(url: string): void {
    this.receiptModalUrl = url;
    this.showReceiptModal = true;
  }
}
