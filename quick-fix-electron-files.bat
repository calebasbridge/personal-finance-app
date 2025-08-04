@echo off
echo.
echo ===============================================
echo   Quick Fix: Build Missing Electron Files
echo ===============================================
echo.

echo Building missing main.js and preload.js files...
echo.

cd /d "C:\Users\caleb\OneDrive\Documents\personal-finance-app-v2"

echo Building Electron main process...
npm run build:electron

echo.
echo Building Electron preload script...
npm run build:preload

echo.
if %ERRORLEVEL% EQU 0 (
    echo ✅ SUCCESS: Electron files compiled successfully!
    echo.
    echo Files created:
    echo - dist/main.js (Electron main process)
    echo - dist/preload.js (Electron preload script)
    echo.
    echo Now you can run: npm run start
    echo.
) else (
    echo ❌ FAILED: Compilation errors occurred
    echo.
    echo Check the errors above and fix any issues
    echo.
)

echo.
echo Press any key to continue...
pause > nul
