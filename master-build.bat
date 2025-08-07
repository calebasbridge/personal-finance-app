@echo off
REM ================================================================
REM Personal Finance App - Master Build Script
REM ================================================================
REM This is the single comprehensive build script for the entire application.
REM It handles all compilation steps and can be easily modified for troubleshooting.
REM 
REM Usage: master-build.bat
REM Result: Complete application ready to launch with 'npm run start'
REM ================================================================

echo.
echo ================================================================
echo  🏦 Personal Finance App - Master Build Script
echo ================================================================
echo.
echo 🔧 Building complete application with all enhancements...
echo.

REM Step 1: Clean previous build (optional)
echo [1/4] Cleaning previous build...
if exist "dist\bundle.js" del "dist\bundle.js"
if exist "dist\main.js" del "dist\main.js"
if exist "dist\preload.js" del "dist\preload.js"
echo ✅ Build directory cleaned

echo.

REM Step 2: Build React application
echo [2/4] Building React application...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: React build failed!
    echo 💡 This usually means there are TypeScript errors in React components.
    echo 💡 Check the error messages above for specific issues.
    echo.
    pause
    exit /b 1
)
echo ✅ React application built successfully

echo.

REM Step 3: Build Electron main process
echo [3/4] Building Electron main process...
call npx tsc src/main.ts --outDir dist --module commonjs --target es2020 --moduleResolution node --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Electron main process build failed!
    echo 💡 This usually means there are TypeScript errors in main.ts.
    echo 💡 Check the error messages above for specific issues.
    echo.
    pause
    exit /b 1
)
echo ✅ Electron main process built successfully

echo.

REM Step 4: Build Electron preload script
echo [4/4] Building Electron preload script...
call npx tsc src/preload.ts --outDir dist --module commonjs --target es2020 --moduleResolution node --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Electron preload script build failed!
    echo 💡 This usually means there are TypeScript errors in preload.ts.
    echo 💡 Check the error messages above for specific issues.
    echo.
    pause
    exit /b 1
)
echo ✅ Electron preload script built successfully

echo.

REM Verify all required files exist
echo Verifying build output...
if not exist "dist\bundle.js" (
    echo ❌ ERROR: bundle.js not found!
    pause
    exit /b 1
)
if not exist "dist\main.js" (
    echo ❌ ERROR: main.js not found!
    pause
    exit /b 1
)
if not exist "dist\preload.js" (
    echo ❌ ERROR: preload.js not found!
    pause
    exit /b 1
)
if not exist "dist\index.html" (
    echo ❌ ERROR: index.html not found!
    pause
    exit /b 1
)

echo ✅ All required files present

echo.
echo ================================================================
echo 🎉 BUILD COMPLETE - APPLICATION READY!
echo ================================================================
echo.
echo 📁 Built files:
echo   ✅ dist/bundle.js     (React application)
echo   ✅ dist/main.js       (Electron main process)
echo   ✅ dist/preload.js    (Electron preload script)
echo   ✅ dist/index.html    (Application entry point)
echo.
echo 🚀 To launch the application:
echo   npm run start
echo.
echo 💡 If you encounter issues:
echo   1. Check error messages above
echo   2. Ensure Node.js v22+ is installed
echo   3. Run 'npm install' if dependencies are missing
echo   4. Contact support with specific error details
echo.
echo ================================================================
echo.
pause
