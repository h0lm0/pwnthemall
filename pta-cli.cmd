@echo off
REM Windows wrapper for pta-cli.sh
REM Requires Git Bash or WSL to be installed

setlocal enabledelayedexpansion

REM Check if we're running in WSL
where bash >nul 2>&1
if %ERRORLEVEL% equ 0 (
    bash -c "./pta-cli.sh %*"
    exit /b %ERRORLEVEL%
)

REM Check if Git Bash is installed
where git >nul 2>&1
if %ERRORLEVEL% equ 0 (
    for /f "delims=" %%i in ('where git') do (
        set "git_path=%%~dpi"
    )
    if defined git_path (
        "%git_path%bash.exe" -c "./pta-cli.sh %*"
        exit /b %ERRORLEVEL%
    )
)

echo Error: Could not find bash interpreter (WSL or Git Bash required)
exit /b 1
