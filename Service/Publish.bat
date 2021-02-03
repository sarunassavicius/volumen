@echo off
echo [1mPublishing...[0m
echo.

dotnet publish -c Release -r win10-x64
rem dotnet publish -c Release -r ubuntu.16.10-x64

echo.
pause
exit /b 0