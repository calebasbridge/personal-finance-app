@echo off
echo.
echo ===============================================
echo   Testing TypeScript Build After Type Fixes
echo ===============================================
echo.

cd "C:\Users\caleb\OneDrive\Documents\personal-finance-app-v2"

echo Testing TypeScript compilation...
npm run build

echo.
if %errorlevel%==0 (
    echo ✅ SUCCESS! TypeScript compilation successful!
    echo.
    echo Ready to try the full enhanced build:
    echo build-enhanced-system.bat
) else (
    echo ❌ BUILD FAILED. Check errors above.
)
echo.
pause
