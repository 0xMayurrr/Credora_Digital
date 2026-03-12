@echo off
REM Generate Crypto Material for Credora Fabric Network

echo.
echo ============================================================
echo   GENERATING CRYPTO MATERIAL FOR FABRIC NETWORK
echo ============================================================
echo.

cd /d "%~dp0fabric-network"

REM Clean old crypto material
if exist "organizations" (
    echo Removing old crypto material...
    rmdir /s /q organizations
)

if exist "channel-artifacts" (
    rmdir /s /q channel-artifacts
)

mkdir organizations
mkdir channel-artifacts

echo.
echo Generating crypto material using cryptogen...
echo.

REM Use Docker to run cryptogen (since we don't have Fabric binaries on Windows)
docker run --rm ^
  -v "%cd%:/work" ^
  -w /work ^
  hyperledger/fabric-tools:latest ^
  cryptogen generate --config=./crypto-config.yaml --output="organizations"

if errorlevel 1 (
    echo [ERROR] Failed to generate crypto material
    pause
    exit /b 1
)

echo.
echo [OK] Crypto material generated successfully!
echo.
echo Next step: Run SETUP_AND_START.bat
echo.

pause
