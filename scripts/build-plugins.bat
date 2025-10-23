@echo off
REM Build script for compiling C and C++ plugins on Windows

echo Building C and C++ plugins...
echo.

REM Directories
set C_DIR=src\plugins\external\c
set CPP_DIR=src\plugins\external\cpp

REM Check for MSVC (cl.exe)
where cl.exe >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Found MSVC compiler
    set COMPILER=msvc
    goto :build
)

REM Check for MinGW GCC
where gcc.exe >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Found MinGW GCC compiler
    set COMPILER=mingw
    goto :build
)

echo Error: No C/C++ compiler found!
echo Please install either:
echo   - Visual Studio Build Tools (MSVC)
echo   - MinGW-w64 (GCC for Windows)
echo.
pause
exit /b 1

:build

if "%COMPILER%"=="msvc" goto :build_msvc
if "%COMPILER%"=="mingw" goto :build_mingw

:build_mingw
echo.
echo Using MinGW GCC compiler
echo.

REM Build C plugins
echo Building C plugins...

if exist "%C_DIR%\echo.c" (
    echo   Building echo.c...
    gcc -O2 -Wall -Wextra -o "%C_DIR%\echo.exe" "%C_DIR%\echo.c"
    if %ERRORLEVEL% EQU 0 (
        echo   [OK] echo.c compiled successfully
    ) else (
        echo   [ERROR] Failed to compile echo.c
    )
)

if exist "%C_DIR%\utils.c" (
    echo   Building utils.c...
    gcc -O2 -Wall -Wextra -std=c11 -o "%C_DIR%\utils.exe" "%C_DIR%\utils.c"
    if %ERRORLEVEL% EQU 0 (
        echo   [OK] utils.c compiled successfully
    ) else (
        echo   [ERROR] Failed to compile utils.c
    )
)

REM Build C++ plugins
echo.
echo Building C++ plugins...

if exist "%CPP_DIR%\echo.cpp" (
    echo   Building echo.cpp...
    g++ -O2 -Wall -Wextra -std=c++17 -o "%CPP_DIR%\echo.exe" "%CPP_DIR%\echo.cpp"
    if %ERRORLEVEL% EQU 0 (
        echo   [OK] echo.cpp compiled successfully
    ) else (
        echo   [ERROR] Failed to compile echo.cpp
    )
)

if exist "%CPP_DIR%\processor.cpp" (
    echo   Building processor.cpp...
    g++ -O2 -Wall -Wextra -std=c++17 -o "%CPP_DIR%\processor.exe" "%CPP_DIR%\processor.cpp"
    if %ERRORLEVEL% EQU 0 (
        echo   [OK] processor.cpp compiled successfully
    ) else (
        echo   [ERROR] Failed to compile processor.cpp
    )
)

goto :done

:build_msvc
echo.
echo Using MSVC compiler
echo.

REM Build C plugins
echo Building C plugins...

if exist "%C_DIR%\echo.c" (
    echo   Building echo.c...
    cl /O2 /W4 /Fe:"%C_DIR%\echo.exe" "%C_DIR%\echo.c" /link /INCREMENTAL:NO
    if %ERRORLEVEL% EQU 0 (
        echo   [OK] echo.c compiled successfully
        del "%C_DIR%\echo.obj" 2>nul
    ) else (
        echo   [ERROR] Failed to compile echo.c
    )
)

if exist "%C_DIR%\utils.c" (
    echo   Building utils.c...
    cl /O2 /W4 /Fe:"%C_DIR%\utils.exe" "%C_DIR%\utils.c" /link /INCREMENTAL:NO
    if %ERRORLEVEL% EQU 0 (
        echo   [OK] utils.c compiled successfully
        del "%C_DIR%\utils.obj" 2>nul
    ) else (
        echo   [ERROR] Failed to compile utils.c
    )
)

REM Build C++ plugins
echo.
echo Building C++ plugins...

if exist "%CPP_DIR%\echo.cpp" (
    echo   Building echo.cpp...
    cl /O2 /W4 /EHsc /std:c++17 /Fe:"%CPP_DIR%\echo.exe" "%CPP_DIR%\echo.cpp" /link /INCREMENTAL:NO
    if %ERRORLEVEL% EQU 0 (
        echo   [OK] echo.cpp compiled successfully
        del "%CPP_DIR%\echo.obj" 2>nul
    ) else (
        echo   [ERROR] Failed to compile echo.cpp
    )
)

if exist "%CPP_DIR%\processor.cpp" (
    echo   Building processor.cpp...
    cl /O2 /W4 /EHsc /std:c++17 /Fe:"%CPP_DIR%\processor.exe" "%CPP_DIR%\processor.cpp" /link /INCREMENTAL:NO
    if %ERRORLEVEL% EQU 0 (
        echo   [OK] processor.cpp compiled successfully
        del "%CPP_DIR%\processor.obj" 2>nul
    ) else (
        echo   [ERROR] Failed to compile processor.cpp
    )
)

:done
echo.
echo Build completed!
echo.
echo Built plugins:
dir /B "%C_DIR%\*.exe" 2>nul
dir /B "%CPP_DIR%\*.exe" 2>nul
echo.
echo To test plugins:
echo   C utils:    %C_DIR%\utils.exe "{\"test\":\"data\"}"
echo   C++ proc:   %CPP_DIR%\processor.exe "{\"action\":\"stats\"}"
echo.
pause
