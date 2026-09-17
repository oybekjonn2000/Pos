# Restaurant POS — Windows Desktop & Offline Installer Arxitekturasi

Ushbu hujjat **Restaurant POS** tizimini to'liq avtonom (self-contained), internetsiz ishlaydigan Windows Desktop dasturiga aylantirish, o'rnatish, ma'lumotlar bazasi va xizmatlarni boshqarish bo'yicha to'liq texnik qo'llanmadir.

---

## 1. Desktop Arxitekturasi (Offline Runtime)

```text
Windows 10 / 11 (Hech qanday dasturlarsiz toza kompyuter)
│
└─── C:\Program Files\RestaurantPOS\
     ├── RestaurantPOS.exe                (Electron Desktop Shell)
     ├── resources\app\                   (Angular 22 Production UI)
     ├── backend\restaurant-pos-api.jar   (Spring Boot 3.4 API)
     ├── jre\                             (Bundled Java Runtime 21 via jlink)
     └── pgsql\                           (Portable PostgreSQL 18 Binaries)
          ├── bin\ (initdb, pg_ctl, createdb, pg_dump, etc.)
          ├── lib\
          └── share\

Ma'lumotlar Saqlanadigan Joy:
└─── C:\ProgramData\RestaurantPOS\
     ├── PostgreSQL\data\                 (Haqiqiy baza fayllari)
     ├── config\application.properties    (Lokal konfiguratsiya)
     ├── uploads\                         (Mahsulot rasmlari)
     ├── receipts\                        (TXT kassa va oshxona cheklari)
     ├── logs\app.log                     (Tizim loglari)
     └── backups\                         (Avtomatik zaxira nusxalari)
```

---

## 2. Ishga Tushish Ketma-Ketligi (Startup Sequence)

Foydalanuvchi Desktopdagi **Restaurant POS** yorlig'ini ochganda:

1. **Splash Screen ochiladi:**
   - Dastur 480x360 o'lchamdagi zamonaviy Dark Mode darchasini ko'rsatadi.
   - Status: *"1/3: Mahalliy ma'lumotlar bazasi tekshirilmoqda..."*
2. **PostgreSQL tekshiruvi & start:**
   - Electron 5433-portni tekshiradi.
   - Agar PostgreSQL ishlamayotgan bo'lsa, `{app}\pgsql\bin\pg_ctl.exe start` orqali `%ProgramData%\RestaurantPOS\PostgreSQL\data` klasteri ishga tushiriladi.
   - Agar klaster hali yaratilmagan bo'lsa, avtomatik ravishda `initdb.exe` orqali yaratiladi va `pos` bazasi ochiladi.
3. **Spring Boot ishga tushirilishi:**
   - Status: *"2/3: POS server ishga tushirilmoqda..."*
   - Bundled JRE (`{app}\jre\bin\java.exe`) orqali Spring Boot JAR ishga tushiriladi (`127.0.0.1:8080`).
   - Xotira optimallashtirilgan: `-Xms128m -Xmx512m`.
4. **Health Check Polling & Migratsiya:**
   - Status: *"3/3: Tizim sozlanmoqda va tekshirilmoqda..."*
   - Electron har 800ms da `http://127.0.0.1:8080/actuator/health` endpointini so'raydi.
   - Spring Boot startupda Flyway avtomatik ravishda barcha migratsiyalarni (V1 dan V26 gacha) bazaga tatbiq etadi.
   - `status === 'UP'` bo'lishi bilan splash oynasi yopiladi va asosiy POS oynasi maksimal hajmda (fullscreen) ochiladi.
5. **Dasturdan Chiqish (Graceful Shutdown):**
   - Foydalanuvchi dasturni yopganda, Electron Spring Boot jarayonini va lokal ishga tushirilgan PostgreSQL xizmatini to'xtatadi.

---

## 3. Bundled Java Runtime (JRE 21)

Yakuniy foydalanuvchida Java o'rnatilgan bo'lishi talab qilinmaydi.
Installer tarkibida `jlink` orqali yaratilgan ~77 MB hajmli mustaqil JRE mavjud:
- Kerakli modullar:
  `java.base, java.desktop, java.sql, java.naming, java.management, java.instrument, java.security.jgss, java.net.http, java.compiler, java.rmi, jdk.crypto.ec, jdk.unsupported`
- Debug ma'lumotlari va keraksiz boshqa vositalar olib tashlangan (`--strip-debug --no-man-pages --no-header-files`).

---

## 4. Bundled PostgreSQL 18

- Portativ binar fayllar: `bin`, `lib`, `share`.
- Baza ma'lumotlari dastur o'rnatilgan papkada (Program Files) EMAS, Windows standarti bo'yicha yozish huquqiga ega bo'lgan `%ProgramData%\RestaurantPOS\PostgreSQL\data` papkasida saqlanadi.
- Ulanish parametri: `127.0.0.1:5433` (Standart 5432-portdagi boshqa xizmatlar bilan to'qnashmasligi uchun 5433 tanlangan).
- Foydalanuvchi: `pos_user`, Parol: `123`.

---

## 5. Yangilash (Upgrade) va Zaxiralash (Backup)

### Zaxiralash (Backup):
- Baza zaxira nusxasi avtomatik yoki qo'lda `scripts/backup-db.bat` orqali olinadi:
  ```cmd
  scripts\backup-db.bat
  ```
- Zaxira fayli `%ProgramData%\RestaurantPOS\backups\POS_Backup_YYYYMMDD_HHMMSS.sql` ko'rinishida saqlanadi.

### Yangilash (Upgrade):
- Yangi versiya chiqqanda, yangi `RestaurantPOS-Setup-x.x.x.exe` ni mavjud dastur ustiga o'rnatish kifoya.
- O'rnatuvchi dastur fayllarini yangilaydi, lekin `%ProgramData%\RestaurantPOS\PostgreSQL\data` dagi ma'lumotlarni saqlab qoladi.
- Yangi versiya ishga tushganda, yangi Flyway migratsiyalari avtomatik qo'llaniladi.

---

## 6. O'chirish (Uninstall) Xavfsizligi

Windows "Apps & Features" orqali dastur o'chirilganda:
1. Dastur fayllari (`C:\Program Files\RestaurantPOS`) butunlay o'chiriladi.
2. Uninstaller foydalanuvchiga tasdiqlash darchasini ko'rsatadi:
   > *"Barcha ma'lumotlar bazasi, savdo tarixi, mahsulot rasmlari va cheklar ham o'chirilsinmi? Standart holatda ma'lumotlarni saqlab qolish uchun 'Yo'q' tugmasini bosing."*
3. Standart tugma sifatida **"Yo'q" (NO)** tanlangan, bu tasodifiy ma'lumot yo'qotilishining oldini oladi.

---

## 7. Bitta Buyruq Orqali Installerni Yig'ish (Build Installer)

Dasturchi uchun to'liq avtomatlashtirilgan build skripti:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\build-installer.ps1
```
yoki:
```cmd
scripts\build-installer.bat
```

### Skript bosqichlari:
1. `ng build --configuration production --base-href ./`
2. `mvn package -DskipTests`
3. `jlink` orqali JRE 21 ni ajratish
4. PostgreSQL 18 portativ fayllarini nusxalash
5. `npm run pack` (Electron unpacked Desktop shell)
6. Inno Setup `ISCC.exe` orqali `RestaurantPOS-Setup-1.0.0.exe` va `POS-Setup.exe` yaratish.

Natijaviy fayl: `dist\installer\RestaurantPOS-Setup-1.0.0.exe` (~120-150 MB).
