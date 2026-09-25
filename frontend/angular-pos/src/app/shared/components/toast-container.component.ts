import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';
import { AppIconComponent } from './icon/icon.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  template: `
    <div class="toast-container">
      @for (toast of notify.notifications(); track toast.id) {
        <div class="toast" [class]="'toast--' + toast.type">
          <span class="toast__icon"><app-icon [name]="getIconName(toast.type)" [size]="18"></app-icon></span>
          <span class="toast__message">{{ toast.message }}</span>
          <button class="toast__close" (click)="notify.remove(toast.id)"><app-icon name="x" [size]="14"></app-icon></button>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  constructor(public notify: NotificationService) {}

  getIconName(type: string): string {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'x-circle';
      case 'warning': return 'alert-triangle';
      case 'info':
      default: return 'info';
    }
  }
}
