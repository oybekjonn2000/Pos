# ========================================================
# RESTAURANT POS — MASTER OFFLINE INSTALLER BUILD SCRIPT
# Generates a 100% self-contained Windows setup executable
# ========================================================

$ErrorActionPreference = "Stop"
$ROOT_DIR = (Get-Item $PSScriptRoot).Parent.FullName

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "    RESTAURANT POS - FULL DESKTOP INSTALLER BUILD" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Root Directory: $ROOT_DIR"

# 0. Locate Tools & Paths
$JDK_DIR = "C:\Program Files\Java\jdk-21.0.12.1"
$PG_DIR = "C:\Program Files\PostgreSQL\18"
$ISCC_EXE = "C:\Users\Steam\AppData\Local\Programs\Inno Setup 6\ISCC.exe"

if (-not (Test-Path $JDK_DIR)) {
    throw "JDK 21 not found at $JDK_DIR"
}
if (-not (Test-Path $PG_DIR)) {
    throw "PostgreSQL 18 not found at $PG_DIR"
}
if (-not (Test-Path $ISCC_EXE)) {
    $ISCC_EXE = (Get-Command iscc -ErrorAction SilentlyContinue).Source
    if (-not $ISCC_EXE) {
        throw "Inno Setup Compiler (ISCC.exe) not found!"
    }
}

$STAGING_DIR = Join-Path $ROOT_DIR "dist\staging"
$DIST_INSTALLER = Join-Path $ROOT_DIR "dist\installer"

# Ensure clean staging directory
if (Test-Path $STAGING_DIR) {
    Write-Host "[0/6] Cleaning staging directory..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $STAGING_DIR
}
New-Item -ItemType Directory -Force $STAGING_DIR | Out-Null
New-Item -ItemType Directory -Force $DIST_INSTALLER | Out-Null

# ========================================================
# 1. Build Angular Frontend
# ========================================================
Write-Host "`n[1/6] Building Angular Frontend (Production, base-href ./)..." -ForegroundColor Green
Set-Location (Join-Path $ROOT_DIR "frontend\angular-pos")
& npx ng build --configuration production --base-href ./
if ($LASTEXITCODE -ne 0) { throw "Angular build failed!" }

# ========================================================
# 2. Build Spring Boot Backend Fat JAR
# ========================================================
Write-Host "`n[2/6] Building Spring Boot Fat JAR..." -ForegroundColor Green
Set-Location (Join-Path $ROOT_DIR "backend\restaurant-pos-api")
$env:JAVA_HOME = $JDK_DIR
$env:PATH = "$JDK_DIR\bin;$env:PATH"
& mvn package -DskipTests
if ($LASTEXITCODE -ne 0) { throw "Backend Maven package failed!" }

$JAR_FILE = Get-ChildItem (Join-Path $ROOT_DIR "backend\restaurant-pos-api\target") -Filter "*.jar" | Where-Object { $_.Name -notlike "*sources*" -and $_.Name -notlike "*.original" } | Select-Object -First 1
if (-not $JAR_FILE) { throw "Spring Boot JAR not found in target!" }
Write-Host "Found Backend JAR: $($JAR_FILE.Name) ($([math]::Round($JAR_FILE.Length / 1MB, 2)) MB)"

# ========================================================
# 3. Create Custom Bundled JRE 21 with jlink
# ========================================================
Write-Host "`n[3/6] Generating Custom Bundled JRE 21 via jlink..." -ForegroundColor Green
$JRE_OUT = Join-Path $STAGING_DIR "jre"
$JLINK_MODULES = "java.base,java.desktop,java.sql,java.naming,java.management,java.instrument,java.security.jgss,java.net.http,java.compiler,java.rmi,jdk.crypto.ec,jdk.unsupported"
& "$JDK_DIR\bin\jlink.exe" --module-path "$JDK_DIR\jmods" --add-modules $JLINK_MODULES --output $JRE_OUT --strip-debug --no-man-pages --no-header-files
if ($LASTEXITCODE -ne 0) { throw "jlink JRE generation failed!" }
Write-Host "Bundled JRE generated at: $JRE_OUT"

