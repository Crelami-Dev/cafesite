import fs from 'node:fs';
import path from 'node:path';

export function packageFiles(root) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package-manifest.json'), 'utf8'));
  const files = new Set();
  const absoluteRoot = fs.realpathSync(root);
  function visit(relative) {
    const target = path.resolve(root, relative);
    const actual = fs.realpathSync(target);
    const boundary = path.relative(absoluteRoot, actual);
    if (boundary.startsWith('..') || path.isAbsolute(boundary)) throw new Error(`Package path escapes root: ${relative}`);
    if (fs.statSync(target).isDirectory()) {
      for (const name of fs.readdirSync(target)) visit(path.join(relative, name));
    } else {
      if (/(^|\/)(node_modules|\.next|out|\.env[^/]*)(\/|$)/.test(relative.replaceAll('\\', '/'))) throw new Error(`Private/generated package path: ${relative}`);
      files.add(relative.replaceAll('\\', '/'));
    }
  }
  for (const relative of manifest.include) visit(relative);
  return { manifest, files: [...files].sort() };
}
