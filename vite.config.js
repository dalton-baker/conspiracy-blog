import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

function renameBootstrapMap() {
	return {
		name: 'rename-bootstrap-map',
		closeBundle() {
			// SvelteKit’s final client output lives here:
			const dir = '.svelte-kit/output/client/_app/immutable/assets';

			if (!fs.existsSync(dir)) {
				console.log('⚠️ Assets directory not found:', dir);
				return;
			}

			const files = fs.readdirSync(dir);
			const jsFile = files.find(f => f.startsWith('bootstrap.bundle.') && f.endsWith('.js'));
			const mapFile = files.find(f => f.startsWith('bootstrap.bundle.') && f.endsWith('.map'));

			if (!jsFile || !mapFile) {
				console.log('ℹ️ Bootstrap JS or map not found, skipping rename.');
				return;
			}

			const newMapName = jsFile + '.map';
			const oldPath = path.join(dir, mapFile);
			const newPath = path.join(dir, newMapName);

			try {
				fs.renameSync(oldPath, newPath);
				console.log(`✅ Renamed ${mapFile} → ${newMapName}`);
			} catch (err) {
				console.error(`❌ Failed to rename map file: ${err.message}`);
			}
		}
	};
}

export default defineConfig({
	plugins: [
		sveltekit(), 
		renameBootstrapMap()
	]
});
