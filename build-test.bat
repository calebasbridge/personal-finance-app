@echo off
echo 🧹 Cleaning previous build...
del /q dist\*.*

echo 📦 Building webpack bundle...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Webpack build failed
    exit /b 1
)

echo ⚡ Building Electron main process...
call npm run build:electron
if %errorlevel% neq 0 (
    echo ❌ Electron main build failed
    exit /b 1
)

echo 🔗 Building preload script...
call npm run build:preload
if %errorlevel% neq 0 (
    echo ❌ Preload build failed
    exit /b 1
)

echo ✅ Build completed successfully!
echo 🚀 You can now run: npm run electron:dev
