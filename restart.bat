@echo off
echo Restarting Dragon D^&D Application...
echo.

echo ========================================
echo STEP 1: Checking for running processes
echo ========================================

echo [INFO] Checking if frontend is started on port 3000...
netstat -ano | findstr :3000 > nul
if %errorlevel% equ 0 (
    echo [FOUND] Frontend is running on port 3000
    echo [ACTION] Shutting down frontend...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
        echo [KILL] Stopping process PID: %%a
        taskkill /PID %%a /F >nul 2>&1
    )
    echo [SUCCESS] Frontend stopped
) else (
    echo [INFO] Frontend is not running on port 3000
)

echo.
echo [INFO] Checking if backend is started on port 3001...
netstat -ano | findstr :3001 > nul
if %errorlevel% equ 0 (
    echo [FOUND] Backend is running on port 3001
    echo [ACTION] Shutting down backend...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
        echo [KILL] Stopping process PID: %%a
        taskkill /PID %%a /F >nul 2>&1
    )
    echo [SUCCESS] Backend stopped
) else (
    echo [INFO] Backend is not running on port 3001
)

echo.
echo ========================================
echo STEP 2: Cleanup any remaining processes
echo ========================================
echo [INFO] Stopping any remaining Node.js processes...
taskkill /IM node.exe /F >nul 2>&1
echo [SUCCESS] Cleanup completed

echo.
echo ========================================
echo STEP 3: Starting services
echo ========================================
echo [INFO] Waiting 2 seconds for processes to fully stop...
timeout /t 2 /nobreak > nul

echo [INFO] Starting Backend Server...
start "Backend" cmd /k "cd backend && npm start"
echo [SUCCESS] Backend startup command executed

echo [INFO] Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak > nul

echo [INFO] Starting Frontend Server...
start "Frontend" cmd /k "cd frontend && npm run dev"
echo [SUCCESS] Frontend startup command executed

echo.
echo ========================================
echo STEP 4: Summary
echo ========================================
echo [SUCCESS] Both servers are restarting...
echo [INFO] Backend: http://localhost:3001
echo [INFO] Frontend: http://localhost:3000
echo.
echo [INFO] Press any key to close this window...
pause > nul 