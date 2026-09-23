@echo off
echo ========================================================
echo        RESTAURANT POS - SYSTEM STARTUP
echo ========================================================
echo.

:: 1. Check PostgreSQL
echo [1/3] Checking PostgreSQL (port 5433)...
netstat -ano | findstr "127.0.0.1:5433 " | findstr "LISTENING" > nul
if %errorlevel% neq 0 (
    echo Starting PostgreSQL on port 5433...
    if exist "C:\Program Files\PostgreSQL\18\bin\postgres.exe" (
        start "PostgreSQL Server" /min "C:\Program Files\PostgreSQL\18\bin\postgres.exe" -D "C:\ProgramData\RestaurantPOS\PostgreSQL\data" -p 5433
        timeout /t 2 /nobreak > nul
    ) else (
        echo [WARN] PostgreSQL binary not found at C:\Program Files\PostgreSQL\18\bin\postgres.exe
    )
) else (
    echo PostgreSQL is already running on port 5433.
)
echo.

:: 2. Start Spring Boot API
echo [2/3] Starting Spring Boot API (port 8080)...
if not defined JAVA_HOME (
    if exist "C:\Program Files\Java\jdk-21.0.12" set JAVA_HOME=C:\Program Files\Java\jdk-21.0.12
    if exist "C:\Program Files\Java\jdk-21" set JAVA_HOME=C:\Program Files\Java\jdk-21
    if exist "C:\Users\User\.jdks\jbr-21.0.11" set JAVA_HOME=C:\Users\User\.jdks\jbr-21.0.11
    if exist "C:\Program Files\Java\jdk-21.0.12.1" set JAVA_HOME=C:\Program Files\Java\jdk-21.0.12.1
)
set PATH=%JAVA_HOME%\bin;%PATH%
if exist "C:\apache-maven-3.9.16\bin" set PATH=C:\apache-maven-3.9.16\bin;%PATH%

if exist "%~dp0..\backend\restaurant-pos-api\target\restaurant-pos-api-1.0.0-SNAPSHOT.jar" (
    start "Restaurant POS API" cmd /k "cd /d %~dp0..\backend\restaurant-pos-api && java -jar target\restaurant-pos-api-1.0.0-SNAPSHOT.jar"
) else (
    start "Restaurant POS API" cmd /k "cd /d %~dp0..\backend\restaurant-pos-api && mvnw.cmd spring-boot:run"
)
echo Backend launched in background window.
echo.

:: 3. Start Angular Web UI
echo [3/3] Starting Frontend Client (port 4200)...
start "Restaurant POS UI" cmd /k "cd /d %~dp0..\frontend\angular-pos && npm start"
echo Frontend launched in background window.
echo.

echo ========================================================
echo   System will be available at:
echo   - Web POS:    http://localhost:4200
echo   - Backend API: http://localhost:8080/swagger-ui.html
echo   - Health:     http://localhost:8080/actuator/health
echo ========================================================
pause
