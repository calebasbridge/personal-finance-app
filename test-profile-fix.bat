echo "Building and testing Profile System fix..."
echo ""
echo "Cleaning cache..."
rmdir /s /q node_modules\.cache 2>NUL
del /f /q tsconfig.tsbuildinfo 2>NUL
echo ""
echo "Building application..."
npm run electron:build
echo ""
echo "If build succeeds, the profile system should work properly now."
echo "The previous 'already exists' error should be resolved."
pause
