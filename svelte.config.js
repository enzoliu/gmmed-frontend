import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	precompress: true,

	kit: {
		adapter: adapter(),
		alias: {
			'$lib': 'src/lib',
			'$components': 'src/components',
			'$stores': 'src/stores',
			'$utils': 'src/utils'
		}
	}
};

export default config;
