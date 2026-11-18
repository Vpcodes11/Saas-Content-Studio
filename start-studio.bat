@echo off
title SaaS Content Studio
echo ===================================================
echo           SaaS Content Studio Launcher
echo ===================================================
echo.
echo Starting SaaS Content Studio on http://localhost:3000 ...
echo.

REM Open browser after 2 seconds in background
start "" timeout /t 2 /nobreak >nul & start http://localhost:3000

REM Run the Next.js production server
call pnpm --filter @scs/web start

pause
