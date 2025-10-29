@echo off
echo.
echo ================================
echo  Media Download Telegram Bot
echo ================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo [INFO] Node.js version:
node --version

REM Check if package.json exists
if not exist "package.json" (
    echo [ERROR] package.json not found
    echo Make sure you're in the correct directory
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

REM Install dependencies
echo.
echo [INFO] Installing dependencies...
npm install
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo.
    echo [INFO] Creating .env file from template...
    copy ".env.example" ".env"
    echo.
    echo [IMPORTANT] Please edit the .env file and add your BOT_TOKEN
    echo You can get a bot token from @BotFather on Telegram
    echo.
    echo Opening .env file for editing...
    timeout /t 3 >nul
    notepad .env
)

REM Create necessary directories
if not exist "downloads" mkdir downloads
if not exist "logs" mkdir logs

echo.
echo [SUCCESS] Setup completed successfully!
echo.
echo Next steps:
echo 1. Make sure you've added your BOT_TOKEN to the .env file
echo 2. Run 'npm start' to start the bot
echo 3. Send /start to your bot on Telegram
echo.
echo Commands:
echo   npm start     - Start the bot
echo   npm run dev   - Start in development mode with auto-restart
echo.

pause