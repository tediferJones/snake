await Bun.build({
  entrypoints: [ 'src/client.ts' ],
  outdir: 'public/',
  minify: true,
  splitting: true,
})

Bun.spawnSync('bunx tailwindcss -i src/globals.css -o public/style.css --minify'.split(' '))

Bun.serve({
  fetch: async (req) => {
    let path = new URL(req.url).pathname;
    if (path === '/') path = '/index.html';
    console.log(path);
    const file = Bun.file('public' + path);
    const exists = await file.exists();
    return new Response(
      exists ? file : 'File not found',
      { status: exists ? 200 : 404 }
    )
  }
});
