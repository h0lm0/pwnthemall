@echo off
setlocal enabledelayedexpansion

echo Searching for valid WSL or Git Bash interpreter...

rem Store arguments
set "args=%*"

rem Try to find any Ubuntu distribution first
if not "%WSL_WRAPPER_ACTIVE%"=="1" (
    set "ubuntu_distro="
    
    rem Parse WSL distributions to find any Ubuntu variant
    for /f "usebackq skip=1" %%i in (`wsl -l -v 2^>nul`) do (
        set "line=%%i"
        
        rem Extract distribution name (handle both with and without asterisk)
        if "!line:~0,1!"=="*" (
            rem Line starts with asterisk, get name from position 2
            for /f "tokens=1" %%j in ("!line:~2!") do set "distro=%%j"
        ) else (
            rem No asterisk, get first token
            for /f "tokens=1" %%j in ("!line!") do set "distro=%%j"
        )
        
        rem Check if distribution name contains "Ubuntu" (case insensitive)
        echo !distro! | findstr /i "ubuntu" >nul
        if not errorlevel 1 (
            set "ubuntu_distro=!distro!"
            goto :found_ubuntu
        )
    )
    
    :found_ubuntu
    if defined ubuntu_distro (
        echo Using Ubuntu WSL distribution: !ubuntu_distro!
        set WSL_WRAPPER_ACTIVE=1
        wsl -d "!ubuntu_distro!" bash -c "export WSL_WRAPPER_ACTIVE=1 && ./pta-cli.sh %args%"
        exit /b %ERRORLEVEL%
    )
) else (
    echo WSL Wrapper already active, avoiding recursion
    exit /b 1
)

rem If no Ubuntu found, try other distributions
echo No Ubuntu distribution found, searching for other distributions...
set "found_distro="

rem Parse WSL distributions
for /f "usebackq skip=1" %%i in (`wsl -l -v 2^>nul`) do (
    set "line=%%i"
    
    rem Extract distribution name (handle both with and without asterisk)
    if "!line:~0,1!"=="*" (
        rem Line starts with asterisk, get name from position 2
        for /f "tokens=1" %%j in ("!line:~2!") do set "distro=%%j"
    ) else (
        rem No asterisk, get first token
        for /f "tokens=1" %%j in ("!line!") do set "distro=%%j"
    )
    
    if "%DEBUG%"=="1" echo Debug: Checking distribution: "!distro!"
    
    rem Skip Docker and empty
    if /i not "!distro!"=="docker-desktop" if /i not "!distro!"=="docker-desktop-data" if not "!distro!"=="" (
        set "found_distro=!distro!"
        goto :use_wsl
    )
)

echo ❌ No compatible WSL distribution found.
goto :try_gitbash

:use_wsl
echo Using WSL distribution: !found_distro!
rem Set environment variable to prevent recursion
set WSL_WRAPPER_ACTIVE=1
wsl -d "!found_distro!" bash -c "export WSL_WRAPPER_ACTIVE=1 && ./pta-cli.sh %args%"
exit /b %ERRORLEVEL%

:try_gitbash
echo Trying with Git Bash...
for %%G in (bash.exe) do (
    where %%G >nul 2>&1
    if not errorlevel 1 (
        set "gitbash_path=%%~$PATH:G"
        echo Using Git Bash found in PATH: !gitbash_path!
        set WSL_WRAPPER_ACTIVE=1
        "!gitbash_path!" -c "export WSL_WRAPPER_ACTIVE=1 && ./pta-cli.sh %args%"
        exit /b %ERRORLEVEL%
    )
)

rem If not found in PATH, try querying the registry for Git installation path
for /f "tokens=2*" %%A in ('reg query "HKLM\SOFTWARE\GitForWindows" /v InstallPath 2^>nul') do (
    set "git_install_path=%%B"
)
if defined git_install_path (
    set "gitbash_path=!git_install_path!\bin\bash.exe"
    if exist "!gitbash_path!" (
        echo Using Git Bash found in registry: !gitbash_path!
        set WSL_WRAPPER_ACTIVE=1
        "!gitbash_path!" -c "export WSL_WRAPPER_ACTIVE=1 && ./pta-cli.sh %args%"
        exit /b %ERRORLEVEL%
    )
)

echo ❌ No valid Git Bash interpreter found.
echo ❌ No valid bash interpreter found.
echo.
echo Possible solutions:
echo - Install WSL: wsl --install
echo - Install Git for Windows with Git Bash
exit /b 1