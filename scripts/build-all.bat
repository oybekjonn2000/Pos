@echo off
echo ========================================================
echo        RESTAURANT POS - FULL PRODUCTION BUILD
echo ========================================================
echo.

if not defined JAVA_HOME (
    if exist "C:\Program Files\Java\jdk-21.0.12" set JAVA_HOME=C:\Program Files\Java\jdk-21.0.12
    if exist "C:\Program Files\Java\jdk-21" set JAVA_HOME=C:\Program Files\Java\jdk-21
    if exist "C:\Users\User\.jdks\jbr-21.0.11" set JAVA_HOME=C:\Users\User\.jdks\jbr-21.0.11
    if exist "C:\Program Files\Java\jdk-21.0.12.1" set JAVA_HOME=C:\Program Files\Java\jdk-21.0.12.1
)
set PATH=%JAVA_HOME%\bin;%PATH%
if exist "C:\apache-maven-3.9.16\bin" set PATH=C:\apache-maven-3.9.16\bin;%PATH%

:: 1. Build Angular
echo [1/2] Building Angular 22 Frontend...
cd /d %~dp0..\frontend\angular-pos
call npm.cmd run build
if %errorlevel% neq 0 (
    echo [ERROR] Angular build failed!
    pause
    exit /b %errorlevel%
)

:: 2. Build Spring Boot JAR
echo.
echo [2/2] Building Spring Boot Fat JAR...
cd /d %~dp0..\backend\restaurant-pos-api
call mvnw.cmd clean package -DskipTests
if %errorlevel% neq 0 (
    echo [ERROR] Backend build failed!
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================================
echo        BUILD SUCCESSFUL!
echo   - Backend JAR: backend\restaurant-pos-api\target\restaurant-pos-api-1.0.0-SNAPSHOT.jar
echo   - Frontend:    frontend\angular-pos\dist\angular-pos\browser\
echo ========================================================
pause
