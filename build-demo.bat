@echo off
setlocal enabledelayedexpansion

title Restaurant POS - Build Demo EXE
echo ========================================================
echo       RESTAURANT POS - DEVELOPMENT DEMO BUILD
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

set "CHOICE=1"
if "%~1"=="--client" goto build_client
if "%~1"=="--server" goto build_server
if "%~1"=="--no-pause" goto build_server

echo Qaysi demo versiyani yaratmoqchisiz?
echo  [1] SERVER DEMO (Spring Boot + PostgreSQL + Desktop UI) [STANDART]
echo  [2] CLIENT DEMO (Faqat frontend terminal, tashqi serverga ulanish)
echo.
set /p "CHOICE=Tanlovingiz [1/2] (Standart: 1): "
if "%CHOICE%"=="" set "CHOICE=1"

if "%CHOICE%"=="2" goto build_client

:build_server
call "%ROOT_DIR%build-server-demo.bat" %*
exit /b %errorlevel%

:build_client
echo.
echo ========================================================
echo       CLIENT DEMO BUILD (FAQAT FRONTEND TERMINAL)
echo ========================================================
echo.

:: 1. Old instance process check and safe termination
echo [1/4] Ishlayotgan eski demo jarayonlarini to'xtatish...
taskkill /F /IM POS-Demo.exe /T >nul 2>&1
taskkill /F /IM RestaurantPOS.exe /T >nul 2>&1
timeout /t 1 /nobreak >nul

:: 2. Build Angular frontend for desktop
echo [2/4] Angular frontend build qilinmoqda (desktop rejimi)...
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

:: 3. Build Electron portable executable
echo.
echo [3/4] Electron Client Demo EXE tayyorlanmoqda...
cd /d "%ROOT_DIR%desktop\electron"
call npx.cmd electron-builder --config electron-builder.demo.json
if %errorlevel% neq 0 (
    echo.
    echo ========================================================
    echo [XATOLIK] Electron builder orqali EXE yaratishda xatolik yuz berdi!
    echo ========================================================
    cd /d "%ROOT_DIR%"
    if "%~1"=="" pause
    exit /b 1
)

:: 4. Move output to demo/POS-Demo.exe and clean temporary build artifacts
echo.
echo [4/4] Demo fayl joylashtirilmoqda va tozalash...
cd /d "%ROOT_DIR%"
if not exist "demo" mkdir "demo"

if exist "dist\demo-build\POS-Demo.exe" (
    move /y "dist\demo-build\POS-Demo.exe" "demo\POS-Demo.exe" >nul
    rmdir /s /q "dist\demo-build" 2>nul
)

if not exist "demo\POS-Demo.exe" (
    echo.
    echo ========================================================
    echo [XATOLIK] demo\POS-Demo.exe fayli hosil bo'lmadi!
    echo ========================================================
    if "%~1"=="" pause
    exit /b 1
)

echo.
echo ========================================================
echo  [MUVAFFAQIN!] CLIENT DEMO EXE MUVAFFAQIYATLI YARATILDI!
echo  Fayl: demo\POS-Demo.exe
echo ========================================================
echo.

if "%~1"=="" pause
exit /b 0
