@echo off
echo.
echo ===============================================
echo    Personal Finance App - Profile Cleanup
echo ===============================================
echo.
echo This will fix duplicate "Main" profiles...
echo.
pause

echo Running profile cleanup...
node fix-duplicate-profiles.js

echo.
echo ===============================================
echo                   Complete!
echo ===============================================
echo.
echo You can now run the app normally.
echo.
pause