@echo off
setlocal
set "ROOT_DIR=%~dp0..\"
call "%ROOT_DIR%build-installer.bat" %*
exit /b %errorlevel%
