const fs = require('fs');

function updateLang(filePath, newKeys) {
  let content = fs.readFileSync(filePath, 'utf8');
  // insert inside dashboard object
  for (const [k, v] of Object.entries(newKeys)) {
    if (!content.includes(`${k}:`)) {
      content = content.replace(
        "dashboard: {",
        `dashboard: {\n    ${k}: ${JSON.stringify(v)},`
      );
    }
  }
  fs.writeFileSync(filePath, content, 'utf8');
}

const uzNew = {
  welcome: "Xush kelibsiz",
  todayRevenue: "Bugungi Tushum",
  activeOrders: "Faol Buyurtmalar",
  occupiedTables: "Band Stollar",
  readyOrders: "Tayyor Buyurtmalar",
  openPos: "POS terminalni ochish",
  tablesStatus: "Zallar va stollar holati",
  cookOrders: "Taomlarni pishirish",
  checksAndPayments: "Cheklar va to'lovlar",
  tablesMap: "Stollar Xaritasi",
  paidOrdersCount: "To'langan {{count}} ta buyurtma bo'yicha",
  cookingCount: "{{count}} tasi oshxonada tayyorlanmoqda",
  freeTablesCount: "{{count}} ta stol bo'sh",
  readyToServe: "Yetkazishga tayyor holatda"
};

const ruNew = {
  welcome: "Добро пожаловать",
  todayRevenue: "Выручка за сегодня",
  activeOrders: "Активные Заказы",
  occupiedTables: "Занятые Столы",
  readyOrders: "Готовые Заказы",
  openPos: "Открыть POS-терминал",
  tablesStatus: "Статус залов и столов",
  cookOrders: "Приготовление блюд",
  checksAndPayments: "Счета и оплаты",
  tablesMap: "Карта Столов",
  paidOrdersCount: "По {{count}} оплаченным заказам",
  cookingCount: "{{count}} готовятся на кухне",
  freeTablesCount: "{{count}} столов свободно",
  readyToServe: "Готово к подаче"
};

const enNew = {
  welcome: "Welcome",
  todayRevenue: "Today's Revenue",
  activeOrders: "Active Orders",
  occupiedTables: "Occupied Tables",
  readyOrders: "Ready Orders",
  openPos: "Open POS terminal",
  tablesStatus: "Rooms and tables status",
  cookOrders: "Cooking dishes",
  checksAndPayments: "Receipts and payments",
  tablesMap: "Tables Map",
  paidOrdersCount: "For {{count}} paid orders",
  cookingCount: "{{count}} being cooked in kitchen",
  freeTablesCount: "{{count}} tables free",
  readyToServe: "Ready to be served"
};

updateLang('e:/ANtiG/Pos/frontend/angular-pos/src/app/core/i18n/uz.ts', uzNew);
updateLang('e:/ANtiG/Pos/frontend/angular-pos/src/app/core/i18n/ru.ts', ruNew);
updateLang('e:/ANtiG/Pos/frontend/angular-pos/src/app/core/i18n/en.ts', enNew);
console.log('Translations enriched for dashboard!');
