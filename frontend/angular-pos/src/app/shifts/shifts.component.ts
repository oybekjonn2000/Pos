import { Component } from '@angular/core';
import { AppIconComponent } from '../shared/components/icon/icon.component';

@Component({
  selector: 'app-shifts',
  standalone: true,
  imports: [AppIconComponent],
  template: `
    <div class="fade-in" style="padding: 0;">
      <div style="margin-bottom: 24px;">
        <h1 style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">Shift Management</h1>
        <p style="color: var(--text-muted); font-size: 14px;">Module under development — Phase 2+</p>
      </div>
      <div class="pos-card" style="text-align: center; padding: 60px; border-style: dashed;">
        <div style="margin-bottom: 16px;"><app-icon name="clock" [size]="48"></app-icon></div>
        <h3 style="color: var(--text-primary); margin-bottom: 8px;">Shift Management Module</h3>
        <p style="color: var(--text-muted);">This module is being implemented. Backend API is ready.</p>
      </div>
    </div>
  `
})
export class ShiftsComponent {}
