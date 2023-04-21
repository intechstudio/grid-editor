# Grid Editor

[![Generic badge](https://img.shields.io/badge/Grid_Editor-Beta-blue.svg)](https://github.com/intechstudio/grid-editor/releases/latest)
[![GitHub release](https://img.shields.io/github/release/intechstudio/grid-editor)](https://github.com/intechstudio/grid-editor/releases/latest)

User manual is available under the wiki section: [wiki](https://github.com/intechstudio/grid-editor/wiki/user-manual).

<img src="https://raw.githubusercontent.com/intechstudio/grid-editor/stable/wiki/assets/overview.png" alt="Grid Editor" width="100%" height="100%">

```
git clone https://github.com/intechstudio/grid-editor.git
git submodule update --init --recursive
sudo usermod -a -G dialout $USER
restart

```

## Code formatting using prettier

Format validator is run on every push, please make sure to run the prettier code formatter before pushing code to the repository!

```
npm i prettier --global
npm i prettier-plugin-svelte --global
prettier --write .
```

© Intech Studio Ltd.
