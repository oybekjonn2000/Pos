import { AppIconComponent } from '../../shared/components/icon/icon.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService, RegisterRequest } from '../../core/services/auth.service';
import { BillingService, PlanResponse } from '../../core/services/billing.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AppIconComponent, TranslatePipe, LanguageSelectorComponent],
  template: `
    <div class="register-page">
      <div class="register-container">
        <!-- Brand Header -->
        <div class="register-header">
          <div style="display: flex; justify-content: flex-end; margin-bottom: 12px;">
            <app-language-selector></app-language-selector>
          </div>
          <div class="brand-badge" routerLink="/">
            <span class="brand-icon"><app-icon name="utensils" [size]="28"></app-icon></span>
            <span class="brand-title">Restaurant<strong>POS</strong> <span class="saas-tag">SaaS</span></span>
          </div>
          <h1 class="page-title">{{ 'auth.register' | translate }}</h1>
          <p class="page-subtitle">
            Super-admin bilan bog'lanish shart emas! O'zingiz ro'yxatdan o'ting va <strong>14 kun bepul</strong> tizimdan to'liq foydalaning.
          </p>
        </div>

        @if (errorMessage()) {
          <div class="alert alert-error">
            <span class="alert-icon"><app-icon name="alert-triangle" [size]="16"></app-icon></span>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="register-form">
          <!-- Step 1: Restaurant Information -->
          <div class="form-section">
            <div class="section-badge">
              <span class="badge-num">1</span>
              <span class="badge-title">Restoran Ma'lumotlari</span>
            </div>

            <div class="form-grid">
              <div class="form-group full-width">
                <label for="restaurantName">{{ 'auth.restaurantName' | translate }} *</label>
                <input id="restaurantName" type="text" formControlName="restaurantName" placeholder="Masalan: Rayhon Milliy Taomlar" class="form-control" />
                @if (form.get('restaurantName')?.touched && form.get('restaurantName')?.invalid) {
                  <span class="field-error">Restoran nomini kiriting</span>
                }
              </div>

              <div class="form-group">
                <label for="restaurantPhone">Restoran telefoni *</label>
                <input id="restaurantPhone" type="tel" formControlName="restaurantPhone" placeholder="+998 71 200 00 00" class="form-control" />
                @if (form.get('restaurantPhone')?.touched && form.get('restaurantPhone')?.invalid) {
                  <span class="field-error">Restoran telefonini kiriting</span>
                }
              </div>

              <div class="form-group">
                <label for="city">Shahar / Viloyat *</label>
                <input id="city" type="text" formControlName="city" placeholder="Toshkent shahri" class="form-control" />
                @if (form.get('city')?.touched && form.get('city')?.invalid) {
                  <span class="field-error">Shaharni kiriting</span>
                }
              </div>

              <div class="form-group full-width">
                <label for="address">Manzil *</label>
                <input id="address" type="text" formControlName="address" placeholder="Amir Temur shoh ko'chasi, 45-uy" class="form-control" />
                @if (form.get('address')?.touched && form.get('address')?.invalid) {
                  <span class="field-error">Manzilni kiriting</span>
                }
              </div>

              <div class="form-group">
                <label for="logoUrl">Restoran logotipi (URL)</label>
                <input id="logoUrl" type="text" formControlName="logoUrl" placeholder="https://example.com/logo.png (ixtiyoriy)" class="form-control" />
              </div>

              <div class="form-group">
                <label for="restaurantCode">Restoran qisqa kodi (ixtiyoriy)</label>
                <input id="restaurantCode" type="text" formControlName="restaurantCode" placeholder="Masalan: RAYHON01" class="form-control" />
                <small class="hint-text">Bo'sh qoldirilsa avtomatik generatsiya qilinadi</small>
              </div>
            </div>
          </div>

          <!-- Step 2: Owner / Admin Information -->
          <div class="form-section">
            <div class="section-badge">
              <span class="badge-num">2</span>
              <span class="badge-title">Egasi / Administrator Ma'lumotlari</span>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label for="firstName">Ism *</label>
                <input id="firstName" type="text" formControlName="firstName" placeholder="Masalan: Aziz" class="form-control" />
                @if (form.get('firstName')?.touched && form.get('firstName')?.invalid) {
                  <span class="field-error">Ismni kiriting</span>
                }
              </div>

              <div class="form-group">
                <label for="lastName">Familiya *</label>
                <input id="lastName" type="text" formControlName="lastName" placeholder="Masalan: Rahimov" class="form-control" />
                @if (form.get('lastName')?.touched && form.get('lastName')?.invalid) {
                  <span class="field-error">Familiyani kiriting</span>
                }
              </div>

              <div class="form-group">
                <label for="phone">Telefon raqam (shaxsiy) *</label>
                <input id="phone" type="tel" formControlName="phone" placeholder="+998 90 123 45 67" class="form-control" />
                @if (form.get('phone')?.touched && form.get('phone')?.invalid) {
                  <span class="field-error">Telefon raqam majburiy</span>
                }
              </div>

              <div class="form-group">
                <label for="email">Elektron pochta (Email)</label>
                <input id="email" type="email" formControlName="email" placeholder="example@restaurant.uz" class="form-control" />
              </div>

              <div class="form-group full-width">
                <label for="username">Login (username) *</label>
                <input id="username" type="text" formControlName="username" placeholder="Masalan: aziz_admin" class="form-control" />
                @if (form.get('username')?.hasError('duplicate')) {
                  <span class="field-error">Bu username login bazasida mavjud. Boshqa username tanlang.</span>
                } @else if (form.get('username')?.touched && form.get('username')?.invalid) {
                  <span class="field-error">Login kamida 3 ta belgidan iborat bo'lishi kerak</span>
                }
              </div>

              <div class="form-group">
                <label for="password">Parol *</label>
                <input id="password" type="password" formControlName="password" placeholder="Kamida 6 ta belgi" class="form-control" />
                @if (form.get('password')?.touched && form.get('password')?.invalid) {
                  <span class="field-error">Parol kamida 6 belgidan iborat bo'lishi kerak</span>
                }
              </div>

              <div class="form-group">
                <label for="confirmPassword">Parolni tasdiqlash *</label>
                <input id="confirmPassword" type="password" formControlName="confirmPassword" placeholder="Parolni qayta kiriting" class="form-control" />
                @if (form.get('confirmPassword')?.touched && (form.get('confirmPassword')?.invalid || form.hasError('mismatch'))) {
                  <span class="field-error">Parollar bir-biriga mos kelmadi</span>
                }
              </div>
            </div>
          </div>

          <!-- Step 3: Plan Selection -->
          <div class="form-section">
            <div class="section-badge">
              <span class="badge-num">3</span>
              <span class="badge-title">Tarif Rejasini Tanlash</span>
            </div>
            <p class="plan-subhint">
              <app-icon name="sparkles" [size]="16"></app-icon> Qaysi tarifni tanlashingizdan qat'iy nazar, dastlabki <strong>14 kun bepul</strong> to'liq imkoniyat beriladi!
            </p>

            <div class="plan-selector-grid">
              @for (plan of plans(); track plan.code) {
                <div class="plan-select-card" 
                     [class.selected]="selectedPlanCode() === plan.code"
                     (click)="selectPlan(plan.code)">
                  <div class="radio-indicator">
                    <span class="dot"></span>
                  </div>
                  <div class="plan-info">
                    <div class="plan-title-row">
                      <strong>{{ plan.name }}</strong>
                      @if (plan.code === 'PRO') {
                        <span class="badge-popular">Tavsiya etiladi</span>
                      }
                      @if (plan.code === 'TRIAL') {
                        <span class="badge-popular" style="background: rgba(16, 185, 129, 0.2); color: #10b981;">15 kun bepul</span>
                      }
                    </div>
                    <div class="plan-price">
                      @if (plan.price === 0) {
                        <span>0 so‘m (15 kun bepul)</span>
                      } @else {
                        <span>{{ formatPrice(plan.price) }} so‘m / oy</span>
                      }
                    </div>
                    <div class="plan-limits-hint">
                      <app-icon name="check" [size]="14"></app-icon> Cheksiz xodimlar, stollar, mahsulotlar
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Submit Button -->
          <div class="form-actions">
            <button type="submit" [disabled]="form.invalid || submitting()" class="btn btn-submit">
              @if (submitting()) {
                <span class="spinner-sm"></span>
                <span>Restoran yaratilmoqda...</span>
              } @else {
                <span><app-icon name="zap" [size]="16"></app-icon> Restoranni yaratish va POS'dan foydalanish</span>
              }
            </button>

            <div class="login-prompt">
              <span>Hisobingiz bormi?</span>
              <a routerLink="/login" class="login-link">Kirish</a>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .register-page {
      min-height: 100vh;
      background: var(--bg-primary, #0f172a);
      color: var(--text-primary, #f8fafc);
      display: flex;
      justify-content: center;
      padding: 40px 20px;
    }

    .register-container {
      max-width: 760px;
      width: 100%;
    }

    .register-header {
      text-align: center;
      margin-bottom: 32px;

      .brand-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        margin-bottom: 16px;

        .brand-icon { font-size: 24px; }
        .brand-title { font-size: 20px; font-weight: 700; color: #f8fafc; }
        .saas-tag {
          font-size: 11px;
          background: #6366f1;
          color: white;
          padding: 2px 8px;
          border-radius: 9999px;
          text-transform: uppercase;
        }
      }

      .page-title {
        font-size: 28px;
        font-weight: 800;
        margin-bottom: 8px;
      }

      .page-subtitle {
        font-size: 15px;
        color: var(--text-secondary, #94a3b8);
        line-height: 1.5;
      }
    }

    .alert-error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
      padding: 14px 18px;
      border-radius: 10px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
    }

    .register-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .form-section {
      background: var(--bg-secondary, #1e293b);
      border: 1px solid var(--border, #334155);
      border-radius: 14px;
      padding: 24px;

      .section-badge {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--border, #334155);

        .badge-num {
          width: 26px;
          height: 26px;
          background: #6366f1;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
        }

        .badge-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary, #f8fafc);
        }
      }

      .plan-subhint {
        font-size: 13px;
        color: var(--text-secondary, #94a3b8);
        margin-bottom: 16px;
      }
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-secondary, #cbd5e1);
      }

      .form-control {
        background: var(--bg-primary, #0f172a);
        border: 1px solid var(--border, #334155);
        border-radius: 8px;
        padding: 10px 14px;
        color: var(--text-primary, #f8fafc);
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;

        &:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }
      }

      .hint-text {
        font-size: 11px;
        color: var(--text-muted, #64748b);
      }

      .field-error {
        font-size: 11px;
        color: #ef4444;
      }
    }

    .plan-selector-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }

    .plan-select-card {
      background: var(--bg-primary, #0f172a);
      border: 2px solid var(--border, #334155);
      border-radius: 10px;
      padding: 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: #6366f1;
      }

      &.selected {
        border-color: #6366f1;
        background: rgba(99, 102, 241, 0.08);

        .radio-indicator {
          border-color: #6366f1;
          .dot {
            transform: scale(1);
          }
        }
      }

      .radio-indicator {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 2px solid var(--border, #475569);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        .dot {
          width: 8px;
          height: 8px;
          background: #6366f1;
          border-radius: 50%;
          transform: scale(0);
          transition: transform 0.2s;
        }
      }

      .plan-info {
        flex: 1;

        .plan-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 2px;

          strong { font-size: 14px; color: var(--text-primary, #f8fafc); }
          .badge-popular {
            font-size: 10px;
            background: rgba(99, 102, 241, 0.2);
            color: #818cf8;
            padding: 1px 6px;
            border-radius: 4px;
            font-weight: 600;
          }
        }

        .plan-price {
          font-size: 13px;
          font-weight: 700;
          color: #10b981;
          margin-bottom: 2px;
        }

        .plan-limits-hint {
          font-size: 11px;
          color: var(--text-muted, #64748b);
        }
      }
    }

    .form-actions {
      display: flex;
      flex-direction: column;
      gap: 16px;
      align-items: center;

      .btn-submit {
        width: 100%;
        padding: 14px 20px;
        background: #6366f1;
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        transition: all 0.2s;

        &:hover:not(:disabled) {
          background: #4f46e5;
          transform: translateY(-1px);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .login-prompt {
        font-size: 14px;
        color: var(--text-secondary, #94a3b8);
        display: flex;
        gap: 6px;

        .login-link {
          color: #6366f1;
          text-decoration: none;
          font-weight: 600;
          &:hover { text-decoration: underline; }
        }
      }
    }

    .spinner-sm {
      width: 18px;
      height: 18px;
      border: 2px solid white;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private billingService = inject(BillingService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form!: FormGroup;
  plans = signal<PlanResponse[]>([]);
  selectedPlanCode = signal<string>('TRIAL');
  submitting = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.authService.getDefaultRoute()]);
      return;
    }
    this.initForm();
    this.loadPlans();

    this.route.queryParams.subscribe(params => {
      if (params['plan']) {
        this.selectedPlanCode.set(params['plan'].toUpperCase());
      }
    });
  }

  initForm(): void {
    this.form = this.fb.group({
      // Restoran ma'lumotlari
      restaurantName: ['', [Validators.required, Validators.minLength(2)]],
      restaurantPhone: ['', [Validators.required, Validators.minLength(7)]],
      city: ['Toshkent', Validators.required],
      address: ['', Validators.required],
      logoUrl: [''],
      restaurantCode: [''],

      // Egasi / administrator ma'lumotlari
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.minLength(7)]],
      email: [''],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
    }, {
      validators: (group) => {
        const p = group.get('password')?.value;
        const cp = group.get('confirmPassword')?.value;
        return p && cp && p !== cp ? { mismatch: true } : null;
      }
    });
  }

  loadPlans(): void {
    this.billingService.getPublicPlans().subscribe({
      next: (data) => {
        this.plans.set(data);
      }
    });
  }

  selectPlan(code: string): void {
    this.selectedPlanCode.set(code);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('uz-UZ').format(price);
  }

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const val = this.form.value;
    const req: RegisterRequest = {
      firstName: val.firstName.trim(),
      lastName: val.lastName.trim(),
      ownerName: `${val.firstName.trim()} ${val.lastName.trim()}`,
      username: val.username.trim().toLowerCase(),
      phone: val.phone.trim(),
      email: val.email ? val.email.trim() : undefined,
      password: val.password,
      confirmPassword: val.confirmPassword,
      restaurantName: val.restaurantName.trim(),
      restaurantPhone: val.restaurantPhone.trim(),
      city: val.city.trim(),
      address: val.address.trim(),
      logoUrl: val.logoUrl ? val.logoUrl.trim() : undefined,
      restaurantCode: val.restaurantCode ? val.restaurantCode.trim() : undefined,
      planCode: this.selectedPlanCode()
    };

    this.authService.register(req).subscribe({
      next: (res) => {
        this.submitting.set(false);
        // User logged in directly! Navigate to default dashboard or billing
        this.router.navigate([this.authService.getDefaultRoute()]);
      },
      error: (err) => {
        this.submitting.set(false);
        let msg = err?.error?.message || 'Ro‘yxatdan o‘tishda xatolik yuz berdi. Iltimos qayta urinib ko‘ring.';
        if (msg.includes('username') || err?.error?.errorCode === 'DUPLICATE_USERNAME' || msg.toLowerCase().includes('mavjud') || msg.toLowerCase().includes('login bazasida')) {
          msg = 'Bu username login bazasida mavjud. Boshqa username tanlang.';
          this.form.get('username')?.setErrors({ duplicate: true });
        }
        this.errorMessage.set(msg);
      }
    });
  }
}
