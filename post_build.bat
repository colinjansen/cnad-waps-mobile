@echo off

set CORDOVA_DIR=%CD%

chdir ..
copy /Y "cordova\platforms\android\build\outputs\apk\android-debug.apk" "mobile\dist\android\WAPSMobile.apk"
git add --all
git commit -m "new android mobile version"

chdir %CORDOVA_DIR%