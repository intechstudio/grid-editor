import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import dynamicImportVars from '@rollup/plugin-dynamic-import-vars';
import copy from 'rollup-plugin-copy'
import { terser } from 'rollup-plugin-terser';
import sveltePreprocess from 'svelte-preprocess';
import css from 'rollup-plugin-css-only';
import rollup_start_dev from './rollup_start_dev';
import { lezer } from "lezer-generator/rollup"

import json from '@rollup/plugin-json';


import path from 'path';
import monaco from 'rollup-plugin-monaco-editor';

const production = !process.env.ROLLUP_WATCH;


export default {
	input: 'src/svelte.js',
	output: {
		sourcemap: false,
		format: 'es',
		name: 'app',
		dir: 'public/build/',
		entryFileNames: 'main.js'
	},
	plugins: [
		json(),
		lezer(),
		svelte({
			preprocess: sveltePreprocess({
				postcss: true,
				sourceMap: false,
			}),
			compilerOptions: {
				dev: !production
			}
		}),        
		monaco({
			languages: ['javascript', 'lua'],
		}),

		// we'll extract any component CSS out into
		// a separate file - better for performance
		css({ output: 'bundle.css' }),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration —
		// consult the documentation for details:
		// https://github.com/rollup/rollup-plugin-commonjs
		resolve({
			browser: true,
			dedupe: importee => importee === 'svelte' || importee.startsWith('svelte/')
		}),

		// some packages like luaparse needs this (?)
		commonjs(),

		// need this badboy to import dynamically components
		dynamicImportVars(),

		// In dev mode, call `npm run start:dev` once
		// the bundle has been generated
		!production && rollup_start_dev,

		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		!production && livereload('public'),

		// If building for production copy config svelte files to public

		production && copy ({
			targets:[
				{ src: 'src/app/config-blocks/*', dest: 'public/build/config-blocks'},
				{ src: 'public/assets/fonts/*', dest: 'public/build/assets/fonts'}
			],
			copyOnce: true,
			hook: "closeBundle"
		}),

		// If we're building for production (npm run build
		// instead of npm run dev, minify
		production && terser()
	],
	watch: {
		clearScreen: false,
		// Option for electron hot-reload.
		chokidar: false
	}
};
