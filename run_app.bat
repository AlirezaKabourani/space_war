@echo off
REM go to the folder of this script
cd /d "%~dp0"

REM run dev server (will open browser because of vite --open)
call npm run dev

REM keep window open if something went wrong
pause
