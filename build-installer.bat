@echo off
setlocal enabledelayedexpansion

title Restaurant POS - Windows Installer Build
echo ========================================================
echo       RESTAURANT POS - WINDOWS INSTALLER BUILD
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

:: 0. Muhit o'zgaruvchilari va asboblarni avtomatik aniqlash (JDK 21, Maven, Inno Setup)
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

set "TARGET=all"
if "%~1"=="--server" set "TARGET=server"
if "%~1"=="--client" set "TARGET=client"
if "%~1"=="--standalone" set "TARGET=standalone"
if "%~1"=="--all" set "TARGET=all"

if not "%~1"=="" goto run_build

echo Qaysi ornatuvchini [installer] yaratmoqchisiz:
echo  [1] BARCHASINI YARATISH [Server + Client + Standalone] (STANDART)
echo  [2] FAQAT SERVER INSTALLER [Kassa / Asosiy Server PC uchun]
echo  [3] FAQAT CLIENT INSTALLER [Ofitsiant / Oshxona terminali uchun]
echo  [4] FAQAT STANDALONE INSTALLER [Bitta kompyuter uchun]
echo.
set /p "CHOICE=Tanlovingiz [1/2/3/4] (Standart: 1): "
if "%CHOICE%"=="2" set "TARGET=server"
if "%CHOICE%"=="3" set "TARGET=client"
if "%CHOICE%"=="4" set "TARGET=standalone"
if "%CHOICE%"=="" set "TARGET=all"
if "%CHOICE%"=="1" set "TARGET=all"

:run_build

echo.
echo ========================================================
echo Tanlangan rejim: !TARGET!
echo Installer yaratish boshlanmoqda...
echo ========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT_DIR%scripts\build-installer.ps1" -Target "%TARGET%"

if %errorlevel% neq 0 (
    echo.
    echo ========================================================
    echo [XATOLIK] Installer yaratishda xatolik yuz berdi!
    echo ========================================================
    if "%~1"=="" pause
    exit /b %errorlevel%
)

echo.
echo ========================================================
echo  [MUVAFFAQIN!] INSTALLER(LAR) MUVAFFAQIYATLI YARATILDI!
echo  Papka: dist\installer\
echo ========================================================
echo.

if "%~1"=="" pause
exit /b 0
