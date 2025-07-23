const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
	if (!fs.existsSync(dest)) {
		fs.mkdirSync(dest, { recursive: true });
	}

	const entries = fs.readdirSync(src, { withFileTypes: true });

	for (let entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);

		if (entry.isDirectory()) {
			copyDir(srcPath, destPath);
		} else {
			fs.copyFileSync(srcPath, destPath);
		}
	}
}

// Remove dist/templates if it exists
const distTemplatesPath = path.join(__dirname, 'dist', 'templates');
if (fs.existsSync(distTemplatesPath)) {
	fs.rmSync(distTemplatesPath, { recursive: true, force: true });
}

// Copy src/templates to dist/templates
const srcTemplatesPath = path.join(__dirname, 'src', 'templates');
if (fs.existsSync(srcTemplatesPath)) {
	copyDir(srcTemplatesPath, distTemplatesPath);
	console.log('✅ Templates copied successfully');
} else {
	console.log('⚠️ Source templates directory not found');
}
