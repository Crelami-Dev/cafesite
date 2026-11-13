#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { packageFiles } from './package-files.mjs';

const args = process.argv.slice(2);
const index = args.indexOf('--out');
if (index < 0 || !args[index + 1]) throw new Error('Usage: node export-skill.mjs --out <new-empty-destination>');
const root = path.resolve(import.meta.dirname, '..');
const output = path.resolve(args[index + 1]);
if (fs.existsSync(output)) throw new Error('Destination already exists. Choose a new directory; this tool never overwrites or deletes an installed skill.');
const relative = path.relative(root, output);
if (!relative.startsWith('..') && !path.isAbsolute(relative)) throw new Error('Export outside the source package to avoid recursive/self-containing artifacts.');
const { manifest, files } = packageFiles(root);
fs.mkdirSync(output, { recursive: true });
const hashes = {};
for (const relative of files) {
  const source = path.join(root, relative);
  const target = path.join(output, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  hashes[relative] = crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
}
fs.writeFileSync(path.join(output, 'export-proof.json'), JSON.stringify({ version: manifest.version, files: hashes }, null, 2));
console.log(JSON.stringify({ result: 'EXPORTED', version: manifest.version, files: files.length, destination: output, excludes: manifest.excludedContext }, null, 2));
