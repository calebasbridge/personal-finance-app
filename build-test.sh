#!/bin/bash
# Build script to test TypeScript compilation

echo "🧹 Cleaning previous build..."
rm -rf dist/*

echo "📦 Building webpack bundle..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Webpack build failed"
    exit 1
fi

echo "⚡ Building Electron main process..."
npm run build:electron

if [ $? -ne 0 ]; then
    echo "❌ Electron main build failed"
    exit 1
fi

echo "🔗 Building preload script..."
npm run build:preload

if [ $? -ne 0 ]; then
    echo "❌ Preload build failed"
    exit 1
fi

echo "✅ Build completed successfully!"
echo "🚀 You can now run: npm run electron:dev"