# ========================================================
# 4. Bundle Portable PostgreSQL 18 Binaries
# ========================================================
Write-Host "`n[4/6] Bundling Portable PostgreSQL 18 binaries..." -ForegroundColor Green
$PG_OUT = Join-Path $STAGING_DIR "pgsql"
New-Item -ItemType Directory -Force (Join-Path $PG_OUT "bin") | Out-Null
New-Item -ItemType Directory -Force (Join-Path $PG_OUT "lib") | Out-Null
New-Item -ItemType Directory -Force (Join-Path $PG_OUT "share") | Out-Null

Copy-Item "$PG_DIR\bin\*" (Join-Path $PG_OUT "bin") -Recurse -Force
Copy-Item "$PG_DIR\lib\*" (Join-Path $PG_OUT "lib") -Recurse -Force
Copy-Item "$PG_DIR\share\*" (Join-Path $PG_OUT "share") -Recurse -Force
Write-Host "PostgreSQL binaries bundled at: $PG_OUT"

# ========================================================
# 5. Package Electron Desktop Shell (Unpacked)
# ========================================================
Write-Host "`n[5/6] Packaging Electron Desktop Shell..." -ForegroundColor Green
Set-Location (Join-Path $ROOT_DIR "desktop\electron")
& npm run pack
if ($LASTEXITCODE -ne 0) { throw "Electron pack failed!" }

# ========================================================
# 6. Compile Inno Setup Installers (Server & Client)
# ========================================================
Write-Host "`n[6/6] Compiling Dual Offline Installers (Server & Client) with Inno Setup..." -ForegroundColor Green
Set-Location (Join-Path $ROOT_DIR "installer")

# 6A. Compile Server Installer
Write-Host "  -> Compiling Server Installer (PostgreSQL + JRE + Spring Boot)..." -ForegroundColor Cyan
& "$ISCC_EXE" "RestaurantPOS-Server.iss"
if ($LASTEXITCODE -ne 0) { throw "Server Inno Setup compilation failed!" }

$SERVER_SETUP = Join-Path $DIST_INSTALLER "RestaurantPOS-Server-Setup-1.0.0.exe"
$SERVER_ALT = Join-Path $DIST_INSTALLER "POS-Server-Setup.exe"
if (Test-Path $SERVER_SETUP) {
    Copy-Item $SERVER_SETUP $SERVER_ALT -Force
}

# 6B. Compile Client Installer
Write-Host "  -> Compiling Client Installer (Lightweight Desktop Terminal)..." -ForegroundColor Cyan
& "$ISCC_EXE" "RestaurantPOS-Client.iss"
if ($LASTEXITCODE -ne 0) { throw "Client Inno Setup compilation failed!" }

$CLIENT_SETUP = Join-Path $DIST_INSTALLER "RestaurantPOS-Client-Setup-1.0.0.exe"
$CLIENT_ALT = Join-Path $DIST_INSTALLER "POS-Client-Setup.exe"
if (Test-Path $CLIENT_SETUP) {
    Copy-Item $CLIENT_SETUP $CLIENT_ALT -Force
}

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "    MULTI-PC LAN BUILD COMPLETE & VERIFIED!" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

if (Test-Path $SERVER_SETUP) {
    $serverSize = [math]::Round((Get-Item $SERVER_SETUP).Length / 1MB, 2)
    Write-Host "Central Server Installer (Admin PC):" -ForegroundColor Green
    Write-Host "  -> $SERVER_SETUP ($serverSize MB)" -ForegroundColor Yellow
    Write-Host "  -> $SERVER_ALT" -ForegroundColor Yellow
}

if (Test-Path $CLIENT_SETUP) {
    $clientSize = [math]::Round((Get-Item $CLIENT_SETUP).Length / 1MB, 2)
    Write-Host "`nClient Terminal Installer (Waiter & Kitchen PCs):" -ForegroundColor Green
    Write-Host "  -> $CLIENT_SETUP ($clientSize MB)" -ForegroundColor Yellow
    Write-Host "  -> $CLIENT_ALT" -ForegroundColor Yellow
}

Write-Host "`nReady for multi-PC restaurant deployment over local LAN without internet!" -ForegroundColor White
Set-Location $ROOT_DIR

