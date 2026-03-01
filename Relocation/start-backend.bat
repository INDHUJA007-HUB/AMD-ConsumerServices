@echo off
echo ========================================
echo Starting NammaWay Backend Server
echo ========================================
echo.

cd backend

echo Checking if backend directory exists...
if not exist "main.py" (
    echo ERROR: main.py not found in backend directory
    pause
    exit /b 1
)

echo.
echo Starting server on http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

python run.py

pause
