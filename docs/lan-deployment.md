# RESTAURANT POS — MULTI-PC LOCAL AREA NETWORK (LAN) DEPLOYMENT GUIDE

Ushbu qo'llanma restoran hududida **bitta markaziy Server (Admin PC)** va unga ulangan **mijoz terminallari (Ofitsiantlar, Oshxonalar / KDS, Kassirlar)** ni mahalliy tarmoq (LAN) orqali internet talab qilmasdan, 100% mustaqil va real-time sinxron holatda sozlash bo'yicha to'liq instruksiyadir.

---

## 1. Arxitektura Xaritasi

```
                               ┌────────────────────────┐
                               │   LAN Router / Switch  │
                               │   (Wi-Fi & Ethernet)   │
                               │      192.168.1.1       │
                               └───────────┬────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         │                                 │                                 │
         ▼                                 ▼                                 ▼
┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐
│     ADMIN / SERVER PC   │   │     WAITER CLIENT PC    │   │    KITCHEN CLIENT PC    │
│      192.168.1.100      │   │      192.168.1.101      │   │      192.168.1.102      │
│                         │   │                         │   │                         │
│ • Central PostgreSQL    │   │ • Angular POS Desktop   │   │ • Angular POS Desktop   │
│   (Port 5433, Localhost)│   │ • NO PostgreSQL         │   │ • NO PostgreSQL         │
│ • Central Spring Boot   │   │ • NO Java Runtime       │   │ • NO Java Runtime       │
│   (Port 8080, LAN)      │   │ • Dynamic Server URL    │   │ • Station Filtering     │
│ • UDP Discovery Beacon  │   │ • Auto-Reconnect Engine │   │ • Auto-Reconnect Engine │
│   (Port 38888, UDP)     │   │ • Zero Prerequisites    │   │ • Zero Prerequisites    │
│ • Admin Desktop UI      │   │                         │   │                         │
└─────────────────────────┘   └─────────────────────────┘   └─────────────────────────┘
```

---

## 2. Asosiy Qoidalar (Core Rules)

1. **Yagona Haqiqat Manbai (Single Source of Truth):**
   * Butun restoranda faqat **1 ta PostgreSQL ma'lumotlar bazasi** bo'ladi va u faqat Server kompyuterda joylashadi.
   * Client (Ofitsiant/Oshxona) kompyuterlarida alohida ma'lumotlar bazasi **bo'lmaydi**.
2. **Xavfsizlik (Security):**
   * PostgreSQL porti (`5433`) tashqi LAN tarmog'iga ochilmaydi (faqat server ichida `127.0.0.1` ga bog'langan).
   * Baza login/paroli hech qachon mijoz paketlariga kiritilmaydi.
   * Mijozlar faqat Spring Boot API va WebSocket (`:8080`) orqali xavfsiz JWT autentifikatsiya bilan muloqot qiladi.
3. **Internetsizlik (100% Offline Capability):**
   * Tizim ishlashi uchun tashqi internet umuman talab etilmaydi. Wi-Fi yoki LAN kabel ulangan oddiy router kifoya.

---

## 3. Server Kompyuterini O'rnatish va Sozlash (Admin PC)

### 3.1. O'rnatish
1. Server kompyuterga **`RestaurantPOS-Server-Setup-1.0.0.exe`** (yoki `POS-Server-Setup.exe`) faylini yuklang.
2. O'rnatuvchini ishga tushiring va **Install** tugmasini bosing.
3. O'rnatuvchi avtomatik ravishda:
   * JRE 21 va PostgreSQL 18 binarilarini o'rnatadi.
   * `%ProgramData%\RestaurantPOS\PostgreSQL\data` ma'lumotlar klasterini yaratadi.
   * Windows Firewall'da `8080 (TCP)` va `38888 (UDP)` portlarini ochadi.
   * Ish stoliga va Start Menuga yorliq joylaydi.

### 3.2. Serverga Statik LAN IP Berish
Server IP manzili o'zgarib ketmasligi uchun routerning DHCP sozlamalarida yoki Windows'da statik IP belgilang:
* **IP manzil:** `192.168.1.100` (yoki routerning bo'sh bitta IP'si)
* **Subnet mask:** `255.255.255.0`
* **Default gateway:** `192.168.1.1`

*Windows'da tekshirish:* PowerShell yoki CMD'da `ipconfig` buyrug'ini tering va `IPv4 Address` qatorini ko'ring.

---

## 4. Mijoz Kompyuterlarini O'rnatish (Waiter & Kitchen PCs)

