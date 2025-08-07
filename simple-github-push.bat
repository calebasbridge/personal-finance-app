@echo off
echo.
echo =======================================================
echo   Personal Finance App - Simple GitHub Update Script
echo =======================================================
echo.

cd /d "C:\Users\caleb\OneDrive\Documents\personal-finance-app-v2"

echo Checking Git status...
git status

echo.
set /p choice="Add all changes and push to GitHub? (y/n): "

if /i "%choice%"=="y" (
    echo.
    echo Adding changes...
    git add .
    
    echo Creating commit...
    git commit -m "Update: Enhanced security and profile system"
    
    echo Pushing to GitHub...
    git push origin main
    
    echo.
    if %ERRORLEVEL% EQU 0 (
        echo SUCCESS: Changes pushed to GitHub successfully!
    ) else (
        echo FAILED: Push unsuccessful. Check your connection and permissions.
    )
) else (
    echo Update cancelled.
)

echo.
pause
