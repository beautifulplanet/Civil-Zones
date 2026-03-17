@echo off
title Civil Zones v04 - Beta 1 Java Port
echo ============================================
echo   CIVIL ZONES v04 - Beta 1 Java Port
echo   Date: December 30, 2025
echo   Type: JavaFX application (Maven)
echo ============================================
echo.
echo PREREQUISITES:
echo   - Java JDK 17 or newer
echo   - Apache Maven installed
echo.
echo OPTION A: Run the JavaFX app
echo   mvn clean javafx:run
echo.
echo OPTION B: Open the original HTML version
echo   (included as original-game.html)
echo.
echo ============================================
echo.
set /p choice="Press [1] for HTML version, [2] for Java (needs Maven): "
if "%choice%"=="1" (
    start "" "%~dp0original-game.html"
) else if "%choice%"=="2" (
    echo.
    echo Running Maven build...
    mvn clean javafx:run
) else (
    echo Opening HTML version by default...
    start "" "%~dp0original-game.html"
)
pause
