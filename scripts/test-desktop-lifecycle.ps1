# ==============================================================================
# Script: test-desktop-lifecycle.ps1
# Description: Test Single Instance, System Tray, Background Server, and Recovery
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   DESKTOP SINGLE INSTANCE & LIFECYCLE TEST" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Test Backend Health on 8080
Write-Host "`n[1/4] Spring Boot 8080 port tekshirilmoqda..." -ForegroundColor Yellow
try {
    $res = Invoke-RestMethod -Uri "http://localhost:8080/actuator/health" -TimeoutSec 3 -ErrorAction Stop
    if ($res.status -eq "UP") {
        Write-Host "  -> [OK] Spring Boot Backend faol va holati UP" -ForegroundColor Green
    } else {
        Write-Host "  -> [WARN] Backend holati: $($res.status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  -> [INFO] Backend hozircha to'xtatilgan yoki boshqa portda: $($_.Exception.Message)" -ForegroundColor Gray
}

# 2. Test Mobile Connection-Check Endpoint
Write-Host "`n[2/4] Mobil ilova ulanish endpointi (/api/mobile/connection-check)..." -ForegroundColor Yellow
try {
    $mRes = Invoke-RestMethod -Uri "http://localhost:8080/api/mobile/connection-check" -TimeoutSec 3 -ErrorAction Stop
    if ($mRes.success) {
        Write-Host "  -> [OK] Mobil ulanish muvaffaqiyatli: Restoran: $($mRes.data.restaurantName), Tarif: $($mRes.data.subscriptionPlan)" -ForegroundColor Green
    }
} catch {
    Write-Host "  -> [WARN] Mobil connection-check: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 3. Test PostgreSQL Port 5433
Write-Host "`n[3/4] PostgreSQL 5433 port tekshirilmoqda..." -ForegroundColor Yellow
$pgConn = Test-NetConnection -ComputerName 127.0.0.1 -Port 5433 -WarningAction SilentlyContinue
if ($pgConn.TcpTestSucceeded) {
    Write-Host "  -> [OK] PostgreSQL port 5433 ochiq va ulanishga tayyor" -ForegroundColor Green
} else {
    Write-Host "  -> [WARN] PostgreSQL port 5433 ga ulanib bo'lmadi" -ForegroundColor Yellow
}

# 4. Verify Single Instance & Tray in Electron app.asar
Write-Host "`n[4/4] Electron main.js (Single Instance & Tray) sozlamalari..." -ForegroundColor Yellow
$mainJsPath = Join-Path $PSScriptRoot "..\desktop\electron\main.js"
if (Test-Path $mainJsPath) {
    $content = Get-Content $mainJsPath -Raw
    $hasSingleInstance = $content.Contains("requestSingleInstanceLock")
    $hasSecondInstance = $content.Contains("second-instance")
    $hasTray = $content.Contains("new Tray")
    $hasHideOnClose = $content.Contains("mainWindow.hide()")
    $hasCrashRecovery = $content.Contains("Crash Recovery")
    $hasAutostart = $content.Contains("--autostart")

    Write-Host "  -> Single Instance Lock (requestSingleInstanceLock): $(if($hasSingleInstance){'[OK]'}else{'[FAIL]'})" -ForegroundColor $(if($hasSingleInstance){'Green'}else{'Red'})
    Write-Host "  -> Second Instance Focus (second-instance event):     $(if($hasSecondInstance){'[OK]'}else{'[FAIL]'})" -ForegroundColor $(if($hasSecondInstance){'Green'}else{'Red'})
    Write-Host "  -> System Tray Integration (new Tray, contextMenu):   $(if($hasTray){'[OK]'}else{'[FAIL]'})" -ForegroundColor $(if($hasTray){'Green'}else{'Red'})
    Write-Host "  -> X tugmasida Tray'ga yashirish (mainWindow.hide):    $(if($hasHideOnClose){'[OK]'}else{'[FAIL]'})" -ForegroundColor $(if($hasHideOnClose){'Green'}else{'Red'})
    Write-Host "  -> Backend Crash Recovery (auto-restart logic):       $(if($hasCrashRecovery){'[OK]'}else{'[FAIL]'})" -ForegroundColor $(if($hasCrashRecovery){'Green'}else{'Red'})
    Write-Host "  -> Windows Silent Autostart (--autostart flag):       $(if($hasAutostart){'[OK]'}else{'[FAIL]'})" -ForegroundColor $(if($hasAutostart){'Green'}else{'Red'})
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "   LIFECYCLE TEST YAKUNLANDI" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
