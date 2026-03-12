@echo off
REM ============================================================================
REM Credora Fabric Network - Windows Startup Script
REM For Blockchain India Challenge Submission
REM ============================================================================

echo.
echo ========================================
echo   CREDORA FABRIC NETWORK STARTUP
echo   Blockchain India Challenge 2024
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [OK] Docker is running
echo.

REM Navigate to fabric-network directory
cd /d "%~dp0fabric-network"

echo ========================================
echo STEP 1: Starting Fabric Network
echo ========================================
echo.

REM Start all containers
docker-compose up -d

if errorlevel 1 (
    echo [ERROR] Failed to start Docker containers
    pause
    exit /b 1
)

echo.
echo [OK] Waiting for containers to initialize (15 seconds)...
timeout /t 15 /nobreak >nul

echo.
echo ========================================
echo STEP 2: Checking Container Status
echo ========================================
echo.

docker ps --format "table {{.Names}}\t{{.Status}}"

echo.
echo ========================================
echo   FABRIC NETWORK IS RUNNING!
echo ========================================
echo.
echo Next Steps:
echo 1. Start Backend:  cd deid-core\backend ^&^& npm run dev
echo 2. Start Frontend: cd veripass-wallet ^&^& npm run dev
echo.
echo To stop network: docker-compose down
echo.

pause
