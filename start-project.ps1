# Dragon D&D Application Startup Script
# This script installs dependencies and starts both frontend and backend servers

Write-Host "🐉 Starting Dragon D&D Application..." -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $connection -ne $null
}

# Function to wait for a service to be ready
function Wait-ForService {
    param([string]$Url, [int]$MaxAttempts = 30)
    
    Write-Host "Waiting for service at $Url..." -ForegroundColor Yellow
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Service is ready!" -ForegroundColor Green
                return $true
            }
        }
        catch {
            Write-Host "Attempt $i/$MaxAttempts - Service not ready yet..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    }
    Write-Host "❌ Service failed to start within timeout" -ForegroundColor Red
    return $false
}

# Check if ports are available
Write-Host "Checking port availability..." -ForegroundColor Cyan
if (Test-Port -Port 3000) {
    Write-Host "⚠️  Port 3000 is in use. Frontend might not start properly." -ForegroundColor Yellow
}
if (Test-Port -Port 3001) {
    Write-Host "⚠️  Port 3001 is in use. Backend might not start properly." -ForegroundColor Yellow
}

# Install root dependencies
Write-Host ""
Write-Host "Installing root dependencies..." -ForegroundColor Cyan
try {
    npm install
    Write-Host "✅ Root dependencies installed" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to install root dependencies" -ForegroundColor Red
    exit 1
}

# Install backend dependencies
Write-Host ""
Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
try {
    Set-Location -Path "backend"
    npm install
    Set-Location -Path ".."
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}

# Install frontend dependencies
Write-Host ""
Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
try {
    Set-Location -Path "frontend"
    npm install
    Set-Location -Path ".."
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}

# Start backend server
Write-Host ""
Write-Host "Starting backend server..." -ForegroundColor Cyan
$backendProcess = Start-Process -FilePath "cmd" -ArgumentList "/k", "cd backend && npm start" -WindowStyle Normal -PassThru

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend server
Write-Host ""
Write-Host "Starting frontend server..." -ForegroundColor Cyan
$frontendProcess = Start-Process -FilePath "cmd" -ArgumentList "/k", "cd frontend && npm run dev" -WindowStyle Normal -PassThru

# Wait for services to be ready
Write-Host ""
Write-Host "Waiting for services to be ready..." -ForegroundColor Cyan

$backendReady = Wait-ForService -Url "http://localhost:3001/api/health"
$frontendReady = Wait-ForService -Url "http://localhost:3000"

# Display results
Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "🐉 Dragon D&D Application Status" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

if ($backendReady) {
    Write-Host "✅ Backend: http://localhost:3001" -ForegroundColor Green
    Write-Host "   Health: http://localhost:3001/api/health" -ForegroundColor Gray
} else {
    Write-Host "❌ Backend: Failed to start" -ForegroundColor Red
}

if ($frontendReady) {
    Write-Host "✅ Frontend: http://localhost:3000" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend: Failed to start" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎮 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open your browser to http://localhost:3000" -ForegroundColor White
Write-Host "2. Click 'Monsters' in the navigation" -ForegroundColor White
Write-Host "3. Browse through monsters with Previous/Next buttons" -ForegroundColor White
Write-Host ""
Write-Host "💡 To stop the servers, close the command windows that opened" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 