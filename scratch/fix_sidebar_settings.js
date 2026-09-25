const fs = require('fs');
const path = require('path');

// 1. Fix sidebar.component.ts
const sideFile = path.join(__dirname, '../frontend/angular-pos/src/app/layout/sidebar/sidebar.component.ts');
let sideContent = fs.readFileSync(sideFile, 'utf8');
sideContent = sideContent.replace(
  'interface NavItem {\n  icon: string;\n  label: string;',
  'interface NavItem {\n  icon: string;\n  label: string;\n  key?: string;'
);
fs.writeFileSync(sideFile, sideContent, 'utf8');
console.log('Fixed sidebar NavItem interface');

// 2. Fix settings.component.ts
const settFile = path.join(__dirname, '../frontend/angular-pos/src/app/settings/settings.component.ts');
let settContent = fs.readFileSync(settFile, 'utf8');
settContent = settContent.replace(
  "import { Component, OnInit, signal, computed } from '@angular/core';",
  "import { Component, OnInit, signal, computed, inject } from '@angular/core';"
);
settContent = settContent.replace(
  'this.triggerAutoSave();',
  'if (this.general?.autoSave) { this.saveActiveCategory(); }'
);
fs.writeFileSync(settFile, settContent, 'utf8');
console.log('Fixed settings.component.ts inject and autoSave');
