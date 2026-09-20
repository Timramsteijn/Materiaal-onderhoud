@echo off
setlocal enabledelayedexpansion
title Materiaalonderhoud - lokaal draaien

rem Start de app op deze computer: haalt de laatste versie op, werkt de
rem database bij en zet de ontwikkelserver aan op http://localhost:4321.
rem Dubbelklikken volstaat; de map waar dit bestand staat is het startpunt.
cd /d "%~dp0"

echo.
echo ==========================================
echo   Materiaalonderhoud - lokaal draaien
echo ==========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [FOUT] Node.js is niet gevonden.
  echo        Installeer de LTS-versie via https://nodejs.org en start dit
  echo        bestand daarna opnieuw.
  goto :einde
)

echo [1/4] Laatste wijzigingen ophalen van GitHub...
where git >nul 2>nul
if errorlevel 1 (
  echo       Git is niet gevonden - deze stap wordt overgeslagen.
) else (
  git pull --ff-only
  if errorlevel 1 (
    echo.
    echo       Ophalen is niet gelukt. Er staan mogelijk eigen wijzigingen
    echo       open. De app start met de versie die nu op deze computer staat.
  )
)

if not exist "onderhoud-astro\package.json" (
  echo.
  echo [FOUT] De map onderhoud-astro staat niet naast dit bestand.
  echo        Zet start-website.bat terug in de hoofdmap van het project.
  goto :einde
)
cd onderhoud-astro

rem Geen .wrangler-map betekent: nog nooit een database op deze computer.
set EERSTEKEER=0
if not exist ".wrangler" set EERSTEKEER=1

echo.
echo [2/4] Pakketten controleren...
if exist "node_modules" (
  echo       Al aanwezig.
) else (
  call npm install
  if errorlevel 1 goto :fout
  rem npm 11 houdt installatiescripts tegen tot ze zijn goedgekeurd; zonder
  rem die goedkeuring ontbreken esbuild en workerd. Oudere npm kent deze
  rem opdracht niet - de melding daarover mag je negeren.
  call npm approve-scripts --all
)

echo.
echo [3/4] Database bijwerken...
call npm run db:migrate
if errorlevel 1 goto :fout

if "%EERSTEKEER%"=="1" (
  echo.
  echo       Eerste keer op deze computer: de database wordt gevuld met de
  echo       voorbeeldgegevens. Kies een wachtwoord voor de accounts die
  echo       daarbij worden aangemaakt.
  echo.
  set /p WACHTWOORD=      Wachtwoord ^(minimaal 8 tekens^): 
  set "SEED_ADMIN_WACHTWOORD=!WACHTWOORD!"
  call npm run seed
  if errorlevel 1 goto :fout
)

echo.
echo [4/4] De app draait zo op http://localhost:4321
echo       Laat dit venster openstaan. Stoppen: Ctrl+C en daarna J.
echo.

rem De browser pas openen als de server waarschijnlijk luistert.
start "" /b cmd /c "timeout /t 8 /nobreak >nul 2>nul || ping -n 9 127.0.0.1 >nul & start http://localhost:4321"

call npm run dev
goto :einde

:fout
echo.
echo [FOUT] Er ging iets mis - de melding hierboven vertelt wat.

:einde
echo.
pause
endlocal
