@echo off
setlocal

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install-Sanka-Plugin.ps1"
set EXIT_CODE=%ERRORLEVEL%

if not "%EXIT_CODE%"=="0" (
  echo.
  echo Installation failed. Please share the error message with your administrator.
  pause
  exit /b %EXIT_CODE%
)

echo.
pause
