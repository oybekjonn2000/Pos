const fs = require('fs');

const pathTs = 'e:/ANtiG/Pos/frontend/angular-pos/src/app/core/services/translation.service.ts';
let content = fs.readFileSync(pathTs, 'utf8');

const methodToAdd = `
  has(key: string): boolean {
    if (!key || typeof key !== 'string') return false;
    return this.resolveKey(this.currentLang(), key) !== undefined || this.resolveKey(DEFAULT_LANGUAGE, key) !== undefined;
  }

  translateMessageOrKey(msg: string): string {
    if (!msg || typeof msg !== 'string') return msg;
    if (this.has(msg)) {
      return this.t(msg);
    }
    const lower = msg.toLowerCase().trim();
    if (lower.includes('muvaffaqiyatli saqlandi') || lower.includes('saqlandi')) {
      return this.t('toast.saved');
    }
    if (lower.includes("muvaffaqiyatli o'chirildi") || lower.includes("o'chirildi")) {
      return this.t('toast.deleted');
    }
    if (lower.includes('muvaffaqiyatli yangilandi') || lower.includes('yangilandi')) {
      return this.t('toast.updated');
    }
    if (lower.includes('xatolik')) {
      return this.t('toast.errorOccurred');
    }
    if (lower.includes('aloqa uzildi') || lower.includes("aloqa yo'q")) {
      return this.t('toast.connectionLost');
    }
    if (lower.includes("to'lov muvaffaqiyatli")) {
      return this.t('orders.paymentSuccess');
    }
    return msg;
  }
`;

if (!content.includes('has(key: string)')) {
  content = content.replace('instant(key: string, params?: Record<string, any>): string {', methodToAdd + '\n  instant(key: string, params?: Record<string, any>): string {');
  fs.writeFileSync(pathTs, content, 'utf8');
  console.log('translation.service.ts updated!');
}

// Update notification.service.ts
const pathNotif = 'e:/ANtiG/Pos/frontend/angular-pos/src/app/core/services/notification.service.ts';
let notifContent = fs.readFileSync(pathNotif, 'utf8');

if (!notifContent.includes('TranslationService')) {
  notifContent = notifContent.replace(
    "import { Injectable, signal } from '@angular/core';",
    "import { Injectable, signal, inject } from '@angular/core';\nimport { TranslationService } from './translation.service';"
  );
  notifContent = notifContent.replace(
    "export class NotificationService {",
    "export class NotificationService {\n  private i18n = inject(TranslationService);"
  );
  notifContent = notifContent.replace(
    "const id = Date.now().toString();\n    this.notifications.update(ns => [...ns, { ...notification, id }]);",
    "const id = Date.now().toString();\n    const translatedMessage = this.i18n.translateMessageOrKey(notification.message);\n    this.notifications.update(ns => [...ns, { ...notification, message: translatedMessage, id }]);"
  );
  if (!notifContent.includes('translatedMessage')) {
    // CRLF fallback
    notifContent = notifContent.replace(
      "const id = Date.now().toString();\r\n    this.notifications.update(ns => [...ns, { ...notification, id }]);",
      "const id = Date.now().toString();\r\n    const translatedMessage = this.i18n.translateMessageOrKey(notification.message);\r\n    this.notifications.update(ns => [...ns, { ...notification, message: translatedMessage, id }]);"
    );
  }
  fs.writeFileSync(pathNotif, notifContent, 'utf8');
  console.log('notification.service.ts updated!');
}
