#!/bin/bash
echo "Starting TypeScript build test..."
cd "/c/Users/caleb/OneDrive/Documents/personal-finance-app-v2"

echo
echo "Clearing any cached TypeScript files..."
rm -rf dist
rm -rf node_modules/.cache 2>/dev/null || true

echo
echo "Running npm run electron:build..."
npm run electron:build

echo
echo "Build completed. Check output above for any errors."
read -p "Press any key to continue..."
