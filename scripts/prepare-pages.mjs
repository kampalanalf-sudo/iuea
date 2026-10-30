import { copyFile, cp, rm } from 'node:fs/promises';

// GitHub Pages currently publishes the repository root, while /docs and dist
// are also usable publishing roots. Keep the domain and 404 in all three.
await copyFile('public/CNAME', 'CNAME');
await copyFile('public/404.html', '404.html');
await rm('docs', { recursive: true, force: true });
await cp('dist', 'docs', { recursive: true });
