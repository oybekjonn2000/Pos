@echo off
title Restaurant POS - Build & Run Server Demo
echo ========================================================
echo    RESTAURANT POS - BUILD AND RUN SERVER DEMO WORKFLOW
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

call "%ROOT_DIR%build-server-demo.bat" --no-pause
if %errorlevel% neq 0 (
    echo.
    echo ========================================================
    echo [XATO] Build jarayonida xatolik yuz berdi!
    echo Demo dastur ishga tushirilmadi.
    echo ========================================================
    echo.
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================================
echo Build yakunlandi. Server Demo dastur ishga tushirilmoqda...
echo ========================================================
call "%ROOT_DIR%run-server-demo.bat"
exit /b 0
