import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../core/services/translation.service';
import { SupportedLang, SUPPORTED_LANGUAGES } from '../../../core/i18n/lang.types';
import { AppIconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  template: `
    <div class="lang-selector" [class.open]="isOpen()">
      <button
        type="button"
        class="lang-btn"
        (click)="toggleOpen($event)"
        [attr.aria-expanded]="isOpen()"
        title="Tilni o'zgartirish / Change Language">
        <span class="lang-flag">{{ currentOption().flag }}</span>
        <span class="lang-name">{{ currentOption().name }}</span>
        <app-icon name="chevron-down" [size]="14" class="lang-arrow"></app-icon>
      </button>

      @if (isOpen()) {
        <div class="lang-dropdown fade-in">
          @for (item of languages; track item.code) {
            <button
              type="button"
              class="lang-item"
              [class.active]="item.code === currentLang()"
              (click)="selectLanguage(item.code, $event)">
              <span class="lang-flag">{{ item.flag }}</span>
              <span class="lang-title">{{ item.name }}</span>
              @if (item.code === currentLang()) {
                <app-icon name="check" [size]="14" class="check-icon"></app-icon>
              }
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .lang-selector {
      position: relative;
      display: inline-block;
      user-select: none;
    }

    .lang-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 6px 12px;
      background: var(--bg-card, #ffffff);
      border: 1px solid var(--border, #e2e8f0);
      border-radius: 8px;
      color: var(--text-primary, #0f172a);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .lang-btn:hover {
      background: var(--bg-hover, #f1f5f9);
      border-color: var(--border-hover, #cbd5e1);
    }

    .lang-flag {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      padding: 2px 5px;
      background: var(--bg-active, #e2e8f0);
      color: var(--icon-color, #243B64);
      border-radius: 4px;
      line-height: 1;
    }

    .lang-name {
      line-height: 1.2;
    }

    .lang-arrow {
      color: var(--icon-color, #243B64);
      transition: transform 0.2s ease;
    }

    .lang-selector.open .lang-arrow {
      transform: rotate(180deg);
    }

    .lang-dropdown {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      min-width: 150px;
      background: var(--bg-card, #ffffff);
      border: 1px solid var(--border, #e2e8f0);
      border-radius: 10px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      padding: 5px;
      z-index: 1050;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .lang-item {
      display: flex;
      align-items: center;
      gap: 9px;
      width: 100%;
      padding: 8px 10px;
      background: transparent;
      border: none;
      border-radius: 6px;
      color: var(--text-primary, #0f172a);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s ease;
    }

    .lang-item:hover {
      background: var(--bg-hover, #f1f5f9);
    }

    .lang-item.active {
      background: rgba(36, 59, 100, 0.08);
      color: var(--primary, #2563eb);
      font-weight: 600;
    }

    .lang-title {
      flex: 1;
    }

    .check-icon {
      color: var(--primary, #2563eb);
    }

    .fade-in {
      animation: langFadeIn 0.15s ease;
    }

    @keyframes langFadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class LanguageSelectorComponent {
  private elementRef = inject(ElementRef);
  readonly i18n = inject(TranslationService);
  readonly languages = SUPPORTED_LANGUAGES;
  readonly isOpen = signal<boolean>(false);

  readonly currentLang = this.i18n.currentLang;
  readonly currentOption = this.i18n.currentLanguageOption;

  toggleOpen(event: Event): void {
    event.stopPropagation();
    this.isOpen.update(v => !v);
  }

  selectLanguage(lang: SupportedLang, event: Event): void {
    event.stopPropagation();
    this.i18n.setLanguage(lang);
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
