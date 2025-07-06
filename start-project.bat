@echo off
echo Starting Dragon D&D Application...
echo.

REM Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "start-project.ps1"

echo.
echo Script completed. Press any key to exit...
pause > nul 