@echo off
title Sanad - keep this window open
cd /d "%~dp0"

if not exist ".next\BUILD_ID" (
  echo Preparing Sanad for first use. This takes about a minute, once only...
  call npm run build
  if not exist ".next\BUILD_ID" (
    echo.
    echo Preparation failed. Please contact support.
    pause
    exit /b 1
  )
)

echo Starting Sanad... your browser will open shortly.
echo Keep THIS window open while you use Sanad. Closing it stops the app.
start "" cmd /c "timeout /t 6 /nobreak >nul & start http://localhost:3000"
npm start
