
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: undefined,
  entryPointToBrowserMapping: {
  "node_modules/@angular/animations/fesm2022/browser.mjs": [
    {
      "path": "chunk-75SJJ77Z.js",
      "dynamicImport": false
    }
  ],
  "src/app/features/callback/callback.module.ts": [
    {
      "path": "chunk-U7KDWFI3.js",
      "dynamicImport": false
    }
  ]
},
  assets: {
    'index.csr.html': {size: 64281, hash: 'ce76a7023eb3003e92d47536411374f485f845a933049f949e226033d9e73591', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17363, hash: '88f546c4b02837fe0c26b95ff2bffac17838dbeb167d11d1197e4d060cc0bfe8', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-I54XUQNR.css': {size: 94569, hash: 'A5DWwJ9u4Ps', text: () => import('./assets-chunks/styles-I54XUQNR_css.mjs').then(m => m.default)}
  },
};
