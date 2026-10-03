@echo off
setlocal enabledelayedexpansion

title Restaurant POS - Build Server Demo EXE
echo ========================================================
echo       RESTAURANT POS - SERVER DEMO BUILD
echo  (Spring Boot Backend + PostgreSQL + Desktop UI + LAN)
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

:: 0. Muhit o'zgaruvchilari va asboblarni avtomatik aniqlash (JDK 21, Maven, Node)
if not defined JAVA_HOME (
    if exist "C:\Program Files\Java\jdk-21.0.12.1" set "JAVA_HOME=C:\Program Files\Java\jdk-21.0.12.1"
    if exist "C:\Program Files\Java\latest" set "JAVA_HOME=C:\Program Files\Java\latest"
    if exist "C:\Program Files\Java\jdk-21" set "JAVA_HOME=C:\Program Files\Java\jdk-21"
    if exist "C:\Program Files\Java\jdk-21.0.12" set "JAVA_HOME=C:\Program Files\Java\jdk-21.0.12"
    if exist "%USERPROFILE%\.jdks\jbr-21.0.11" set "JAVA_HOME=%USERPROFILE%\.jdks\jbr-21.0.11"
)
if defined JAVA_HOME set "PATH=%JAVA_HOME%\bin;%PATH%"
if exist "C:\apache-maven-3.9.16\bin" set "PATH=C:\apache-maven-3.9.16\bin;%PATH%"
if exist "%USERPROFILE%\tools\apache-maven-3.9.9\bin" set "PATH=%USERPROFILE%\tools\apache-maven-3.9.9\bin;%PATH%"

set "MVN_CMD=mvn.cmd"
where mvn.cmd >nul 2>&1
if %errorlevel% neq 0 (
    if exist "%ROOT_DIR%backend\restaurant-pos-api\mvnw.cmd" (
        set "MVN_CMD=%ROOT_DIR%backend\restaurant-pos-api\mvnw.cmd"
    ) else (
        set "MVN_CMD=mvn"
    )
)

:: 1. Ishlayotgan eski demo jarayonlarini xavfsiz to'xtatish
echo [1/5] Ishlayotgan eski demo jarayonlarini to'xtatish...
taskkill /F /IM POS-Server-Demo.exe /T >nul 2>&1
taskkill /F /IM RestaurantPOS-Server.exe /T >nul 2>&1
taskkill /F /IM POS-Demo.exe /T >nul 2>&1
taskkill /F /IM RestaurantPOS.exe /T >nul 2>&1
timeout /t 1 /nobreak >nul

:: 2. Backend Spring Boot fat JAR build qilish
echo.
echo [2/5] Backend Spring Boot paketi (JAR) tayyorlanmoqda...
cd /d "%ROOT_DIR%backend\restaurant-pos-api"
call %MVN_CMD% package -DskipTests
if %errorlevel% neq 0 (
    echo.
    echo ========================================================
    echo [XATOLIK] Backend Maven paketlashda xatolik yuz berdi!
    echo ========================================================
    cd /d "%ROOT_DIR%"
    if "%~1"=="" pause
    exit /b 1
)

:: 3. Angular frontend build qilish (desktop rejimi)
echo.
echo [3/5] Angular frontend build qilinmoqda (desktop rejimi)...
cd /d "%ROOT_DIR%frontend\angular-pos"
call npm.cmd run build:desktop
if %errorlevel% neq 0 (
    echo.
    echo ========================================================
    echo [XATOLIK] Frontend build qilishda xatolik yuz berdi!
    echo ========================================================
    cd /d "%ROOT_DIR%"
    if "%~1"=="" pause
    exit /b 1
)

:: 4. Electron Server Demo Portable EXE yaratish
echo.
echo [4/5] Electron Server Demo Portable EXE tayyorlanmoqda...
cd /d "%ROOT_DIR%desktop\electron"
call npx.cmd electron-builder --config electron-builder.server-demo.json
if %errorlevel% neq 0 (
    echo.
    echo ========================================================
    echo [XATOLIK] Electron builder orqali EXE yaratishda xatolik!
    echo ========================================================
    cd /d "%ROOT_DIR%"
    if "%~1"=="" pause
    exit /b 1
)

:: 5. Natijani demo papkasiga ko'chirish va tozalash
echo.
echo [5/5] Server Demo fayli joylashtirilmoqda va tozalash...
cd /d "%ROOT_DIR%"
if not exist "demo" mkdir "demo"

if exist "dist\demo-server-build\POS-Server-Demo.exe" (
    move /y "dist\demo-server-build\POS-Server-Demo.exe" "demo\POS-Server-Demo.exe" >nul
    copy /y "demo\POS-Server-Demo.exe" "demo\POS-Demo.exe" >nul
    rmdir /s /q "dist\demo-server-build" 2>nul
)

if not exist "demo\POS-Server-Demo.exe" (
    echo.
    echo ========================================================
    echo [XATOLIK] demo\POS-Server-Demo.exe fayli hosil bo'lmadi!
    echo ========================================================
    if "%~1"=="" pause
    exit /b 1
)

echo.
echo ========================================================
echo  [MUVAFFAQIN!] SERVER DEMO EXE MUVAFFAQIYATLI YARATILDI!
echo  Fayl: demo\POS-Server-Demo.exe (va demo\POS-Demo.exe)
echo  Rejim: SERVER (Spring Boot + PostgreSQL + UDP Discovery)
echo ========================================================
echo.

if "%~1"=="" pause
exit /b 0
