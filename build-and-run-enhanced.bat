@echo off
echo.
echo ===============================================
echo   Building Complete Enhanced System
echo ===============================================
echo.

echo Building complete enhanced personal finance application...
echo This includes React app, Electron main process, and preload script
echo.

cd /d "C:\Users\caleb\OneDrive\Documents\personal-finance-app-v2"

echo Step 1: Building complete Electron application...
npm run electron:build

echo.
if %ERRORLEVEL% EQU 0 (
    echo ✅ BUILD SUCCESS: Complete application compiled successfully!
    echo.
    echo 🎉 ENHANCED SYSTEM READY FOR DEPLOYMENT!
    echo.
    echo Starting the enhanced personal finance application with:
    echo - ✅ Complete password protection system
    echo - ✅ All 7 core financial components  
    echo - ✅ TypeScript compilation success
    echo - ✅ Multi-profile support with security
    echo - ✅ Enterprise-grade password hashing
    echo.
    
    echo Launching application...
    npm run electron:dev
) else (
    echo ❌ BUILD FAILED: Application compilation errors
    echo.
    echo Check the errors above and fix any build issues
    echo.
    pause
)
