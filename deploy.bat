@echo off
title Deploy SaaS Content Studio
echo ===================================================
echo       SaaS Content Studio Production Deployment
echo ===================================================
echo.

echo [1/4] Building @scs/shared library...
call pnpm --filter @scs/shared build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Shared build failed.
    pause
    exit /b %ERRORLEVEL%
)

echo [2/4] Building and packaging Chrome Extension (MV3)...
call pnpm --filter @scs/extension zip
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Extension packaging failed.
    pause
    exit /b %ERRORLEVEL%
)

echo [3/4] Building Next.js Web App...
call pnpm --filter @scs/web build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Web app build failed.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ===================================================
echo [4/4] Deployment Build Completed Successfully!
echo.
echo - Chrome Extension Ready:
echo   apps\extension\.output\chrome-mv3 (Unpacked)
echo   apps\extension\.output\scsextension-0.1.0-chrome.zip (Distribution ZIP)
echo.
echo - Web Dashboard Ready:
echo   To launch, run: start-studio.bat
echo   or: pnpm --filter @scs/web start
echo ===================================================
echo.
pause
