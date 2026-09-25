/**
 * Restaurant POS — Ofitsiant Mobil Ilovasi (Android APK)
 * To'liq avtonom va mahalliy Wi-Fi orqali ishlovchi klassik POS mijoz logikasi
 */

class WaiterPosApp {
  constructor() {
    this.serverIp = localStorage.getItem('pos_mobile_ip') || '';
    this.serverPort = localStorage.getItem('pos_mobile_port') || '8080';
    this.serverBase = '';

    this.restaurant = null;
    this.waiters = [];
    this.selectedWaiter = null;
    this.currentPin = '';

    this.auth = {
      accessToken: localStorage.getItem('pos_waiter_token') || null,
      user: this.loadSavedUser()
    };

    this.zones = [];
    this.selectedZoneId = null;
    this.tables = [];
    this.categories = [];
    this.products = [];
    this.selectedCategoryId = null;

    this.selectedTable = null;
    this.cart = []; // Array of { productId, name, price, quantity }
    this.activeOrder = null;

    this.tablesPollTimer = null;
    this.readyNotificationsTimer = null;
    this.readyItems = [];
    this.notifiedReadyItemIds = new Set();
    this.activeReadyBannerTimeout = null;

    this.pendingCancelItem = null;
    this.cancelQty = 1;
    this.cancelReason = 'Mijoz rad etdi';

    
    this.lang = localStorage.getItem('pos_language') || 'uz';
    this.init();
  }

