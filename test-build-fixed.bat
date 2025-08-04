echo "Testing TypeScript build after configuration fix..."
echo ""
echo "Clearing TypeScript cache..."
rmdir /s /q node_modules\.cache 2>NUL
del /f /q tsconfig.tsbuildinfo 2>NUL
echo ""
echo "Running build..."
npm run electron:build
echo ""
echo "Build test complete."
pause
