# MULTI-TENANT RESTAURANT POS ARXITEKTURASI

Ushbu hujjat O'zbekiston bo'ylab yuzlab restoran, kafe va ovqatlanish tarmoqlariga o'rnatish uchun moslashtirilgan ko'p ijarachili (Multi-Tenant) Restaurant POS tizimining to'liq texnik va xavfsizlik arxitekturasini bayon qiladi.

---

## 1. Umumiy Arxitektura (Architecture Overview)

Loyiha **Yagona Ma'lumotlar Bazasi + Mantiqiy Izolyatsiya (Single Database, Logical Partitioning with Tenant ID)** modelida qurilgan:

```
                          ┌───────────────────────────┐
                          │   Platform Super Admin    │
                          │   (superadmin / NULL)     │
                          └─────────────┬─────────────┘
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
     ┌───────────────────────┐                     ┌───────────────────────┐
     │ Restaurant: DEMO001   │                     │ Restaurant: TASH001   │
     │ Name: Demo Restaurant │                     │ Name: Toshkent Milliy │
     │ Status: ACTIVE        │                     │ Status: ACTIVE        │
     └───────────┬───────────┘                     └───────────┬───────────┘
                 │                                             │
      ┌──────────┴──────────┐                       ┌──────────┴──────────┐
      │ Users (admin, w1)   │                       │ Users (admin, w1)   │
      │ Zones & Tables      │                       │ Zones & Tables      │
      │ Kitchens & Menu     │                       │ Kitchens & Menu     │
      │ Orders & Payments   │                       │ Orders & Payments   │
      │ Hardware Config     │                       │ Hardware Config     │
      └─────────────────────┘                       └─────────────────────┘
```

### Asosiy Tamoyillar:
1. **Zero-Trust Frontend:** Frontend yuborgan hech bir `restaurantId` yoki `tenantId` ga ishonilmaydi. Manba har doim serverda tekshirilgan va imzolangan JWT token hisoblanadi.
2. **Strict Backend TenantContext:** Har bir HTTP so'rovida `UserPrincipal` orqali `tenantId` olinadi va ThreadLocal `TenantContext` ga o'rnatiladi.
3. **Foreign Key Integrity & Anti-Hijacking:** Bir restoranga tegishli buyurtma, mahsulot yoki stol boshqa restoranning ma'lumotlariga bog'lanishi qat'iyan taqiqlanadi (400 Bad Request / 404 Not Found).
4. **Collision-Free Usernames:** Bir xil username (masalan, `waiter1`) turli restoranlarda bemalol mavjud bo'lishi mumkin. Unique kalit: `(tenant_id, lower(username))`.

---

## 2. Restoran Modeli (Restaurant / Tenant Model)

Har bir restoran alohida ijarachi (tenant) hisoblanadi:

```sql
TABLE tenants (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255) NOT NULL,
    code          VARCHAR(50) NOT NULL UNIQUE,      -- REST001, DEMO001, TASH001
    slug          VARCHAR(100),
    phone         VARCHAR(50),
    email         VARCHAR(255),
    address       TEXT,
    inn           VARCHAR(50),                     -- Soliq to'lovchi STIR/INN
    currency      VARCHAR(10) DEFAULT 'UZS',
    status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, INACTIVE
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMP WITH TIME ZONE
);
```

### Status Lifecycle:
- `ACTIVE`: Restoran to'liq rejimda ishlaydi, foydalanuvchilar kirishi va savdo qilishi mumkin.
- `SUSPENDED`: To'lov to'lanmagan yoki litsenziya to'xtatilgan holat. Foydalanuvchilar kirishi bloklanadi (`403 Forbidden: Ushbu restoran faoliyati to'xtatilgan`).
- `INACTIVE`: Restoran butunlay nofaol qilingan.

---

## 3. JWT va Xavfsizlik Arxitekturasi (JWT & Security)

### JWT Payload Strukturasi:
```json
{
  "sub": "c0000000-0000-0000-0000-000000000000",
  "username": "admin_tash",
  "tenantId": "a9b74474-1db5-40e8-8b2a-bcca084464ad",
  "restaurantCode": "TASH001",
  "role": "RESTAURANT_ADMIN",
  "isSuperAdmin": false,
  "iat": 1789760000,
  "exp": 1789846400
}
```

*Eslatma: `SUPER_ADMIN` foydalanuvchisi uchun `tenantId` NULL bo'ladi va `isSuperAdmin: true` belgilanadi.*

### Dinamik Login Rezolyutsiyasi:
Foydalanuvchi tizimga kirishida quyidagi 3 bosqichli xavfsiz avtorizatsiya amalga oshiriladi:
1. Agar foydalanuvchi `restaurantCode` kiritsa: Foydalanuvchi to'g'ridan-to'g'ri shu restoran bazasidan qidiriladi (`findByRestaurantCodeAndUsername`).
2. Agar `restaurantCode` kiritilmasa:
   - Agar username `superadmin` bo'lsa yoki platforma admini bo'lsa (`tenant IS NULL`), u platforma admini sifatida kiradi.
   - Agar username O'zbekiston bo'ylab yagona bo'lsa, avtomatik ravishda uning restorani aniqlanadi.
   - Agar bir xil username bir nechta restoranda mavjud bo'lsa (masalan, `waiter1`), tizim foydalanuvchidan `restaurantCode` kiritishni talab qiladi (`400 Bad Request: Bir nechta restoranda ushbu username mavjud`).

---

## 4. Repository va Ma'lumotlar Izolyatsiyasi (Repository Isolation)

Barcha SQL querylar va JPA Repository metodlari tenant darajasida filtrlanadi:

```java
// Notog'ri (Global xavfli query):
findById(id);
findAll();

