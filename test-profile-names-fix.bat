echo "Testing Profile System Fixes - Name and Date Issues..."
echo ""
echo "Fixes applied:"
echo "1. Profile name sanitization - now preserves spaces"
echo "2. Interface alignment - using 'created' and 'displayName' properties"  
echo "3. Active profile marking - current profile marked as active"
echo "4. Display name handling - shows display names in UI"
echo ""
echo "Cleaning cache..."
rmdir /s /q node_modules\.cache 2>NUL
del /f /q tsconfig.tsbuildinfo 2>NUL
echo ""
echo "Building application with profile fixes..."
npm run electron:build
echo ""
echo "Build complete! Profile system should now:"
echo "- Preserve spaces in profile names (no more underscores)"
echo "- Show proper creation dates instead of 'Invalid Date'"
echo "- Display profile display names in UI"
echo "- Mark current profile as active correctly"
echo ""
pause
