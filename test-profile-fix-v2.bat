echo "Testing Profile System Fix - Round 2..."
echo ""
echo "Cleaning cache and old builds..."
rmdir /s /q node_modules\.cache 2>NUL
del /f /q tsconfig.tsbuildinfo 2>NUL
echo ""
echo "Building application with improved profile system..."
npm run electron:build
echo ""
echo "Build complete! Check console for profile initialization messages."
echo "Profile system should now work properly:"
echo "- Fixed IPC handler names to match frontend expectations"  
echo "- Fixed profile creation return format"
echo "- Improved startup initialization logic"
echo "- Better error handling for existing profiles"
echo ""
pause
