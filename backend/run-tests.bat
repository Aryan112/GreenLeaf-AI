@echo off
echo ================================
echo 🧪 Integration Test Runner
echo ================================
echo.

REM Check if server is running
echo 📡 Checking if server is running...
curl -k -s https://localhost:3443 > nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ Server is not running!
    echo 💡 Please start the server first:
    echo    npm start
    echo.
    pause
    exit /b 1
)

echo ✅ Server is running
echo.
echo 🚀 Running integration tests...
echo.

node tests\integration.test.js

echo.
echo ================================
echo 📊 Opening test report...
echo ================================

REM Open HTML report if it exists
if exist tests\test-report.html (
    start tests\test-report.html
    echo ✅ Test report opened in browser
) else (
    echo ⚠️  Test report not found
)

echo.
echo 📸 Screenshots saved in: tests\screenshots\
echo.
pause
