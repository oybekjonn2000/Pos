$ErrorActionPreference = "Continue"

Write-Host "Stopping running backend process on port 8080..."
$pids = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($p in $pids) {
    try {
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
    } catch {}
}

Start-Sleep -Milliseconds 600

Write-Host "Granting permissions on RestaurantPOS-Server directory..."
& icacls "C:\Program Files\RestaurantPOS-Server" /grant "*S-1-5-32-545:(OI)(CI)F" /T /Q

Write-Host "Copying updated backend JAR..."
Copy-Item -Path "e:\POS\backend\restaurant-pos-api\target\restaurant-pos-api-1.0.0-SNAPSHOT.jar" -Destination "C:\Program Files\RestaurantPOS-Server\backend\restaurant-pos-api-1.0.0-SNAPSHOT.jar" -Force

Write-Host "Done copying backend JAR."
