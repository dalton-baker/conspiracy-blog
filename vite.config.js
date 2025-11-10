import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

function fixBootstrapSourceMapComment() {
	return {
		name: 'fix-bootstrap-sourcemap-comment',
		closeBundle() {
			const dirs = [
				'build/_app/immutable/assets',                         // adapter-cloudflare / final
				'.svelte-kit/output/client/_app/immutable/assets'       // local build
			];

			for (const dir of dirs) {
				if (!fs.existsSync(dir)) continue;

				const files = fs.readdirSync(dir);
				const jsFile = files.find(f => f.startsWith('bootstrap.bundle.') && f.endsWith('.js'));
				const mapFile = files.find(f => f.startsWith('bootstrap.bundle.') && f.endsWith('.map'));
				if (!jsFile || !mapFile) continue;

				const jsPath = path.join(dir, jsFile);
				const mapFileName = path.basename(mapFile);

				try {
					let contents = fs.readFileSync(jsPath, 'utf8');

					// Replace or add the sourceMappingURL line at the end of the file
					if (contents.includes('sourceMappingURL=')) {
						contents = contents.replace(
							/\/\/# sourceMappingURL=.*$/m,
							`//# sourceMappingURL=${mapFileName}`
						);
					} else {
						contents += `\n//# sourceMappingURL=${mapFileName}`;
					}

					fs.writeFileSync(jsPath, contents, 'utf8');
					console.log(`✅ Updated sourceMappingURL in ${jsFile} → ${mapFileName}`);
				} catch (err) {
					console.error(`❌ Failed to update ${jsFile}: ${err.message}`);
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
