'use strict';

const esbuild = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');

esbuild
  .build({
    entryPoints: ['./app.ts'],
    outfile: 'dist/app.js',
    bundle: true,
    minify: true,
    platform: 'node',
    sourcemap: true,
    target: 'node16',
    plugins: [nodeExternalsPlugin()],
  })
  .catch(() => process.exit(1))