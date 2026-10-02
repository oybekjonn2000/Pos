@echo off
title Restaurant POS - Run Demo EXE
echo ========================================================
echo       RESTAURANT POS - RUN DEMO APPLICATION
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"

:: Agar Server Demo mavjud bo'lsa, uni ishga tushiramiz
if exist "%ROOT_DIR%demo\POS-Server-Demo.exe" (
    call "%ROOT_DIR%run-server-demo.bat"
    exit /b %errorlevel%
)

set "DEMO_EXE=%ROOT_DIR%demo\POS-Demo.exe"

if not exist "%DEMO_EXE%" (
    echo [OGOHLANTIRISH] demo\POS-Demo.exe yoki POS-Server-Demo.exe fayli topilmadi!
    echo.
    echo Iltimos, avval 'build-server-demo.bat' orqali demo faylni yarating.
    echo.
    pause
    exit /b 1
)

echo POS-Demo.exe ishga tushirilmoqda...
start "" "%DEMO_EXE%"
echo Dastur ishga tushirildi!
timeout /t 2 /nobreak >nul
exit /b 0
