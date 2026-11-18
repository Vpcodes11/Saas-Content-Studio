import fs from 'fs';
import path from 'path';

// Minimal 1x1 blue PNG (valid base64 PNG)
const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEeQHzEee8/AAAAABJRU5ErkJggg==';
const buffer = Buffer.from(base64Png, 'base64');

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

['icon-16.png', 'icon-32.png', 'icon-48.png', 'icon-128.png', 'icon.png'].forEach((file) => {
  fs.writeFileSync(path.join(publicDir, file), buffer);
});

console.log('Icons created successfully');
