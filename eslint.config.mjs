import path from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import pluginJs from '@eslint/js';
import globals from 'globals';

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: pluginJs.configs.recommended
});

/** @type {import('eslint').Linter.Config[]} */
export default [
	...compat.extends('airbnb-base'),
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				ecmaVersion: 2022,
			},
		},
		ignores: ['eslint.config.mjs', 'vite.config.js'],
		rules: {
			indent: [2, 'tab'],
			'no-tabs': 'off'
		},
	},
];
