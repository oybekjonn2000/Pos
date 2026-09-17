@echo off
setlocal
echo ========================================================
echo        RESTAURANT POS - WINDOWS INSTALLER BUILD
echo ========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-installer.ps1"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed! Check messages above.
    pause
    exit /b %errorlevel%
)

echo.
pause