  loadSavedUser() {
    try {
      const u = localStorage.getItem('pos_waiter_user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  }

  
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

  init() {
    this.applyTranslations();
    // Populate connect inputs with saved values if any
    const ipInput = document.getElementById('inputServerIp');
    const portInput = document.getElementById('inputServerPort');
    const codeInput = document.getElementById('inputRestaurantCode');
    if (ipInput && this.serverIp) ipInput.value = this.serverIp;
    if (portInput && this.serverPort) portInput.value = this.serverPort;
    const savedCode = localStorage.getItem('pos_mobile_restaurant_code');
    if (codeInput && savedCode) codeInput.value = savedCode;

    // Check if we already have saved server configuration
    if (this.serverIp && this.serverPort) {
      this.serverBase = `http://${this.serverIp}:${this.serverPort}`;
      this.tryAutoConnect();
    } else {
      this.showScreen('screenConnect');
    }

    // Physical and virtual keyboard support for PIN screen
    document.addEventListener('keydown', (e) => {
      const pinScreen = document.getElementById('screenPin');
      if (pinScreen && pinScreen.classList.contains('active')) {
        if (e.key >= '0' && e.key <= '9') {
          this.onNumpadPress(e.key);
        } else if (e.key === 'Backspace') {
          this.onNumpadPress('DEL');
        } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
          this.onNumpadPress('C');
        } else if (e.key === 'Enter') {
          this.submitPinLogin();
        }
      }
    });
  }

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
    }

    if (screenId === 'screenTables') {
      this.startTablesPolling();
      this.startReadyNotificationsPolling();
    } else {
      this.stopTablesPolling();
      this.stopReadyNotificationsPolling();
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    let icon = 'ℹ️';
    if (type === 'success') icon = this.svgIcon('check-circle', 18);
    if (type === 'error') icon = this.svgIcon('x-circle', 18);

    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ========================================================
  // 1. IP FORMAT VALIDATION & SERVER CONNECTION
  // ========================================================
  isValidIpv4(ip) {
    if (!ip) return false;
    const parts = ip.trim().split('.');
    if (parts.length !== 4) return false;
    for (const p of parts) {
      if (!/^\d+$/.test(p)) return false;
      const num = parseInt(p, 10);
      if (num < 0 || num > 255) return false;
      if (p.length > 1 && p.startsWith('0')) return false; // no leading zeros
    }
    return true;
  }

  async handleConnectSubmit(event) {
    if (event) event.preventDefault();

    const ip = (document.getElementById('inputServerIp')?.value || '').trim();
    const port = (document.getElementById('inputServerPort')?.value || '').trim() || '8080';
    const restCode = (document.getElementById('inputRestaurantCode')?.value || '').trim();
    const errBanner = document.getElementById('connectErrorBanner');
    const errText = document.getElementById('connectErrorText');
    const btn = document.getElementById('btnConnect');
    const btnText = document.getElementById('btnConnectText');

    errBanner.style.display = 'none';

    // 1. Validate IP format
    if (!this.isValidIpv4(ip)) {
      errText.textContent = 'IP manzil noto‘g‘ri.';
      errBanner.style.display = 'flex';
      return;
    }

    // 2. Validate Port
    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      errText.textContent = 'Port noto‘g‘ri (1-65535 bo‘lishi kerak).';
      errBanner.style.display = 'flex';
      return;
    }

    btn.disabled = true;
    btnText.textContent = 'Ulanilmoqda...';

    const candidateUrl = `http://${ip}:${port}`;
    try {
      await this.verifyAndConnectServer(candidateUrl, ip, port, false, restCode);
    } catch (err) {
      errText.textContent = err.message || 'Serverga ulanishning imkoni bo‘lmadi.';
      errBanner.style.display = 'flex';
    } finally {
      btn.disabled = false;
      btnText.innerHTML = 'Ulanish ' + this.svgIcon('arrow-right', 14);
    }
  }

  async tryAutoConnect() {
    try {
      const savedCode = localStorage.getItem('pos_mobile_restaurant_code') || '';
      await this.verifyAndConnectServer(this.serverBase, this.serverIp, this.serverPort, true, savedCode);
    } catch (err) {
      console.warn('Auto-connect failed:', err.message);
      this.showScreen('screenConnect');
      const errBanner = document.getElementById('connectErrorBanner');
      const errText = document.getElementById('connectErrorText');
      if (errBanner && errText) {
        errText.textContent = 'POS serverga ulanib bo‘lmadi.';
        errBanner.style.display = 'flex';
      }
    }
  }

  async verifyAndConnectServer(baseUrl, ip, port, silent = false, restaurantCode = '') {
    const codeParam = restaurantCode ? `?restaurantCode=${encodeURIComponent(restaurantCode)}` : '';
    const checkUrl = `${baseUrl}/api/mobile/connection-check${codeParam}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    let res;
    try {
      res = await fetch(checkUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr.name === 'AbortError') {
        throw new Error('Server topilmadi.');
      }
      throw new Error('Serverga ulanishning imkoni bo‘lmadi.');
    }

    if (!res.ok) {
      let msg = 'POS server ishlamayapti.';
      try {
        const errJson = await res.json();
        if (errJson && errJson.message) msg = errJson.message;
      } catch (e) {}

      if (res.status === 403) {
        throw new Error('Ofitsiant mobil ilovasi faqat Pro tarifida mavjud.');
      }
      throw new Error(msg);
    }

    const json = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.message || 'Server ma\'lumoti noto‘g‘ri.');
    }

    // Success!
    this.serverIp = ip;
    this.serverPort = port;
    this.serverBase = baseUrl;
    this.restaurant = json.data;

    // Save to persistent storage
    localStorage.setItem('pos_mobile_ip', ip);
    localStorage.setItem('pos_mobile_port', port);
    if (restaurantCode) {
      localStorage.setItem('pos_mobile_restaurant_code', restaurantCode);
    } else {
      localStorage.removeItem('pos_mobile_restaurant_code');
    }

    if (!silent) {
      this.showToast('POS serverga muvaffaqiyatli ulandi', 'success');
    }

    // Update topbar labels
    const restNameEl = document.getElementById('waiterRestName');
    const serverIpEl = document.getElementById('waiterServerIp');
    if (restNameEl) restNameEl.textContent = this.restaurant.restaurantName || 'Restoran';
    if (serverIpEl) serverIpEl.textContent = `${ip}:${port}`;

    // Load Waiters List
    await this.loadWaiters();
    this.showScreen('screenWaiters');
  }

  // ========================================================
  // 2. WAITERS LIST (ONLY WAITER ROLE)
  // ========================================================
  async loadWaiters() {
    const listEl = document.getElementById('waitersList');
    if (!listEl) return;
    listEl.innerHTML = '<div style="padding: 20px; color: var(--text-muted); grid-column: 1/-1; text-align: center;">Yuklanmoqda...</div>';

    try {
      const restIdParam = this.restaurant?.restaurantId ? `?restaurantId=${encodeURIComponent(this.restaurant.restaurantId)}` : '';
      const url = `${this.serverBase}/api/mobile/waiters${restIdParam}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        this.waiters = json.data;
        this.renderWaitersList();
      } else {
        listEl.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;">Ofitsiantlar ro‘yxatini olib bo‘lmadi</div>';
      }
    } catch (err) {
      listEl.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;">Xatolik: ${err.message}</div>`;
    }
  }

  renderWaitersList() {
    const listEl = document.getElementById('waitersList');
    if (!listEl) return;

    if (this.waiters.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <div style="font-size: 36px; margin-bottom: 8px;">${this.svgIcon('users', 44)}</div>
          <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">Ofitsiantlar topilmadi</div>
          <div style="font-size: 12px;">Admin panelida Ofitsiant (WAITER) xodimlari qo‘shilganligini tekshiring.</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = '';
    this.waiters.forEach(w => {
      const card = document.createElement('div');
      card.className = 'waiter-card';
      card.onclick = () => this.selectWaiter(w);

      const initials = this.getInitials(w.fullName);
      card.innerHTML = `
        <div class="waiter-avatar">${initials}</div>
        <div class="waiter-name">${w.fullName}</div>
        <span class="waiter-badge">Ofitsiant</span>
      `;
      listEl.appendChild(card);
    });
  }

  getInitials(name) {
    if (!name) return 'OF';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  selectWaiter(waiter) {
    this.selectedWaiter = waiter;
    this.currentPin = '';

    const nameEl = document.getElementById('pinWaiterName');
    const avatarEl = document.getElementById('pinAvatar');
    const errorEl = document.getElementById('pinErrorAlert');

    if (nameEl) nameEl.textContent = waiter.fullName;
    if (avatarEl) avatarEl.textContent = this.getInitials(waiter.fullName);
    if (errorEl) errorEl.style.display = 'none';

    this.updatePinDots();
    this.showScreen('screenPin');
  }

  backToWaiters() {
    this.selectedWaiter = null;
    this.currentPin = '';
    this.showScreen('screenWaiters');
  }

  // ========================================================
  // 3. PIN AUTHENTICATION
  // ========================================================
  onNumpadPress(char) {
    const errorEl = document.getElementById('pinErrorAlert');
    if (errorEl) errorEl.style.display = 'none';

    if (char === 'C') {
      this.currentPin = '';
    } else if (char === 'DEL') {
      this.currentPin = this.currentPin.slice(0, -1);
    } else {
      if (this.currentPin.length < 16) {
        this.currentPin += char;
      }
    }

    this.updatePinDots();
  }

  updatePinDots() {
    const dotsContainer = document.getElementById('pinDots');
    if (dotsContainer) {
      if (this.currentPin.length === 0) {
        dotsContainer.innerHTML = `
          <div class="pin-dot"></div>
          <div class="pin-dot"></div>
          <div class="pin-dot"></div>
          <div class="pin-dot"></div>
        `;
      } else {
        dotsContainer.innerHTML = Array.from(this.currentPin)
          .map(() => '<div class="pin-dot filled"></div>')
          .join('');
      }
    }

    const submitBtn = document.getElementById('btnPinSubmit');
    if (submitBtn) {
      submitBtn.disabled = this.currentPin.length === 0;
    }
  }

  async submitPinLogin() {
    if (!this.selectedWaiter) return;

    const errorEl = document.getElementById('pinErrorAlert');
    const errorText = document.getElementById('pinErrorText');
    const submitBtn = document.getElementById('btnPinSubmit');

    const pinToSubmit = (this.currentPin || '').trim();
    if (!pinToSubmit) {
      if (errorText) errorText.textContent = 'Iltimos, PIN kodni kiriting.';
      if (errorEl) errorEl.style.display = 'flex';
      this.shakePinDots();
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span>Kirilmoqda...</span>
      `;
    }

    try {
      const url = `${this.serverBase}/api/mobile/pin-login`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          employeeId: this.selectedWaiter.id,
          pin: pinToSubmit
        })
      });

      const json = await res.json();

      if (res.ok && json.success && json.data) {
        // Authenticated!
        this.auth = {
          accessToken: json.data.accessToken,
          refreshToken: json.data.refreshToken,
          user: json.data.user
        };

        localStorage.setItem('pos_waiter_token', json.data.accessToken);
        localStorage.setItem('pos_waiter_user', JSON.stringify(json.data.user));

        this.showToast(`Xush kelibsiz, ${this.selectedWaiter.fullName}!`, 'success');

        // Set waiter name on tables topbar
        const waiterNameEl = document.getElementById('activeWaiterName');
        if (waiterNameEl) waiterNameEl.textContent = this.selectedWaiter.fullName;

        // Reset pin
        this.currentPin = '';
        this.updatePinDots();

        // Open STOLLAR screen
        this.openTablesScreen();
      } else {
        // Wrong PIN
        this.currentPin = '';
        this.updatePinDots();
        const msg = json.message || 'PIN kod noto‘g‘ri.';
        if (errorText) errorText.textContent = msg;
        if (errorEl) errorEl.style.display = 'flex';
        this.shakePinDots();
      }
    } catch (err) {
      this.currentPin = '';
      this.updatePinDots();
      if (errorText) errorText.textContent = err.message || 'Serverga ulanish xatosi';
      if (errorEl) errorEl.style.display = 'flex';
    } finally {
      if (submitBtn) {
        submitBtn.disabled = this.currentPin.length === 0;
        submitBtn.innerHTML = `
          <span>Kirish</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        `;
      }
    }
  }

  shakePinDots() {
    const dotsContainer = document.getElementById('pinDots');
    if (dotsContainer) {
      dotsContainer.style.animation = 'shake 0.3s ease-in-out';
      setTimeout(() => dotsContainer.style.animation = '', 350);
    }
  }

  logoutWaiter() {
    this.stopTablesPolling();
    this.stopReadyNotificationsPolling();
    this.dismissReadyBanner();
    this.auth.accessToken = null;
    this.auth.user = null;
    localStorage.removeItem('pos_waiter_token');
    localStorage.removeItem('pos_waiter_user');
    this.showScreen('screenWaiters');
  }

  // ========================================================
  // 4. STOLLAR (TABLES DASHBOARD & ORDERS)
  // ========================================================
  async openTablesScreen() {
    this.showScreen('screenTables');
    await Promise.all([
      this.loadTables(),
      this.loadCatalog()
    ]);
  }

  async loadTables() {
    if (!this.serverBase || !this.auth.accessToken) return;

    try {
      const [tablesRes, zonesRes] = await Promise.all([
        fetch(`${this.serverBase}/api/tables`, {
          headers: {
            'Authorization': `Bearer ${this.auth.accessToken}`,
            'Accept': 'application/json'
          }
        }),
        fetch(`${this.serverBase}/api/tables/zones`, {
          headers: {
            'Authorization': `Bearer ${this.auth.accessToken}`,
            'Accept': 'application/json'
          }
        })
      ]);

      if (tablesRes.status === 401 || zonesRes.status === 401) {
        this.logoutWaiter();
        return;
      }

      const tablesJson = await tablesRes.json();
      const zonesJson = await zonesRes.json();

      if (tablesJson.success && Array.isArray(tablesJson.data)) {
        this.tables = tablesJson.data;
      } else if (tablesJson.data && Array.isArray(tablesJson.data.tables)) {
        this.tables = tablesJson.data.tables;
      } else {
        this.tables = [];
      }

      if (zonesJson.success && Array.isArray(zonesJson.data)) {
        this.zones = zonesJson.data;
      } else if (zonesJson.data && Array.isArray(zonesJson.data.zones)) {
        this.zones = zonesJson.data.zones;
      } else {
        this.zones = [];
      }

      this.renderZoneTabs();
      this.renderTablesGrid();
    } catch (err) {
      console.warn('Could not refresh tables:', err.message);
    }
  }

  startTablesPolling() {
    this.stopTablesPolling();
    this.tablesPollTimer = setInterval(() => {
      this.loadTables();
    }, 5000);
  }

  stopTablesPolling() {
    if (this.tablesPollTimer) {
      clearInterval(this.tablesPollTimer);
      this.tablesPollTimer = null;
    }
  }

  renderZoneTabs() {
    const bar = document.getElementById('zoneTabsBar');
    if (!bar) return;

    let html = `
      <button class="zone-chip ${this.selectedZoneId === null ? 'active' : ''}" onclick="app.selectZone(null)">
        <span>${this.svgIcon('globe', 14)}</span> Barchasi (${this.tables.length})
      </button>
    `;

    this.zones.forEach(z => {
      const count = this.tables.filter(t => t.zoneId === z.id).length;
      html += `
        <button class="zone-chip ${this.selectedZoneId === z.id ? 'active' : ''}" onclick="app.selectZone('${z.id}')">
          <span>${this.svgIcon('map-pin', 14)}</span> ${z.name} (${count})
        </button>
      `;
    });

    bar.innerHTML = html;
  }

  selectZone(zoneId) {
    this.selectedZoneId = zoneId;
    this.renderZoneTabs();
    this.renderTablesGrid();
  }

  renderTablesGrid() {
    const grid = document.getElementById('tablesGrid');
    if (!grid) return;

    const filtered = this.selectedZoneId === null
      ? this.tables
      : this.tables.filter(t => t.zoneId === this.selectedZoneId);

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;">Ushbu zonada stollar yo‘q</div>';
      return;
    }

    grid.innerHTML = '';
    filtered.forEach(t => {
      const card = document.createElement('div');
      const isFree = t.status === 'FREE';
      card.className = `table-card ${isFree ? 'table-card--free' : 'table-card--occupied'}`;
      card.onclick = () => this.onTableClick(t);

      const statusTitle = isFree ? 'BO‘SH' : 'BAND';
      const orderAmount = !isFree && t.totalAmount ? `${this.formatMoney(t.totalAmount)} UZS` : '';
      const itemsCount = !isFree && t.itemCount ? `${t.itemCount} ta taom` : `${t.capacity || 4} kishilik`;

      card.innerHTML = `
        <div class="table-card-header">
          <span class="table-number">#${t.tableNumber || t.name}</span>
          <span class="table-status-pill">${statusTitle}</span>
        </div>
        <div class="table-name">${t.name}</div>
        <div class="table-info">
          <div style="color: var(--text-muted); font-size: 11px;">${itemsCount}</div>
          ${orderAmount ? `<div class="table-order-amount">${orderAmount}</div>` : ''}
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // ========================================================
  // 5. ORDER CREATION / MANAGEMENT
  // ========================================================
  async loadCatalog() {
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch(`${this.serverBase}/api/categories?activeOnly=true`, {
          headers: {
            'Authorization': `Bearer ${this.auth.accessToken}`,
            'Accept': 'application/json'
          }
        }),
        fetch(`${this.serverBase}/api/products?activeOnly=true`, {
          headers: {
            'Authorization': `Bearer ${this.auth.accessToken}`,
            'Accept': 'application/json'
          }
        })
      ]);

      const catJson = await catRes.json();
      const prodJson = await prodRes.json();

      if (catJson.success && Array.isArray(catJson.data)) {
        this.categories = catJson.data;
      } else {
        this.categories = [];
      }

      if (prodJson.success && Array.isArray(prodJson.data)) {
        this.products = prodJson.data;
      } else {
        this.products = [];
      }
    } catch (e) {
      console.warn('Could not load product catalog:', e);
    }
  }

  async onTableClick(table) {
    this.selectedTable = table;
    this.cart = [];

    const titleEl = document.getElementById('modalTableTitle');
    const subEl = document.getElementById('modalOrderSubtitle');
    if (titleEl) titleEl.textContent = `Stol #${table.tableNumber || table.name} (${table.name})`;

    const activeOrderId = table.currentOrderId || table.activeOrderId;
    if (table.status === 'OCCUPIED' && activeOrderId) {
      if (subEl) subEl.textContent = 'Mavjud buyurtma / Yangi taom qo‘shish';
      await this.fetchActiveOrder(activeOrderId);
    } else {
      if (subEl) subEl.textContent = 'Yangi buyurtma ochish';
      this.activeOrder = null;
    }

    this.renderCategoryChips();
    this.renderProductsList();
    this.renderCartItems();

    const modal = document.getElementById('modalOrder');
    if (modal) modal.classList.add('active');
  }

  closeOrderModal() {
    const modal = document.getElementById('modalOrder');
    if (modal) modal.classList.remove('active');
    this.selectedTable = null;
    this.cart = [];
    this.activeOrder = null;
  }

  async fetchActiveOrder(orderId) {
    try {
      const res = await fetch(`${this.serverBase}/api/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${this.auth.accessToken}` }
      });
      const json = await res.json();
      if (json.success && json.data) {
        this.activeOrder = json.data;
        // Pre-populate cart with existing items as read/add context
      }
    } catch (e) {
      console.warn('Could not load order:', e);
    }
  }

  renderCategoryChips() {
    const wrap = document.getElementById('catChipsScroll');
    if (!wrap) return;

    let html = `
      <button class="cat-chip ${this.selectedCategoryId === null ? 'active' : ''}" onclick="app.selectCategory(null)">
        Barchasi
      </button>
    `;

    this.categories.forEach(c => {
      html += `
        <button class="cat-chip ${this.selectedCategoryId === c.id ? 'active' : ''}" onclick="app.selectCategory('${c.id}')">
          ${c.name}
        </button>
      `;
    });

    wrap.innerHTML = html;
  }

  selectCategory(catId) {
    this.selectedCategoryId = catId;
    this.renderCategoryChips();
    this.renderProductsList();
  }

  renderProductsList() {
    const grid = document.getElementById('prodGrid');
    if (!grid) return;

    const filtered = this.selectedCategoryId === null
      ? this.products
      : this.products.filter(p => p.categoryId === this.selectedCategoryId);

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1; padding: 20px;">Ushbu toifada mahsulotlar yo‘q</div>';
      return;
    }

    grid.innerHTML = '';
    filtered.forEach(p => {
      const price = p.salePrice ?? p.price ?? 0;
      const card = document.createElement('div');
      card.className = 'prod-card';
      card.onclick = () => this.addToCart(p);
      card.innerHTML = `
        <div class="prod-name">${p.name}</div>
        <div class="prod-price">${this.formatMoney(price)} UZS</div>
      `;
      grid.appendChild(card);
    });
  }

  addToCart(product) {
    const price = product.salePrice ?? product.price ?? 0;
    const existing = this.cart.find(item => item.productId === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.cart.push({
        productId: product.id,
        name: product.name,
        price: price,
        quantity: 1
      });
    }
    this.renderCartItems();
  }

  updateCartQty(productId, delta) {
    const item = this.cart.find(i => i.productId === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      this.cart = this.cart.filter(i => i.productId !== productId);
    }
    this.renderCartItems();
  }

  renderCartItems() {
    const listEl = document.getElementById('cartItemsList');
    const emptyHint = document.getElementById('cartEmptyHint');
    const totalEl = document.getElementById('orderTotalSum');
    const submitBtn = document.getElementById('btnSubmitOrder');

    if (!listEl) return;

    let total = 0;
    listEl.innerHTML = '';

    // 1. Existing order items from server
    if (this.activeOrder && Array.isArray(this.activeOrder.items)) {
      this.activeOrder.items.forEach(it => {
        const isVoided = Boolean(it.voided || it.kitchenStatus === 'CANCELLED');
        const unitPrice = it.unitPrice ?? it.price ?? 0;
        const qty = it.quantity || 1;
        const itemTotal = it.subtotal ?? (unitPrice * qty);

        if (!isVoided) {
          total += itemTotal;
        }

        // Status pill badge
        let statusBadge = '';
        const ks = (it.kitchenStatus || '').toUpperCase();
        if (isVoided) {
          statusBadge = '<span class="item-status-pill status--cancelled">Bekor qilingan</span>';
        } else if (ks === 'READY') {
          statusBadge = '<span class="item-status-pill status--ready">Tayyor! ' + this.svgIcon('bell', 13) + '</span>';
        } else if (ks === 'COOKING' || ks === 'PREPARING') {
          statusBadge = '<span class="item-status-pill status--cooking">Pishirilmoqda</span>';
        } else if (ks === 'SENT_TO_KITCHEN' || ks === 'ACCEPTED') {
          statusBadge = '<span class="item-status-pill status--sent">Oshxonaga yuborilgan</span>';
        } else if (ks === 'SERVED' || ks === 'DELIVERED') {
          statusBadge = '<span class="item-status-pill status--served">Yetkazilgan</span>';
        } else {
          statusBadge = '<span class="item-status-pill status--sent">Kutilmoqda</span>';
        }

        const row = document.createElement('div');
        row.className = 'cart-item';
        if (isVoided) row.style.opacity = '0.5';

        row.innerHTML = `
          <div style="flex: 1; min-width: 0;">
            <div class="cart-item-name" style="${isVoided ? 'text-decoration: line-through;' : ''}">
              ${this.svgIcon('utensils', 14)} ${it.productName || it.name}
            </div>
            <div class="cart-item-price">
              ${qty} x ${this.formatMoney(unitPrice)} UZS = <strong>${this.formatMoney(itemTotal)} UZS</strong>
            </div>
            <div>${statusBadge}</div>
          </div>
          <div class="cart-item-actions">
            ${!isVoided ? `
              <button type="button" class="btn-item-cancel" onclick="app.openCancelItemModal('${it.id}')" title="Bekor qilish">
                ${this.svgIcon('x', 13)} Bekor
              </button>
              <button type="button" class="btn-item-add" onclick="app.quickAddMore('${it.productId || it.id}')" title="Yana 1 ta qo‘shish">
                
              </button>
            ` : ''}
          </div>
        `;
        listEl.appendChild(row);
      });
    }

    // 2. New items added to cart in this session
    if (this.cart.length > 0) {
      this.cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
          <div style="flex: 1; min-width: 0;">
            <div class="cart-item-name">${this.svgIcon('plus', 13)} ${item.name} <span style="font-size: 11px; color: #10b981; font-weight: 700;">(Yangi)</span></div>
            <div class="cart-item-price">${item.quantity} x ${this.formatMoney(item.price)} UZS = <strong>${this.formatMoney(itemTotal)} UZS</strong></div>
          </div>
          <div class="cart-qty-ctrl">
            <button type="button" class="qty-btn" onclick="app.updateCartQty('${item.productId}', -1)">-</button>
            <span class="qty-val">${item.quantity}</span>
            <button type="button" class="qty-btn" onclick="app.updateCartQty('${item.productId}', 1)">+</button>
          </div>
        `;
        listEl.appendChild(row);
      });
    }

    const hasAnyItems = (this.activeOrder && this.activeOrder.items && this.activeOrder.items.length > 0) || this.cart.length > 0;
    if (emptyHint) emptyHint.style.display = hasAnyItems ? 'none' : 'block';
    if (totalEl) totalEl.textContent = `${this.formatMoney(total)} UZS`;

    if (submitBtn) {
      submitBtn.disabled = this.cart.length === 0;
    }
  }

  async submitOrder() {
    if (!this.selectedTable || this.cart.length === 0) return;

    const submitBtn = document.getElementById('btnSubmitOrder');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Yuborilmoqda...</span>';
    }

    try {
      const itemsPayload = this.cart.map(c => ({
        productId: c.productId,
        quantity: c.quantity,
        notes: ''
      }));

      const activeOrderId = this.selectedTable.currentOrderId || this.selectedTable.activeOrderId;
      let orderId = activeOrderId;

      if (this.selectedTable.status === 'OCCUPIED' && activeOrderId) {
        // Add items to existing order
        const addRes = await fetch(`${this.serverBase}/api/orders/${activeOrderId}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.auth.accessToken}`
          },
          body: JSON.stringify({ items: itemsPayload })
        });
        const addJson = await addRes.json();
        if (!addRes.ok || !addJson.success) {
          throw new Error(addJson.message || 'Mahsulotlarni buyurtmaga qo‘shishda xatolik');
        }
      } else {
        // Create new order
        const createRes = await fetch(`${this.serverBase}/api/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.auth.accessToken}`
          },
          body: JSON.stringify({
            tableId: this.selectedTable.id,
            orderType: 'DINE_IN',
            guestCount: this.selectedTable.capacity || 1,
            items: itemsPayload
          })
        });
        const createJson = await createRes.json();
        if (!createRes.ok || !createJson.success) {
          throw new Error(createJson.message || 'Buyurtma ochishda xatolik');
        }
        orderId = createJson.data ? createJson.data.id : null;
      }

      // Notify kitchen stations
      if (orderId) {
        try {
          await fetch(`${this.serverBase}/api/orders/${orderId}/send-to-kitchen`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.auth.accessToken}`
            }
          });
        } catch (kitchenErr) {
          console.warn('Could not notify kitchen:', kitchenErr);
        }
      }

      this.showToast('Buyurtma oshxonaga muvaffaqiyatli yuborildi!', 'success');
      this.closeOrderModal();
      await this.loadTables();
    } catch (err) {
      this.showToast(err.message || 'Tarmoq xatosi', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Oshxonaga Yuborish ' + this.svgIcon('arrow-right', 14) + '</span>';
      }
    }
  }

  quickAddMore(productId) {
    const prod = this.products.find(p => p.id === productId);
    if (prod) {
      this.addToCart(prod);
      this.showToast(`+1 ${prod.name} savatchaga qo‘shildi`, 'info');
    } else {
      this.showToast('Mahsulot katalogda topilmadi', 'error');
    }
  }

  // ========================================================
  // 6. ITEM CANCELLATION LOGIC
  // ========================================================
  openCancelItemModal(itemId) {
    if (!this.activeOrder || !Array.isArray(this.activeOrder.items)) return;
    const item = this.activeOrder.items.find(i => i.id === itemId);
    if (!item) return;

    this.pendingCancelItem = item;
    this.cancelQty = 1;
    this.cancelReason = 'Mijoz rad etdi';

    const nameEl = document.getElementById('cancelItemName');
    const infoEl = document.getElementById('cancelItemInfo');
    const qtySection = document.getElementById('cancelQtySection');
    const qtyVal = document.getElementById('cancelQtyVal');
    const customReasonInput = document.getElementById('inputCancelCustomReason');

    if (nameEl) nameEl.textContent = item.productName || item.name;
    const itemPrice = item.unitPrice ?? item.price ?? 0;
    if (infoEl) infoEl.textContent = `Buyurtmadagi miqdor: ${item.quantity} ta (${this.formatMoney(itemPrice)} UZS)`;

    if (Number(item.quantity) > 1) {
      if (qtySection) qtySection.style.display = 'block';
      if (qtyVal) qtyVal.textContent = '1';
    } else {
      if (qtySection) qtySection.style.display = 'none';
    }

    if (customReasonInput) customReasonInput.value = '';

    // Reset reason chips
    document.querySelectorAll('.reason-chip').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.trim() === 'Mijoz rad etdi');
    });

    const modal = document.getElementById('modalCancelItem');
    if (modal) modal.classList.add('active');
  }

  closeCancelItemModal() {
    const modal = document.getElementById('modalCancelItem');
    if (modal) modal.classList.remove('active');
    this.pendingCancelItem = null;
  }

  selectCancelReason(reason, btn) {
    this.cancelReason = reason;
    document.querySelectorAll('.reason-chip').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
  }

  changeCancelQty(delta) {
    if (!this.pendingCancelItem) return;
    const maxQty = Number(this.pendingCancelItem.quantity) || 1;
    let newQty = this.cancelQty + delta;
    if (newQty < 1) newQty = 1;
    if (newQty > maxQty) newQty = maxQty;
    this.cancelQty = newQty;

    const valEl = document.getElementById('cancelQtyVal');
    if (valEl) valEl.textContent = this.cancelQty;
  }

  async confirmCancelItem() {
    if (!this.pendingCancelItem || !this.activeOrder) return;

    const btn = document.getElementById('btnConfirmCancelItem');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>Bekor qilinmoqda...</span>';
    }

    const customReason = (document.getElementById('inputCancelCustomReason')?.value || '').trim();
    const finalReason = customReason || this.cancelReason || 'Mijoz rad etdi';

    try {
      const orderId = this.activeOrder.id;
      const itemId = this.pendingCancelItem.id;
      const payload = {
        reason: finalReason,
        quantity: this.cancelQty
      };

      const res = await fetch(`${this.serverBase}/api/orders/${orderId}/items/${itemId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.auth.accessToken}`
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Mahsulotni bekor qilishda xatolik yuz berdi');
      }

      this.showToast('Mahsulot muvaffaqiyatli bekor qilindi!', 'success');
      this.closeCancelItemModal();

      // Refresh current active order and table status
      await this.fetchActiveOrder(orderId);
      this.renderCartItems();
      await this.loadTables();
    } catch (err) {
      this.showToast(err.message || 'Xatolik yuz berdi', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>Ha, bekor qilinsin</span>';
      }
    }
  }

  // ========================================================
  // 7. KITCHEN READY NOTIFICATION & SOUND ALERT
  // ========================================================
  playKitchenReadySound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // 1-signal: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.18);

      // 2-signal: 880 Hz (A5 - yuqoriroq va jarangdor)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
      gain2.gain.setValueAtTime(0.4, ctx.currentTime + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.2);
      osc2.stop(ctx.currentTime + 0.45);
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }

  startReadyNotificationsPolling() {
    this.stopReadyNotificationsPolling();
    this.checkReadyNotifications();
    this.readyNotificationsTimer = setInterval(() => {
      this.checkReadyNotifications();
    }, 3500);
  }

  stopReadyNotificationsPolling() {
    if (this.readyNotificationsTimer) {
      clearInterval(this.readyNotificationsTimer);
      this.readyNotificationsTimer = null;
    }
  }

  async checkReadyNotifications() {
    if (!this.serverBase || !this.auth.accessToken) return;

    try {
      const res = await fetch(`${this.serverBase}/api/mobile/ready-notifications`, {
        headers: {
          'Authorization': `Bearer ${this.auth.accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!res.ok) return;
      const json = await res.json();
      if (!json.success || !Array.isArray(json.data)) return;

      const items = json.data;
      this.readyItems = items;

      // Update ready badge count on top bar
      const badge = document.getElementById('readyBadgeCount');
      if (badge) {
        if (items.length > 0) {
          badge.textContent = items.length;
          badge.style.display = 'inline-block';
        } else {
          badge.style.display = 'none';
        }
      }

      // Detect newly ready items
      const newlyReady = items.filter(item => !this.notifiedReadyItemIds.has(item.itemId));
      if (newlyReady.length > 0) {
        newlyReady.forEach(item => this.notifiedReadyItemIds.add(item.itemId));

        // Trigger sound & vibration
        this.playKitchenReadySound();
        if (navigator.vibrate) {
          try { navigator.vibrate([300, 150, 300]); } catch (e) {}
        }

        // Show floating notification banner
        const first = newlyReady[0];
        const banner = document.getElementById('kitchenReadyBanner');
        const bannerText = document.getElementById('kitchenReadyBannerText');
        if (banner && bannerText) {
          const extra = newlyReady.length > 1 ? ` (+${newlyReady.length - 1} ta)` : '';
          bannerText.textContent = `Stol #${first.tableNumber || first.tableName}: ${first.productName} (${first.quantity} ta) TAYYOR!${extra}`;
          banner.style.display = 'flex';

          if (this.activeReadyBannerTimeout) clearTimeout(this.activeReadyBannerTimeout);
          this.activeReadyBannerTimeout = setTimeout(() => {
            this.dismissReadyBanner();
          }, 8000);
        }
      }

      // If ready dishes modal is currently open, refresh it
      const readyModal = document.getElementById('modalReadyDishes');
      if (readyModal && readyModal.classList.contains('active')) {
        this.renderReadyDishesList();
      }
    } catch (e) {
      console.warn('Check ready notifications error:', e);
    }
  }

  dismissReadyBanner() {
    const banner = document.getElementById('kitchenReadyBanner');
    if (banner) banner.style.display = 'none';
    if (this.activeReadyBannerTimeout) {
      clearTimeout(this.activeReadyBannerTimeout);
      this.activeReadyBannerTimeout = null;
    }
  }

  openReadyDishesModal() {
    this.dismissReadyBanner();
    this.renderReadyDishesList();
    const modal = document.getElementById('modalReadyDishes');
    if (modal) modal.classList.add('active');
  }

  closeReadyDishesModal() {
    const modal = document.getElementById('modalReadyDishes');
    if (modal) modal.classList.remove('active');
  }

  renderReadyDishesList() {
    const listEl = document.getElementById('readyDishesList');
    const emptyHint = document.getElementById('readyDishesEmptyHint');
    if (!listEl) return;

    if (!this.readyItems || this.readyItems.length === 0) {
      listEl.innerHTML = '';
      if (emptyHint) emptyHint.style.display = 'block';
      return;
    }

    if (emptyHint) emptyHint.style.display = 'none';
    listEl.innerHTML = '';

    this.readyItems.forEach(item => {
      const card = document.createElement('div');
      card.className = 'ready-dish-card';
      const timeStr = item.readyAt ? new Date(item.readyAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      card.innerHTML = `
        <div style="flex: 1; min-width: 0;">
          <span class="ready-dish-table-badge">Stol #${item.tableNumber || item.tableName}</span>
          <div class="ready-dish-name">${this.svgIcon('utensils', 14)} ${item.productName} × ${item.quantity}</div>
          <div class="ready-dish-sub">${item.kitchenName || 'Oshxona'} ${timeStr ? '• ' + timeStr : ''}</div>
        </div>
        <button type="button" class="btn-mark-served" onclick="app.markItemServed('${item.orderId}', '${item.itemId}')">
          Yetkazildi ${this.svgIcon('check', 14)}
        </button>
      `;
      listEl.appendChild(card);
    });
  }

  async markItemServed(orderId, itemId) {
    try {
      const res = await fetch(`${this.serverBase}/api/mobile/orders/${orderId}/items/${itemId}/served`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.auth.accessToken}`
        }
      });
      if (res.ok) {
        this.showToast('Taom yetkazildi deb belgilandi!', 'success');
        this.readyItems = this.readyItems.filter(i => i.itemId !== itemId);
        this.renderReadyDishesList();
        const badge = document.getElementById('readyBadgeCount');
        if (badge) {
          badge.textContent = this.readyItems.length;
          badge.style.display = this.readyItems.length > 0 ? 'inline-block' : 'none';
        }
        if (this.selectedTable) {
          const activeOrderId = this.selectedTable.currentOrderId || this.selectedTable.activeOrderId;
          if (activeOrderId) await this.fetchActiveOrder(activeOrderId);
          this.renderCartItems();
        }
      } else {
        this.showToast('Statusni yangilashda xatolik yuz berdi', 'error');
      }
    } catch (e) {
      this.showToast('Tarmoq xatosi: ' + e.message, 'error');
    }
  }

  formatMoney(amount) {
    if (amount === undefined || amount === null) return '0';
    return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
}

// Global instance
window.app = new WaiterPosApp();
