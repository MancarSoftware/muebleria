import { readdir } from 'node:fs/promises';
import sharp from 'sharp';

for (const folder of ['src/assets', 'src/assets/products']) {
  for (const fileName of await readdir(folder)) {
    if (!fileName.endsWith('.png')) continue;
    const input = `${folder}/${fileName}`;
    const output = input.replace(/\.png$/, '.webp');
    await sharp(input)
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, effort: 6 })
      .toFile(output);
  }
}
