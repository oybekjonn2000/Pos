@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo        RESTAURANT POS - POSTGRESQL STARTUP
echo ========================================================

set "PG_BIN=C:\Program Files\PostgreSQL\18\bin"
set "APP_DATA=C:\ProgramData\RestaurantPOS"
set "DATA_DIR=%APP_DATA%\PostgreSQL\data"
set "LOG_DIR=%APP_DATA%\logs"
set "PG_PORT=5433"

if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

:: Check if cluster is initialized
if not exist "%DATA_DIR%\PG_VERSION" (
    echo [INFO] Initializing PostgreSQL cluster in %DATA_DIR%...
    "%PG_BIN%\initdb.exe" -D "%DATA_DIR%" -U pos_user -E UTF8 --locale=C -A trust
    if errorlevel 1 (
        echo [ERROR] initdb failed!
        exit /b 1
    )
    echo [SUCCESS] Cluster initialized.
)

:: Check if PostgreSQL is already listening on port 5433
netstat -ano | findstr "127.0.0.1:%PG_PORT% " | findstr "LISTENING" > nul
if errorlevel 1 (
    echo [INFO] Starting PostgreSQL on port %PG_PORT%...
    "%PG_BIN%\pg_ctl.exe" start -D "%DATA_DIR%" -o "-p %PG_PORT% -h 127.0.0.1" -l "%LOG_DIR%\postgresql.log" -w -t 20
    if errorlevel 1 (
        echo [WARN] pg_ctl start returned code %errorlevel%, checking if port is open...
    )
) else (
    echo [INFO] PostgreSQL is already running on port %PG_PORT%.
)

:: Create pos database if it doesn't exist
"%PG_BIN%\createdb.exe" -h 127.0.0.1 -p %PG_PORT% -U pos_user pos 2>nul
if errorlevel 1 (
    echo [INFO] Database 'pos' already exists or ready.
) else (
    echo [SUCCESS] Database 'pos' created successfully!
)

echo ========================================================
echo PostgreSQL is READY on 127.0.0.1:%PG_PORT%
echo ========================================================
