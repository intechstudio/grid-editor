# Grid Editor

[![GitHub release](https://img.shields.io/github/release/intechstudio/grid-editor)](https://github.com/intechstudio/grid-editor/releases/latest)

## Running the app locally (delopment) in Electron under Ubuntu (Tested on Xubuntu 25.10)

```
sudo apt-get install -y nodejs
sudo apt-get install -y npm
git clone https://github.com/intechstudio/grid-editor.git
cd grid-editor
npm i
sudo chown root ./node_modules/electron/dist/chrome-sandbox
sudo chmod 4755 ./node_modules/electron/dist/chrome-sandbox
npm run electron-dev
```

## Serial port permission on Linux

User must have access to the serial port

```
sudo usermod -aG dialout $USER

```

Restart the computer!

## Flatpak fails to start: zypak-helper D-Bus error

On Debian (and Ubuntu ≥ 23.04), `dbus` is compiled without X11 autolaunch support.
Without `--socket=session-bus` in the Flatpak manifest, `zypak-helper` — the Electron
zygote sandbox helper bundled in `org.electronjs.Electron2.BaseApp` — cannot reach the
session bus and aborts with:

```
Failed to connect to session bus: [org.freedesktop.DBus.Error.NotSupported]
Using X11 for dbus-daemon autolaunch was disabled at compile time
Assertion failed: bus
```

`--socket=session-bus` is already present in the `finishArgs` of `electron-builder-config.js`.
If you are rebuilding the Flatpak manually, make sure that permission is included in your manifest.

## Flatpak Firefox Web Serial access

On Ubuntu (and likely Debian-based distros), if using Firefox installed via Flatpak, the Web Serial API cannot enumerate serial ports by default because the sandbox blocks access to the udev database. This is not needed on Fedora.

```
flatpak override --user --device=all --filesystem=/run/udev org.mozilla.firefox
```

Restart Firefox after running the command.

## Flatpak artifacts for nightly vs Flathub

The Flatpak CI job produces two artifact types:

- Installable Flatpak bundle (`*.flatpak`) for nightly/manual testing
- Flathub source tarball (`*.tar.gz`) from the unpacked Linux app

To keep nightly release downloads small, only `*.flatpak` files are included in GitHub release assets.
The `*.tar.gz` tarball is uploaded as a separate workflow artifact for Flathub distribution work and is not attached to nightly/stable release downloads.

## Code formatting using prettier

Format validator is run on every push, please make sure to run the prettier code formatter before pushing code to the repository!

```
npm i
npm run format
```

## Run app in WEB development mode

```
npm i
npm run web-dev
```

## Start local Profile Cloud development

1. Open Editor with `npm run electron-dev`
2. Preferences -> Developer settings –> Package Developer Mode -> ☑️
3. Preferences -> Developer settings –> Profile cloud URL -> package://profile-cloud/public
4. Restart Editor fully, renderer reload is not enough!, `ctrl+c`
5. Start the `profile-cloud` project in webcomponent mode with `npm run dev:webcomponent`
6. Editor should receive a message through websocket:9000, when the webcomponent is built. The Package Manager panel should give a prompt to accept the development package.
7. Reload Editor (shift+cmd+R)
8. The dev:webcomponent Profile Cloud should be rendered into the Profile Cloud panel

## Grid Editor and Profile Cloud projects during development

- handy firebase commands: `firebase logout`, `firebase login`, `firebase projects:list`, `firebase use THE-PROJECT-NAME`
- is-auth-dev is the central firebase authentication project used by the Grid Editor
- profile-cloud-dev is the profile cloud firebase project used by the Profile Cloud
- when firestore security settings are changed, they shouls be either emulated locally or pushed to the appropiate project environment
- passing auth is through `oidc`
