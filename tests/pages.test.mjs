import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

async function requireFile(path) {
  await access(new URL(path, root));
}

test('repository-root Pages HTML loads the committed bundle on both Pages hostnames', async () => {
  const html = await read('index.html');
  assert.match(html, /href="\.\/docs\/assets\/app-bundle\.css"/);
  assert.match(html, /src="\.\/docs\/assets\/app-bundle\.js"/);
  assert.doesNotMatch(html, /src="\/src\/main\.tsx"/);
  assert.doesNotMatch(html, /location\.hostname/);

  for (const base of ['https://tankmusicdistribution.site/', 'https://kampalanalf-sudo.github.io/iuea/']) {
    assert.equal(new URL('./docs/assets/app-bundle.js', base).pathname,
      base.includes('github.io') ? '/iuea/docs/assets/app-bundle.js' : '/docs/assets/app-bundle.js');
    assert.equal(new URL('./manuals/Artiste_Navigation_Manual.pdf', base).pathname,
      base.includes('github.io') ? '/iuea/manuals/Artiste_Navigation_Manual.pdf' : '/manuals/Artiste_Navigation_Manual.pdf');
  }
  await Promise.all(['docs/assets/app-bundle.js', 'docs/assets/app-bundle.css', 'manuals/Artiste_Navigation_Manual.pdf'].map(requireFile));
});

test('generated /docs and dist are self-contained and have the requested custom domain', async () => {
  for (const path of ['CNAME', 'public/CNAME', 'dist/CNAME', 'docs/CNAME']) {
    assert.equal(await read(path), 'tankmusicdistribution.site\n');
  }
  for (const directory of ['dist', 'docs']) {
    const html = await read(`${directory}/index.html`);
    assert.match(html, /src="\.\/assets\/app-bundle\.js"/);
    assert.match(html, /href="\.\/assets\/app-bundle\.css"/);
    assert.doesNotMatch(html, /data-pages-static|\/src\/main\.tsx|\.\/docs\/assets/);
    await Promise.all([
      `${directory}/.nojekyll`,
      `${directory}/assets/app-bundle.js`,
      `${directory}/assets/app-bundle.css`,
      `${directory}/manuals/Artiste_Navigation_Manual.pdf`,
    ].map(requireFile));
  }
  await requireFile('.nojekyll');
});

test('404 pages return users to the correct home while preserving the query and hash', async () => {
  const html = await read('public/404.html');
  assert.equal(await read('404.html'), html);
  assert.equal(await read('dist/404.html'), html);
  assert.equal(await read('docs/404.html'), html);
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);

  for (const [hostname, expected] of [
    ['tankmusicdistribution.site', '/?q=test#top'],
    ['www.tankmusicdistribution.site', '/?q=test#top'],
    ['kampalanalf-sudo.github.io', '/iuea/?q=test#top'],
  ]) {
    let destination;
    vm.runInNewContext(script, {
      window: { location: { hostname, search: '?q=test', hash: '#top', replace: (url) => { destination = url; } } },
    });
    assert.equal(destination, expected);
  }
});
