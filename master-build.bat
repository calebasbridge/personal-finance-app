@echo off
echo.
echo ====================================
echo MASTER BUILD - Complete Application Build
echo ====================================
echo.

cd /d "C:\Users\caleb\OneDrive\Documents\personal-finance-app-v2"

echo Step 1: Cleaning previous build...
if exist dist\main.js del dist\main.js
if exist dist\preload.js del dist\preload.js

echo.
echo Step 2: Building React application...
call npm run build

if errorlevel 1 (
    echo ERROR: React build failed!
    pause
    exit /b 1
)

echo.
echo Step 3: Building Electron main process...
call npx tsc src/main.ts --outDir dist --module commonjs --target es2020 --esModuleInterop --skipLibCheck

if errorlevel 1 (
    echo ERROR: Main process build failed!
    pause
    exit /b 1
)

echo.
echo Step 4: Building Electron preload script...
call npx tsc src/preload.ts --outDir dist --module commonjs --target es2020 --esModuleInterop --skipLibCheck

if errorlevel 1 (
    echo ERROR: Preload script build failed!
    pause
    exit /b 1
)

echo.
echo ====================================
echo Verifying build files...
echo ====================================

if not exist dist\bundle.js (
    echo ERROR: bundle.js not found!
    pause
    exit /b 1
)

if not exist dist\main.js (
    echo ERROR: main.js not found!
    pause
    exit /b 1
)

if not exist dist\preload.js (
    echo ERROR: preload.js not found!
    pause
    exit /b 1
)

if not exist dist\index.html (
    echo ERROR: index.html not found!
    pause
    exit /b 1
)

echo.
echo ✓ All required files present!
echo.
echo ====================================
echo BUILD SUCCESSFUL!
echo ====================================
echo.
echo The app has been rebuilt with debug logging.
echo.
echo To launch the app:
echo   npx electron dist/main.js
echo.
echo Then:
echo 1. Press F12 to open DevTools
echo 2. Go to Console tab
echo 3. Navigate to Compensation Creator
echo 4. Check for error messages
echo.
pause