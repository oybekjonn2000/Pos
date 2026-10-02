@echo off
title Restaurant POS - Run Server Demo EXE
echo ========================================================
echo       RESTAURANT POS - RUN SERVER DEMO
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"
set "DEMO_EXE=%ROOT_DIR%demo\POS-Server-Demo.exe"

if not exist "%DEMO_EXE%" (
    if exist "%ROOT_DIR%demo\POS-Demo.exe" (
        set "DEMO_EXE=%ROOT_DIR%demo\POS-Demo.exe"
    ) else (
        echo [OGOHLANTIRISH] demo\POS-Server-Demo.exe fayli topilmadi!
        echo.
        echo Iltimos, avval 'build-server-demo.bat' orqali demo faylni yarating.
        echo.
        pause
        exit /b 1
    )
)

:: PostgreSQL xizmatini tekshirish
echo [1/2] PostgreSQL holati tekshirilmoqda...
net start postgresql-x64-18 >nul 2>&1

:: Server Demo dasturini ishga tushirish
echo [2/2] POS Server Demo ishga tushirilmoqda...
start "" "%DEMO_EXE%"

echo.
echo ========================================================
echo  POS Server Demo muvaffaqiyatli ishga tushirildi!
echo  Port: 8080 (Backend), 5433 (PostgreSQL), 38888 (Discovery)
echo ========================================================
echo.
timeout /t 2 /nobreak >nul
exit /b 0
