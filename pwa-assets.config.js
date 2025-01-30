import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

export default defineConfig({
	preset: {
		...minimal2023Preset,
	},
	headLinkOptions: {
		basePath: '/assets/',
	},
	images: ['public/assets/logo.svg'],
});
