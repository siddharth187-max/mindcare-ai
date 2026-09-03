@echo off
title MindCare - Dementia Cognitive & Routine Platform
echo =======================================================
echo   MindCare: Dementia-Friendly Cognitive Assistance
echo   SIH 2026 Healthcare Platform
echo =======================================================
echo.

set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not found in PATH or in %LOCALAPPDATA%\Programs\nodejs.
    echo Please install Node.js to run the application.
    pause
    exit /b 1
)

echo [1/2] Starting MindCare Backend & Dementia Web Application...
start "MindCare Server" cmd /c "title MindCare Server && node server.js"

echo [2/2] Waiting for server to initialize...
timeout /t 2 /nobreak >nul

echo.
echo Opening MindCare in your web browser...
start http://localhost:5000

echo.
echo =======================================================
echo   MindCare is running!
echo   Website: http://localhost:5000
echo   API Health: http://localhost:5000/api/health
echo.
echo   Press any key to stop the server and exit.
echo =======================================================
pause >nul
taskkill /F /FI "WINDOWTITLE eq MindCare Server" >nul 2>&1
echo MindCare stopped. Goodbye!
