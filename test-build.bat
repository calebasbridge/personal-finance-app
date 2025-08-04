@echo off
echo.
echo ===============================================
echo   Personal Finance App - Quick Build Test
echo ===============================================
echo.
echo Testing TypeScript compilation...
echo.

cd "C:\Users\caleb\OneDrive\Documents\personal-finance-app-v2"
npm run build

echo.
if %errorlevel%==0 (
    echo ✅ Build successful! TypeScript issues resolved.
) else (
    echo ❌ Build failed. Check errors above.
)
echo.
pause
