@echo off
echo.
echo ========================================
echo  TELEGRAM BOT - INSTAGRAM FIX SETUP
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Node.js detected: 
node --version

REM Install dependencies
echo.
echo [INFO] Installing dependencies...
npm install
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    echo Try running as Administrator or use Command Prompt instead of PowerShell
    pause
    exit /b 1
)

REM Setup environment
if not exist ".env" (
    echo.
    echo [INFO] Creating .env file...
    copy ".env.example" ".env"
    echo.
    echo [IMPORTANT] Please edit .env file and add your BOT_TOKEN
    echo Get your bot token from @BotFather on Telegram
    echo.
    notepad .env
)

REM Create directories
if not exist "downloads" mkdir downloads
if not exist "logs" mkdir logs

echo.
echo [SUCCESS] Setup complete!
echo.
echo To test Instagram URL parsing:
echo   node debug-url.js
echo.
echo To start the bot:
echo   npm start
echo.
echo Test URL: https://www.instagram.com/reel/DQGdUzwEQ1r/?utm_source=ig_web_copy_link
echo.

pause