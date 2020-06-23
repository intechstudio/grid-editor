two main arrays in the work: layoutcells and usedcells.

# steps to add new module

add control elements to modules/elements
add module as >modulename.svelte< to modules. 
set module default id to module name (only lowercase)
add to App.svelte the module, in the {#each $cells as cell}{/each} segment for rendering.
add to DragModule.svelte the draggable preview image and div
add in DragModule.svelte to the invisible modules ? // this may be not necessary, as the rendering changed from direct dom manipulation to dynamic component rendering...

# svelte-tailwindcss-template

This is a fork of Svelte's project template to enable usage of Tailwindcss. Refer to https://github.com/sveltejs/template for more info.

To create a new project based on this template using [degit](https://github.com/Rich-Harris/degit):

```bash
npx degit sarioglu/svelte-tailwindcss-template svelte-app
cd svelte-app
```

_Note that you will need to have [Node.js](https://nodejs.org) installed._

## Get started

Install the dependencies...

```bash
cd svelte-app
npm install
```

...then start [Rollup](https://rollupjs.org):

```bash
npm run dev
```

Navigate to [localhost:5000](http://localhost:5000). You should see your app running. Edit a component file in `src`, save it, and reload the page to see your changes.

By default, the server will only respond to requests from localhost. To allow connections from other computers, edit the `sirv` commands in package.json to include the option `--host 0.0.0.0`.

## Deploying to the web

### With [now](https://zeit.co/now)

Install `now` if you haven't already:

```bash
npm install -g now
```

Then, from within your project folder:

```bash
cd public
now
```

As an alternative, use the [Now desktop client](https://zeit.co/download) and simply drag the unzipped project folder to the taskbar icon.

### With [surge](https://surge.sh/)

Install `surge` if you haven't already:

```bash
npm install -g surge
```

Then, from within your project folder:

```bash
npm run build
surge public
```
