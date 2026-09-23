@echo off
setlocal
echo ========================================================
echo   Ofitsiant Android APK-ni yig'ish (RestaurantPOS)
echo ========================================================
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-mobile-apk.ps1"
if %ERRORLEVEL% neq 0 (
    echo [XATO] APK yig'ish muvaffaqiyatsiz tugadi.
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo [MUVAFFAQIYAT] APK tayyor!
pause
