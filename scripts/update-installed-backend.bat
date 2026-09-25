@echo off
set SCRIPT_DIR=%~dp0..
copy /y "%SCRIPT_DIR%\dist\desktop\win-unpacked\resources\app.asar" "C:\Program Files\RestaurantPOS-Server\resources\app.asar"
copy /y "%SCRIPT_DIR%\dist\desktop\win-unpacked\RestaurantPOS.exe" "C:\Program Files\RestaurantPOS-Server\RestaurantPOS.exe"
copy /y "%SCRIPT_DIR%\backend\restaurant-pos-api\target\restaurant-pos-api-1.0.0-SNAPSHOT.jar" "C:\Program Files\RestaurantPOS-Server\backend\restaurant-pos-api-1.0.0-SNAPSHOT.jar"
echo All files updated.

