@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo        RESTAURANT POS - DATABASE BACKUP UTILITY
echo ========================================================
echo.

set APP_DATA=%PROGRAMDATA%\RestaurantPOS
set BACKUP_DIR=%APP_DATA%\backups
set PG_BIN=C:\Program Files\RestaurantPOS\pgsql\bin

if not exist "%PG_BIN%\pg_dump.exe" (
    set PG_BIN=C:\Program Files\PostgreSQL\18\bin
)

if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
)

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set dt=%%I
set TIMESTAMP=%dt:~0,4%%dt:~4,2%%dt:~6,2%_%dt:~8,2%%dt:~10,2%%dt:~12,2%
set BACKUP_FILE=%BACKUP_DIR%\POS_Backup_%TIMESTAMP%.sql

echo [1/2] Creating backup file: %BACKUP_FILE%...
"%PG_BIN%\pg_dump.exe" -h 127.0.0.1 -p 5433 -U pos_user -d pos -F p -f "%BACKUP_FILE%"

if %errorlevel% neq 0 (
    echo [ERROR] Backup failed!
    exit /b %errorlevel%
)

echo [2/2] Backup created successfully!
echo Path: %BACKUP_FILE%
echo.
