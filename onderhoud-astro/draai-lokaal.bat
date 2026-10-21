@echo off
setlocal
rem Wordt aangeroepen door ..\start-website.bat, nadat die de laatste versie
rem al heeft opgehaald. Dit bestand mag dus gerust meeveranderen bij een
rem update - het wordt pas gelezen nadat het ophalen al klaar is.
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [FOUT] Node.js is niet gevonden.
  echo        Installeer de LTS-versie via https://nodejs.org en start dit
  echo        bestand daarna opnieuw.
  goto :einde
)

echo [1/4] Pakketten controleren...
call npm install
if errorlevel 1 goto :fout
rem npm 11 houdt installatiescripts tegen tot ze zijn goedgekeurd; zonder die
rem goedkeuring ontbreken esbuild en workerd. Oudere npm kent deze opdracht
rem niet - de melding daarover mag je negeren. npm install zelf doet niets
rem (en kost dus bijna geen tijd) als er toch niets gewijzigd is.
call npm approve-scripts --all

echo.
echo [2/4] Database bijwerken...
call npm run db:migrate
if errorlevel 1 goto :fout

rem Config (onderdelen, categorieën, acties, velden) wordt bijgewerkt;
rem materiaal en logregels worden alleen aangemaakt, nooit overschreven -
rem dit opnieuw draaien is dus altijd veilig, ook op een computer die de
rem database allang had. Zo komt een nieuw onderdeel dat erbij komt (zoals
rem Opstakelparcours) ook aan op een computer die al eerder is gestart.
echo.
echo [3/4] Voorbeeldgegevens en nieuwe onderdelen bijwerken...
call npm run seed
if errorlevel 1 goto :fout

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
