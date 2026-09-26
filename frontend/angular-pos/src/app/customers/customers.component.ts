import { Component } from '@angular/core';
import { AppIconComponent } from '../shared/components/icon/icon.component';
import { TranslatePipe } from '../shared/pipes/translate.pipe';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [AppIconComponent, TranslatePipe],
  template: `
    <div class="fade-in" style="padding: 0;">
      <div style="margin-bottom: 24px;">
        <h1 style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">{{ 'customers.title' | translate }}</h1>
        <p style="color: var(--text-muted); font-size: 14px;">{{ 'customers.inDevelopment' | translate }}</p>
      </div>
      <div class="pos-card" style="text-align: center; padding: 60px; border-style: dashed;">
        <div style="margin-bottom: 16px;"><app-icon name="users" [size]="48"></app-icon></div>
        <h3 style="color: var(--text-primary); margin-bottom: 8px;">{{ 'customers.moduleTitle' | translate }}</h3>
        <p style="color: var(--text-muted);">{{ 'customers.moduleDesc' | translate }}</p>
      </div>
    </div>
  `
})
export class CustomersComponent {}
