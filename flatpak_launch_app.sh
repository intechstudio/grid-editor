#!/bin/sh
# zypak-wrapper is provided by org.electronjs.Electron2.BaseApp and makes
# Electron's sandbox work inside the flatpak. /app/main/grid-editor is the
# unpacked Electron executable (named after electron-builder productName).
# Required to launch an application.
exec zypak-wrapper /app/main/grid-editor "$@"
