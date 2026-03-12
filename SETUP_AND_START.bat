@echo off
REM ============================================================================
REM CREDORA - Complete Startup Script for Windows
REM Blockchain India Challenge 2024
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================
echo    CREDORA HYPERLEDGER FABRIC NETWORK
echo    Blockchain India Challenge 2024
echo ============================================================
echo.

REM Colors (using echo with special characters)
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM ============================================================================
REM STEP 1: Check Prerequisites
REM ============================================================================

echo %BLUE%[STEP 1/5] Checking Prerequisites...%NC%
echo.

REM Check Docker
docker info >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR] Docker is not running!%NC%
    echo.
    echo Please:
    echo 1. Open Docker Desktop
    echo 2. Wait for it to fully start
    echo 3. Run this script again
    echo.
    pause
    exit /b 1
)
echo %GREEN%[OK] Docker is running%NC%

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR] Node.js is not installed!%NC%
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)
echo %GREEN%[OK] Node.js is installed%NC%

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR] npm is not installed!%NC%
    pause
    exit /b 1
)
echo %GREEN%[OK] npm is installed%NC%

echo.

REM ============================================================================
REM STEP 2: Start Fabric Network
REM ============================================================================

echo %BLUE%[STEP 2/5] Starting Hyperledger Fabric Network...%NC%
echo.

cd /d "%~dp0fabric-network"

echo Starting Docker containers...
docker-compose up -d

if errorlevel 1 (
    echo %RED%[ERROR] Failed to start Docker containers%NC%
    echo.
    echo Try:
    echo 1. docker-compose down
    echo 2. Run this script again
    pause
    exit /b 1
)

echo.
echo %GREEN%[OK] Docker containers started%NC%
echo.
echo Waiting for containers to initialize (20 seconds)...
timeout /t 20 /nobreak >nul

echo.
echo Checking container status...
docker ps --format "table {{.Names}}\t{{.Status}}" | findstr credora

echo.

REM Count running containers
for /f %%i in ('docker ps --filter "name=credora" --format "{{.Names}}" ^| find /c /v ""') do set CONTAINER_COUNT=%%i

if %CONTAINER_COUNT% LSS 10 (
    echo %YELLOW%[WARNING] Only %CONTAINER_COUNT% containers running. Expected 11+%NC%
    echo Some containers may have failed to start.
    echo.
    echo Check logs with: docker logs [container-name]
    echo.
) else (
    echo %GREEN%[OK] All containers are running (%CONTAINER_COUNT% containers)%NC%
)

echo.

REM ============================================================================
REM STEP 3: Install Backend Dependencies
REM ============================================================================

echo %BLUE%[STEP 3/5] Setting up Backend...%NC%
echo.

cd /d "%~dp0deid-core\backend"

if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
    if errorlevel 1 (
        echo %RED%[ERROR] Backend npm install failed%NC%
        pause
        exit /b 1
    )
    echo %GREEN%[OK] Backend dependencies installed%NC%
) else (
    echo %GREEN%[OK] Backend dependencies already installed%NC%
)

echo.

REM ============================================================================
REM STEP 4: Install Frontend Dependencies
REM ============================================================================

echo %BLUE%[STEP 4/5] Setting up Frontend...%NC%
echo.

cd /d "%~dp0veripass-wallet"

if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo %RED%[ERROR] Frontend npm install failed%NC%
        pause
        exit /b 1
    )
    echo %GREEN%[OK] Frontend dependencies installed%NC%
) else (
    echo %GREEN%[OK] Frontend dependencies already installed%NC%
)

echo.

REM ============================================================================
REM STEP 5: Create Startup Scripts
REM ============================================================================

echo %BLUE%[STEP 5/5] Creating startup scripts...%NC%
echo.

REM Create backend startup script
cd /d "%~dp0"
(
echo @echo off
echo cd /d "%%~dp0deid-core\backend"
echo echo.
echo echo ============================================
echo echo   CREDORA BACKEND SERVER
echo echo   Starting on http://localhost:5000
echo echo ============================================
echo echo.
echo npm run dev
echo pause
) > START_BACKEND.bat

echo %GREEN%[OK] Created START_BACKEND.bat%NC%

REM Create frontend startup script
(
echo @echo off
echo cd /d "%%~dp0veripass-wallet"
echo echo.
echo echo ============================================
echo echo   CREDORA FRONTEND
echo echo   Starting on http://localhost:5173
echo echo ============================================
echo echo.
echo npm run dev
echo pause
) > START_FRONTEND.bat

echo %GREEN%[OK] Created START_FRONTEND.bat%NC%

REM Create stop script
(
echo @echo off
echo echo Stopping Credora Fabric Network...
echo cd /d "%%~dp0fabric-network"
echo docker-compose down
echo echo.
echo echo Network stopped!
echo pause
) > STOP_FABRIC.bat

echo %GREEN%[OK] Created STOP_FABRIC.bat%NC%

echo.

REM ============================================================================
REM SUCCESS!
REM ============================================================================

echo.
echo ============================================================
echo    %GREEN%SETUP COMPLETE!%NC%
echo ============================================================
echo.
echo %GREEN%Fabric Network is RUNNING!%NC%
echo.
echo %YELLOW%NEXT STEPS:%NC%
echo.
echo 1. Start Backend:
echo    %BLUE%Double-click: START_BACKEND.bat%NC%
echo    OR run: cd deid-core\backend ^&^& npm run dev
echo.
echo 2. Start Frontend:
echo    %BLUE%Double-click: START_FRONTEND.bat%NC%
echo    OR run: cd veripass-wallet ^&^& npm run dev
echo.
echo 3. Open Browser:
echo    %BLUE%http://localhost:5173%NC%
echo.
echo ============================================================
echo.
echo %YELLOW%USEFUL COMMANDS:%NC%
echo.
echo - View containers:  docker ps
echo - View logs:        docker logs [container-name]
echo - Stop network:     STOP_FABRIC.bat
echo - Restart:          Run this script again
echo.
echo ============================================================
echo.
echo %GREEN%Ready for Blockchain India Challenge Demo!%NC%
echo.
echo ============================================================
echo.

pause
