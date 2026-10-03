@echo off
setlocal enabledelayedexpansion

title Restaurant POS - Build Demo EXE
echo ========================================================
echo       RESTAURANT POS - DEVELOPMENT DEMO BUILD
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
if exist "%LOCALAPPDATA%\Programs\Inno Setup 6" set "PATH=%LOCALAPPDATA%\Programs\Inno Setup 6;%PATH%"

set "CHOICE=1"
if "%~1"=="--client" goto build_client
if "%~1"=="--server" goto build_server
if "%~1"=="--installer" goto build_installer
if "%~1"=="--all" goto build_all
if "%~1"=="--no-pause" goto build_server

echo Qaysi dastur yoki ornatuvchini yaratmoqchisiz:
echo  [1] SERVER DEMO [Spring Boot + PostgreSQL + Desktop UI Portable EXE] (STANDART)
echo  [2] CLIENT DEMO [Faqat frontend terminal Portable EXE]
echo  [3] WINDOWS DESKTOP INSTALLER [To'liq Setup.exe O'rnatuvchi - Server va Client]
echo  [4] BARCHASINI YARATISH [Demo EXE + Windows Installer]
echo.
set /p "CHOICE=Tanlovingiz [1/2/3/4] (Standart: 1): "
if "%CHOICE%"=="" set "CHOICE=1"

if "%CHOICE%"=="2" goto build_client
if "%CHOICE%"=="3" goto build_installer
if "%CHOICE%"=="4" goto build_all

:build_server
call "%ROOT_DIR%build-server-demo.bat" %*
exit /b %errorlevel%

:build_installer
call "%ROOT_DIR%build-installer.bat" %*
exit /b %errorlevel%

:build_all
echo.
echo ========================================================
echo [1/3] Server Demo EXE yaratilmoqda...
echo ========================================================
call "%ROOT_DIR%build-server-demo.bat" --no-pause
if %errorlevel% neq 0 exit /b %errorlevel%

echo.
echo ========================================================
echo [2/3] Client Demo EXE yaratilmoqda...
echo ========================================================
call "%ROOT_DIR%build-demo.bat" --client
if %errorlevel% neq 0 exit /b %errorlevel%

echo.
echo ========================================================
echo [3/3] Windows Setup Installer(lar) yaratilmoqda...
echo ========================================================
call "%ROOT_DIR%build-installer.bat" --all
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
