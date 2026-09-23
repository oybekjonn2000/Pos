# ==============================================================================
# Script: build-mobile-apk.ps1
# Description: Ofitsiant Android APK-ni yig'ish (Capacitor + Gradle)
# ==============================================================================

$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$MobileDir   = Join-Path $ProjectRoot "mobile\waiter-pos"
$AndroidDir  = Join-Path $MobileDir "android"
$DistDir     = Join-Path $ProjectRoot "dist\mobile"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   OFITSIANT ANDROID APK YIG'ISH JARAYONI (Capacitor/Gradle) " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Environment sozlash
$JavaCandidates = @(
    "C:\Program Files\Java\jdk-21.0.12",
    "C:\Program Files\Java\jdk-21",
    $env:JAVA_HOME
)

$FoundJava = $null
foreach ($cand in $JavaCandidates) {
    if ($cand -and (Test-Path (Join-Path $cand "bin\java.exe"))) {
        $FoundJava = $cand
        break
    }
}

if (-not $FoundJava) {
    Write-Error "Java 21 topilmadi! Iltimos, JAVA_HOME ni sozlang."
}

$env:JAVA_HOME = $FoundJava
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
Write-Host "[OK] Java topildi: $env:JAVA_HOME" -ForegroundColor Green

$AndroidSdkCandidates = @(
    "C:\Users\User\AppData\Local\Android\Sdk",
    "$env:LOCALAPPDATA\Android\Sdk",
    $env:ANDROID_HOME
)

$FoundSdk = $null
foreach ($cand in $AndroidSdkCandidates) {
    if ($cand -and (Test-Path $cand)) {
        $FoundSdk = $cand
        break
    }
}

if (-not $FoundSdk) {
    Write-Error "Android SDK topilmadi!"
}

$env:ANDROID_HOME = $FoundSdk
$env:ANDROID_SDK_ROOT = $FoundSdk
Write-Host "[OK] Android SDK topildi: $env:ANDROID_HOME" -ForegroundColor Green

# 2. local.properties yaratish/yangilash
$LocalPropPath = Join-Path $AndroidDir "local.properties"
$EscapedSdkPath = $env:ANDROID_HOME.Replace("\", "\\")
"sdk.dir=$EscapedSdkPath" | Out-File -FilePath $LocalPropPath -Encoding ascii
Write-Host "[OK] local.properties sozlandi: $LocalPropPath" -ForegroundColor Green

# 3. Capacitor Sync
Write-Host "`n--> Capacitor web resurslarini Android loyihaga sinxronlash..." -ForegroundColor Yellow
Set-Location $MobileDir
cmd.exe /c "npx.cmd cap sync android"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Capacitor sync xatoga uchradi!"
}

# 4. Gradle orqali APK yig'ish
Write-Host "`n--> Gradle orqali Debug APK yig'ish (assembleDebug)..." -ForegroundColor Yellow
Set-Location $AndroidDir
cmd.exe /c "gradlew.bat assembleDebug --no-daemon"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Gradle orqali APK yig'ishda xatolik yuz berdi!"
}

# 5. Chiqqan APK-ni dist/mobile papkasiga nusxalash
$BuiltApk = Join-Path $AndroidDir "app\build\outputs\apk\debug\app-debug.apk"
if (-not (Test-Path $BuiltApk)) {
    Write-Error "APK fayl topilmadi: $BuiltApk"
}

if (-not (Test-Path $DistDir)) {
    New-Item -ItemType Directory -Path $DistDir -Force | Out-Null
}

$FinalApk = Join-Path $DistDir "RestaurantPOS-Waiter.apk"
Copy-Item -Path $BuiltApk -Destination $FinalApk -Force

$ApkInfo = Get-Item $FinalApk
$SizeMb = [math]::Round($ApkInfo.Length / 1MB, 2)

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "   MUVAFFAQIYATLI YAKUNLANDI!" -ForegroundColor Green
Write-Host "   Tayyor APK fayl:" -ForegroundColor White
Write-Host "   $FinalApk ($SizeMb MB)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green

Set-Location $ProjectRoot
