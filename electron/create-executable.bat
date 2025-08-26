@echo off
echo Creando ejecutable de Windows para Granja App...

REM Crear carpeta de distribución
if not exist "dist-executable" mkdir dist-executable

REM Copiar archivos de la aplicación
echo Copiando archivos de la aplicación...
xcopy /E /I /Y "web-build" "dist-executable\web-build\"
copy "main.js" "dist-executable\"
copy "preload.js" "dist-executable\"
copy "package.json" "dist-executable\"

REM Copiar node_modules necesarios
echo Copiando dependencias...
xcopy /E /I /Y "node_modules" "dist-executable\node_modules\"

REM Crear archivo de inicio
echo Creando archivo de inicio...
echo @echo off > "dist-executable\Granja-App.bat"
echo cd /d "%%~dp0" >> "dist-executable\Granja-App.bat"
echo npx electron . >> "dist-executable\Granja-App.bat"

REM Crear acceso directo
echo Creando acceso directo...
echo @echo off > "dist-executable\Granja-App.exe"
echo cd /d "%%~dp0" >> "dist-executable\Granja-App.exe"
echo start "" "Granja-App.bat" >> "dist-executable\Granja-App.exe"

echo.
echo ¡Ejecutable creado exitosamente!
echo Ubicación: dist-executable\
echo Para ejecutar: Haz doble clic en Granja-App.exe
echo.
pause 