@echo off
echo.
echo ===============================================
echo   Personal Finance App - Full Enhanced Build
echo ===============================================
echo.
echo This will:
echo 1. Clean up duplicate profiles
echo 2. Build the enhanced app with password protection
echo 3. Test the new features
echo.
pause

echo.
echo Step 1: Cleaning up duplicate profiles...
node fix-duplicate-profiles.js

echo.
echo Step 2: Building enhanced application...
npm run electron:build

echo.
echo Step 3: Starting enhanced application...
npm run start

echo.
echo ===============================================
echo            Enhanced Build Complete!
echo ===============================================
echo.
echo New Features Available:
echo - Password protection for profiles
echo - Duplicate profile prevention  
echo - Enhanced profile management UI
echo - Professional security features
echo.
pause