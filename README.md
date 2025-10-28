# Grid Editor

[![GitHub release](https://img.shields.io/github/release/intechstudio/grid-editor)](https://github.com/intechstudio/grid-editor/releases/latest)

## Running the app locally (development) under Ubuntu (Tested on Xubuntu 25.10)

```
sudo apt-get install -y nodejs
sudo apt-get install -y npm
sudo apt-get install -y libudev-dev
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
