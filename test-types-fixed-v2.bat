@echo off
echo.
echo =========================================================
echo   Testing TypeScript Build After Profile API Type Fixes
echo =========================================================
echo.

echo Testing TypeScript compilation with explicit type imports...
echo.

cd /d "C:\Users\caleb\OneDrive\Documents\personal-finance-app-v2"

npm run build

echo.
if %ERRORLEVEL% EQU 0 (
    echo ✅ SUCCESS: TypeScript compilation completed without errors!
    echo.
    echo Enhanced system ready for deployment:
    echo - ProfileAPI types properly recognized
    echo - All interface definitions aligned
    echo - Build compilation successful
    echo.
    echo Ready to run: build-enhanced-system.bat
) else (
    echo ❌ FAILED: TypeScript compilation errors remain
    echo.
    echo Check the errors above and fix any remaining issues
    echo.
)

echo.
echo Press any key to continue...
pause > nul
