import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

function fixBootstrapSourceMapComment() {
	return {
		name: 'fix-bootstrap-sourcemap-comment',
		closeBundle() {
			const dirs = [
				'build/_app/immutable/assets',                         // adapter-cloudflare / prod output
				'.svelte-kit/output/client/_app/immutable/assets'       // local build output
			];

			for (const dir of dirs) {
				if (!fs.existsSync(dir)) continue;

				const files = fs.readdirSync(dir);
				const jsFile = files.find(f => f.startsWith('bootstrap.bundle.') && f.endsWith('.js'));
				const mapFile = files.find(f => f.startsWith('bootstrap.bundle.') && f.endsWith('.map'));

				if (!jsFile) continue; // nothing to fix
				const jsPath = path.join(dir, jsFile);
				const mapFileName = mapFile ? path.basename(mapFile) : null;

				try {
					let contents = fs.readFileSync(jsPath, 'utf8');

					if (contents.includes('sourceMappingURL=')) {
						if (mapFileName) {
							// Update the sourceMappingURL line with the actual map name
							contents = contents.replace(
								/\/\/# sourceMappingURL=.*$/m,
								`//# sourceMappingURL=${mapFileName}`
							);
							console.log(`✅ Updated sourceMappingURL in ${jsFile} → ${mapFileName}`);
						} else {
							// No map exists → remove the line entirely
							contents = contents.replace(/\/\/# sourceMappingURL=.*$/m, '');
							console.log(`🧹 Removed dangling sourceMappingURL from ${jsFile}`);
						}
					} else if (mapFileName) {
						// No existing line but a map exists → add one at the end
						contents += `\n//# sourceMappingURL=${mapFileName}`;
						console.log(`✨ Added sourceMappingURL to ${jsFile}`);
					}

					fs.writeFileSync(jsPath, contents, 'utf8');
				} catch (err) {
					console.error(`❌ Failed to process ${jsFile}: ${err.message}`);
				}
			}
		}
	};
}

export default defineConfig({
	plugins: [
		sveltekit(), 
		fixBootstrapSourceMapComment()
	]
});