// To'g'ri (Tenant-Scoped himoyalangan query):
findByIdAndTenantIdAndDeletedAtIsNull(id, tenantId);
findAllByTenantIdAndDeletedAtIsNull(tenantId);
existsByIdAndTenantIdAndDeletedAtIsNull(id, tenantId);
```

### IDOR (Insecure Direct Object Reference) Himoyasi:
Agar Restoran A xodimi URL manzilida Restoran B ning Order ID, Product ID yoki Table ID raqamini ko'rsatib so'rov yuborsa:
- Repository `tenantId` bo'yicha qidiradi;
- Boshqa restoranning IDsi bo'lgani sababli `Optional.empty()` qaytadi;
- Tizim xavfsiz ravishda `404 Not Found` (yoki `403 Forbidden`) qaytaradi.
- Ma'lumot hech qachon sizib chiqmaydi (Zero Data Leakage).

---

## 5. Cross-Tenant Foreign Key (FK) Hijacking Himoyasi

Tizimda boshqa restoranning ma'lumotlariga bog'lanish harakatlari barcha darajalarda bloklangan:
- **Order yaratishda:** `Table` va `Waiter` so'rov jo'natgan foydalanuvchining `tenantId` siga tegishli ekanligi tekshiriladi.
- **Mahsulot yaratishda:** `Category` va `Kitchen` aynan o'sha restoranning o'ziga tegishli bo'lishi shart.
- **Kategoriya yaratishda:** `Kitchen` o'sha restoranga tegishli bo'lishi shart.
- Agar foydalanuvchi boshqa restoranning `categoryId` yoki `tableId` sini jo'natsa, server darhol `400 Bad Request` xatosi qaytaradi.

---

## 6. Ma'lumotlar Bazasidagi Aloqalar va Cheklovlar (DB Schema & Constraints)

```sql
-- Foydalanuvchilar izolyatsiyasi:
CREATE UNIQUE INDEX uq_users_tenant_username ON users(tenant_id, lower(username)) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_users_null_tenant_username ON users(lower(username)) WHERE tenant_id IS NULL AND deleted_at IS NULL;

