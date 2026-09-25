const fs = require('fs');

// 1. Update index.html
const htmlPath = 'e:/ANtiG/Pos/mobile/waiter-pos/www/index.html';
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Add language selector in screenConnect and screenWaiters
const connectHeaderTarget = `<div class="brand-header">`;
const connectHeaderReplacement = `<div style="display: flex; justify-content: flex-end; padding: 12px 16px;">
          <select id="mobileLangSelect" onchange="app.changeLanguage(this.value)" style="background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border); border-radius: 8px; padding: 4px 8px; font-weight: 600; font-size: 13px;">
            <option value="uz">🇺🇿 O‘zbekcha</option>
            <option value="ru">🇷🇺 Русский</option>
            <option value="en">🇬🇧 English</option>
          </select>
        </div>
        <div class="brand-header">`;

if (!htmlContent.includes('mobileLangSelect')) {
  htmlContent = htmlContent.replace(connectHeaderTarget, connectHeaderReplacement);
}

// Add data-i18n tags to index.html key elements
htmlContent = htmlContent.replace(
  '<h1 class="brand-title">POS serverga ulanish</h1>',
  '<h1 class="brand-title" data-i18n="connectTitle">POS serverga ulanish</h1>'
);
htmlContent = htmlContent.replace(
  '<p class="brand-subtitle">Ofitsiant ilovasini markaziy POS kompyuteriga ulash uchun uning Wi-Fi IP manzilini kiriting</p>',
  '<p class="brand-subtitle" data-i18n="connectSubtitle">Ofitsiant ilovasini markaziy POS kompyuteriga ulash uchun uning Wi-Fi IP manzilini kiriting</p>'
);
htmlContent = htmlContent.replace(
  '<label class="form-label" for="inputServerIp">Server IP manzili *</label>',
  '<label class="form-label" for="inputServerIp" data-i18n="serverIp">Server IP manzili *</label>'
);
htmlContent = htmlContent.replace(
  '<label class="form-label" for="inputServerPort">Port *</label>',
  '<label class="form-label" for="inputServerPort" data-i18n="port">Port *</label>'
);
htmlContent = htmlContent.replace(
  '<span>Serverga Ulanish</span>',
  '<span data-i18n="connectBtn">Serverga Ulanish</span>'
);

fs.writeFileSync(htmlPath, htmlContent, 'utf8');

// 2. Update app.js
const appJsPath = 'e:/ANtiG/Pos/mobile/waiter-pos/www/js/app.js';
let appJsContent = fs.readFileSync(appJsPath, 'utf8');

const i18nMethods = `
    this.lang = localStorage.getItem('pos_language') || 'uz';
`;

if (!appJsContent.includes('this.lang = localStorage.getItem(\'pos_language\')')) {
  appJsContent = appJsContent.replace('this.init();', i18nMethods + '    this.init();');
}

const translationHelperMethods = `
  t(key) {
    const dict = {
      uz: {
        connectTitle: "POS serverga ulanish",
        connectSubtitle: "Ofitsiant ilovasini markaziy POS kompyuteriga ulash uchun uning Wi-Fi IP manzilini kiriting",
        serverIp: "Server IP manzili *",
        port: "Port *",
        connectBtn: "Serverga Ulanish",
        selectWaiter: "Ofitsiantni tanlang",
        selectWaiterSub: "Tizimda ishlash uchun o‘z ismingizni bosing",
        enterPin: "PIN kodni kiriting",
        tables: "Stollar",
        allZones: "Barchasi",
        orders: "Buyurtmalar",
        newOrder: "Yangi buyurtma",
        sendToKitchen: "Oshxonaga yuborish",
        cart: "Savatcha",
        total: "Jami",
        close: "Yopish",
        cancel: "Bekor qilish",
        available: "Bo'sh",
        occupied: "Band",
        dishes: "taom",
        readyDish: "Oshxonada taom tayyor!",
        loading: "Yuklanmoqda...",
        success: "Muvaffaqiyatli",
        error: "Xatolik"
      },
      ru: {
        connectTitle: "Подключение к POS серверу",
        connectSubtitle: "Введите IP-адрес Wi-Fi для подключения мобильного официанта к основному POS",
        serverIp: "IP-адрес сервера *",
        port: "Порт *",
        connectBtn: "Подключиться к серверу",
        selectWaiter: "Выберите официанта",
        selectWaiterSub: "Нажмите на свое имя для начала работы",
        enterPin: "Введите ПИН-код",
        tables: "Столы",
        allZones: "Все",
        orders: "Заказы",
        newOrder: "Новый заказ",
        sendToKitchen: "Отправить на кухню",
        cart: "Корзина",
        total: "Итого",
        close: "Закрыть",
        cancel: "Отмена",
        available: "Свободен",
        occupied: "Занят",
        dishes: "блюд",
        readyDish: "Блюдо готово на кухне!",
        loading: "Загрузка...",
        success: "Успешно",
        error: "Ошибка"
      },
      en: {
        connectTitle: "Connect to POS Server",
        connectSubtitle: "Enter Wi-Fi IP address to connect mobile waiter to main POS computer",
        serverIp: "Server IP Address *",
        port: "Port *",
        connectBtn: "Connect to Server",
        selectWaiter: "Select Waiter",
        selectWaiterSub: "Tap your name to start working",
        enterPin: "Enter PIN code",
        tables: "Tables",
        allZones: "All",
        orders: "Orders",
        newOrder: "New Order",
        sendToKitchen: "Send to Kitchen",
        cart: "Cart",
        total: "Total",
        close: "Close",
        cancel: "Cancel",
        available: "Available",
        occupied: "Occupied",
        dishes: "dishes",
        readyDish: "Dish ready in kitchen!",
        loading: "Loading...",
        success: "Success",
        error: "Error"
      }
    };
    const cur = dict[this.lang] || dict.uz;
    return cur[key] || dict.uz[key] || key;
  }

  changeLanguage(newLang) {
    this.lang = newLang;
    localStorage.setItem('pos_language', newLang);
    this.applyTranslations();
  }

  applyTranslations() {
    document.documentElement.lang = this.lang;
    const select = document.getElementById('mobileLangSelect');
    if (select) select.value = this.lang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.getAttribute('data-i18n');
      if (k) el.textContent = this.t(k);
    });
  }
`;

if (!appJsContent.includes('applyTranslations()')) {
  appJsContent = appJsContent.replace('init() {', translationHelperMethods + '\n  init() {\n    this.applyTranslations();');
  fs.writeFileSync(appJsPath, appJsContent, 'utf8');
}

console.log('Mobile Waiter POS updated with i18n support!');