### 4.1. O'rnatish
1. Ofitsiant yoki Oshxona kompyuteriga faqat **`RestaurantPOS-Client-Setup-1.0.0.exe`** (~65 MB) faylini olib boring.
2. Ishga tushiring va bir necha soniyada o'rnating.
   *(Ushbu kompyuterlarga Node.js, Java yoki PostgreSQL o'rnatish talab etilmaydi!)*

### 4.2. Serverga Bog'lanish (Auto-Discovery & Manual)
Dastur birinchi marta ishga tushganda:
1. **Avtomatik Kashfiyot (UDP Auto-Discovery):**
   * Dastur ochilishi bilan tarmoq bo'ylab markaziy serverni qidiradi.
   * Agar server topilsa, uning IP manzilini darhol aniqlab, ulanadi.
2. **Qo'lda Kiritish (Manual Fallback):**
   * Agar routerda UDP broadcast bloklangan bo'lsa, pastki qismdagi **"🌐 LAN Sozlamalari"** yoki ogohlantirish banneridagi **"Sozlash"** tugmasini bosing.
   * Server IP: `192.168.1.100`
   * Server Port: `8080`
   * **[ ⚡ Ulanishni Tekshirish ]** tugmasini bosing.
   * Agar "✅ Ulanish muvaffaqiyatli!" ko'rinsa, **[ 💾 Saqlash va Ulanish ]** ni bosing.

---

## 5. Real-Time Sinxronizatsiya va Ishlash Jarayoni

```
1. Ofitsiant (Terminal 1):
   Stol 5 tanlandi -> Taomlar qo'shildi -> "Oshxonaga" tugmasi bosildi.
   │
   ▼ (HTTP POST /api/orders/{id}/send-to-kitchen)
2. Markaziy Server:
   Ma'lumotlar bazasida tranzaksiya ochildi -> Buyurtma saqlandi ->
   Chiptalar oshxonalar bo'yicha guruhlandi (Pitsaxona, Bar, Milliy taomlar).
   │
   ├─► WebSocket (/topic/kitchen/{pitsaxonaId}) ──► Pitsaxona Ekrani (Faqat pitsalar)
   ├─► WebSocket (/topic/kitchen/{barId})       ──► Bar Ekrani (Faqat ichimliklar)
   └─► WebSocket (/topic/orders/{tenantId})    ──► Barcha Kassa va Ofitsiantlar

3. Oshxona Oshpazi (Pitsaxona):
   Pitsa tayyor bo'lgach "Tayyor" tugmasini bosadi.
   │
   ▼ (PATCH /api/kitchen/orders/{id}/items/{itemId}/status)
4. Markaziy Server:
   Status READY qilindi -> Baza saqlandi.
   │
   └─► WebSocket (/topic/orders/{tenantId}) ──► Ofitsiant 1 Ekranida darhol "Tayyor (Yashil)" aks etadi.
```

---

## 6. Dublikat Buyurtmalardan Himoya (Duplicate Protection)

Tarmoq kechikishi yoki ofitsiant tasodifan "Oshxonaga" tugmasini tezlik bilan ikki marta bosganda:
* Birinchi so'rov taomlarni oshxonaga jo'natadi va ularning holatini `SENT_TO_KITCHEN` ga o'zgartiradi.
* Ikkinchi so'rov serverga kelganda, server taomlar allaqachon yuborilganini aniqlaydi va ikkinchi marta takroriy chipta yaratmasdan, mavjud buyurtmani qaytaradi.

---

## 7. Tarmoq Uzilishi va Qayta Ulanish (Disconnect & Auto-Reconnect)

* **Agar Wi-Fi uzilsa yoki Server o'chsa:**
  * Terminal ekranining yuqorisida qizil banner chiqadi:
    `🔴 Server bilan aloqa uzildi! Qayta ulanilmoqda (http://192.168.1.100:8080)...`
  * Dastur avtomatik ravishda exponential backoff (2s, 4s, 8s, 10s) bilan serverni tekshirib turadi.
* **Server qayta yoqilganda:**
  * Terminalda yashil banner chiqadi:
    `🟢 Aloqa tiklandi! Markaziy server bilan barcha ma'lumotlar qayta sinxronlandi.`
  * WebSocket avtomatik qayta ulanadi va ekrandagi stollar hamda buyurtmalar oxirgi haqiqiy holatiga yangilanadi.

---

## 8. Windows Firewall Qoidalari (Muammolarni Bartaraf Qilish)

Server Inno Setup o'rnatuvchisi quyidagi qoidalarni avtomatik kiritadi. Agar qo'lda ochish kerak bo'lsa, Server PC'da Administrator huquqi bilan PowerShell'da ishga tushiring:

```powershell
# Spring Boot API & WebSocket (TCP 8080)
netsh advfirewall firewall add rule name="RestaurantPOS Server (TCP 8080)" dir=in action=allow protocol=TCP localport=8080 profile=private,domain

# Server Auto-Discovery (UDP 38888)
netsh advfirewall firewall add rule name="RestaurantPOS Discovery (UDP 38888)" dir=in action=allow protocol=UDP localport=38888 profile=private,domain
```

---

## 9. Zaxira Nusxalash (Backup)

Serverdagi barcha ma'lumotlar quyidagi yo'lda saqlanadi:
* **Ma'lumotlar klasteri:** `C:\ProgramData\RestaurantPOS\PostgreSQL\data`
* **Rasmlar (Uploads):** `C:\ProgramData\RestaurantPOS\uploads`
* **Cheklar (Receipts):** `C:\ProgramData\RestaurantPOS\receipts`
* **Avtomatik Backup:** `C:\ProgramData\RestaurantPOS\backups`

Istalgan vaqtda qo'lda backup olish uchun serverda quyidagi skriptni bosing:
`scripts\backup-db.bat`
U `POS_Backup_YYYYMMDD_HHMMSS.sql` faylini `backups` papkasida hosil qiladi.
