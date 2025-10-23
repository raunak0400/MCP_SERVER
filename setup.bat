@echo off
REM Quick setup script for MCP Server

echo ================================
echo MCP Server - Quick Setup
echo ================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js 20+ from: https://nodejs.org/
    echo After installation, restart this terminal and run this script again.
    echo.
    pause
    exit /b 1
)

REM Check Node version
for /f "tokens=1" %%v in ('node --version') do set NODE_VERSION=%%v
echo [OK] Node.js found: %NODE_VERSION%

REM Check if npm is available
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not available!
    echo Please reinstall Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=1" %%v in ('npm --version') do set NPM_VERSION=%%v
echo [OK] npm found: %NPM_VERSION%
echo.

REM Check if node_modules exists
if exist node_modules (
    echo [INFO] node_modules folder exists
    echo Do you want to reinstall dependencies? (Y/N)
    set /p REINSTALL=
    if /i "%REINSTALL%"=="Y" (
        echo Removing old node_modules...
        rmdir /s /q node_modules
        del package-lock.json 2>nul
    )
)

REM Install dependencies
echo.
echo [STEP 1/4] Installing dependencies...
echo This may take a few minutes...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm install failed!
    pause
    exit /b 1
)
echo [OK] Dependencies installed
echo.

REM Create .env if it doesn't exist
if not exist .env (
    echo [STEP 2/4] Creating .env file...
    copy .env.example .env >nul
    echo [OK] .env file created
) else (
    echo [STEP 2/4] .env file already exists
)
echo.

REM Build TypeScript
echo [STEP 3/4] Building TypeScript project...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Build had errors, but continuing...
) else (
    echo [OK] Build completed successfully
)
echo.

REM Run type check
echo [STEP 4/4] Running type check...
call npm run typecheck
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Type check found issues
    echo You can fix these later by running: npm run typecheck
) else (
    echo [OK] Type check passed
)
echo.

echo ================================
echo Setup Complete!
echo ================================
echo.
echo Your MCP Server is ready to use!
echo.
echo Quick commands:
echo   npm run dev          - Start development server
echo   npm run build        - Build for production
echo   npm start            - Start production server
echo   npm run check:health - Test health endpoint
echo   npm run metrics:dump - View metrics
echo.
echo For more information, see INSTALL.md and README.md
echo.
pause
