@echo off
title Restaurant POS - Build and Run Demo
echo ========================================================
echo    RESTAURANT POS - BUILD AND RUN DEMO WORKFLOW
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

call "%ROOT_DIR%build-demo.bat" --no-pause
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
echo Build yakunlandi. Demo dastur ishga tushirilmoqda...
echo ========================================================
call "%ROOT_DIR%run-demo.bat"
exit /b 0