-- Stollar izolyatsiyasi (Har bir restoranda "Stol 1", "Stol 2" bo'lishi mumkin):
CREATE UNIQUE INDEX uq_tables_tenant_table_number ON tables(tenant_id, table_number) WHERE deleted_at IS NULL;

-- Oshxonalar izolyatsiyasi:
CREATE UNIQUE INDEX uq_kitchens_tenant_code ON kitchens(tenant_id, lower(code)) WHERE deleted_at IS NULL;

-- Boshqaruv indekslari:
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_tables_tenant_id ON tables(tenant_id);
CREATE INDEX idx_kitchen_orders_tenant_id ON kitchen_orders(tenant_id);
```

---

## 7. Ma'lumotlarni Tozalash Markazi (Isolated Reset Center)

`ResetService` multi-tenant arxitekturada har bir restoranning ma'lumotlarini qat'iy chegaralaydi:
- Restoran admini o'z buyurtmalarini tozalaganda (`POST /api/settings/reset/orders`), faqat `tenant_id = currentTenantId` bo'lgan yozuvlar o'chiriladi:
  - `kitchen_order_items`
  - `kitchen_orders`
  - `order_items`
  - `payments`
  - `orders`
  - `tables` bandlik holatlari `AVAILABLE` ga qaytariladi.
- **Boshqa restoranlarning hech bir buyurtmasiga yoki statistikasiga daxl qilinmaydi.**
- Tozalash paytida foydalanuvchilar, rollar va tizim printerlari o'chirilmaydi.

---

## 8. WebSocket va STOMP Oshxona Izolyatsiyasi (WebSocket Isolation)

Oshxona displeyi (KDS) va yangi buyurtma bildirishnomalari uchun STOMP kanallari tenant ID bilan ajratilgan:
- Global broadcast yo'q.
- Har bir xabar faqat tegishli oshxona va restoran tinglovchilariga yuboriladi.
- Boshqa restoranning oshpazi begona buyurtma xabarlarini eshitmaydi.

---

## 9. Printer Arxitekturasi (Printer Isolation)

- **Physical Windows Printers:** Operatsion tizim (Windows) drayveri darajasidagi printerlar server kompyuterda umumiy hisoblanadi.
- **POS Printer Configuration:** Har bir restoranning printer profillari (`printers` va `printer_assignments` jadvallari) `tenant_id` bilan to'liq izolyatsiya qilingan. Restoran A ning printer sozlamalari Restoran B ga ko'rinmaydi.

---

## 10. Platforma Boshqaruvi (Super Admin Platform Isolation)

SUPER_ADMIN oddiy restoran admini yoki xodimi bilan bir xil Dashboard yoki POS interfeysidan foydalanmaydi. U butun POS platformasining markaziy administratoridir:
1. **Alohida Platforma Dashboardi (`/platform/dashboard`):**
   - Tarmoq bo'yicha KPI ko'rsatkichlari: Jami restoranlar, Faol filiallar, Bloklangan filiallar, Tarmoq bo'yicha xodimlar soni, Davr bo'yicha yalpi savdo aylanmasi va o'rtacha chek.
   - Davr filtrlari: Bugun (`TODAY`), Kecha (`YESTERDAY`), Bu hafta (`THIS_WEEK`), Bu oy (`THIS_MONTH`), Umumiy (`ALL`).
2. **Restoranlar Boshqaruvi (`/platform/restaurants`):**
   - Filiallar ro'yxati, rekvizitlar (INN, Manzil, Telefon), status boshqaruvi (`ACTIVE`, `SUSPENDED`, `INACTIVE`), yangi restoran va admin yaratish.
3. **360 Darajali Restoran Monitoringi (`/platform/restaurants/:id`):**
   - Restoran pasporti, xodimlar lavozimlar bo'yicha soni, davriy kassa tushumlari va **Faqat READ-ONLY monitoring** uchun buyurtmalar oqimi.
   - SUPER_ADMIN buyurtmaga mahsulot qo'shmaydi, stol ochmaydi, to'lov qabul qilmaydi.
4. **Savdo Monitoringi (`/platform/sales`):**
   - Barcha restoranlarning naqd, karta va umumiy tushumlari, filiallar bo'yicha tushum ulushi (share bar).
5. **Xodimlar Monitoringi (`/platform/employees`):**
   - Tarmoq bo'yicha barcha xodimlarni filtrlash, kerak bo'lganda hisobini to'xtatish (`active: false`) yoki qayta yoqish (`active: true`).
6. **Konsolidatsiyalangan Hisobotlar (`/platform/reports`):**
   - Vaqt oraliqlari bo'yicha tahlil, filiallar taqsimoti va chop etish (print) imkoniyati.
7. **Backend Himoyasi (`/api/platform/**`):**
   - Barcha platforma API'lari faqat `ROLE_SUPER_ADMIN` uchun ochiq. Restoran xodimlari yoki adminlari kirishga uringanda darhol `403 Forbidden` bilan bloklanadi.

---

## 11. O'tkazilgan Xavfsizlik va Integratsiya Testlari

To'liq 11 bosqichli avtomatlashtirilgan test ssenariysi muvaffaqiyatli yakunlandi:
- `test_multi_tenant_complete.py` barcha talablarni 100% bajardi:
  1. Super Admin autentifikatsiyasi va restoran yaratish.
  2. Restoran admini ruxsati va chegaralanishi.
  3. DEMO001 va TASH001 mustaqil modullari.
  4. Cross-tenant mahsulot, stol, kategoriya va buyurtma ro'yxatlari daxlsizligi.
  5. IDOR hujumlarining to'liq bloklanishi (404/403).
  6. Foreign Key orqali ma'lumotlarni o'g'irlash yoki soxtalashtirishning oldi olinishi (400 Bad Request).
  7. Turli restoranlarda bir xil username (`waiter1`) ishlashi.
  8. Ma'lumotlarni tozalash (Reset) jarayonida qo'shni restoranlarning 100% himoyalanganligi.
  9. Restoran faoliyatini to'xtatish (SUSPENDED) va qayta faollashtirish (ACTIVE) jarayoni.
  10. Mavjud POS buyurtma, oshxona jo'natish, hisob yopish va kassa to'lov operatsiyalari saqlanganligi.

---

## 12. Kelgusida Masshtablash (Future Scaling Strategy)

Hozirgi `Single DB + Logical Tenant ID` modeli O'zbekistondagi yuzlab restoranlar uchun eng optimal, tezkor va arzon operatsion yechim hisoblanadi.

Kelajakda juda katta korporativ tarmoqlar (minglab filiallar) uchun tizim quyidagilarga kengaytirilishi mumkin:
1. **Schema-per-tenant:** Har bir restoranga PostgreSQL ichida alohida `SCHEMA` ochish (Hibernate Multi-Tenancy orqali ulanadi).
2. **Database-per-tenant:** Katta premium mijozlar uchun alohida mustaqil PostgreSQL ma'lumotlar bazasi ajratish.
3. Hozirgi `TenantContext` va repository qatlamimiz kelajakda ushbu modellarga o'tish uchun 100% tayyor holatda arxitektura qilingan.
