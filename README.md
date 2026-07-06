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
