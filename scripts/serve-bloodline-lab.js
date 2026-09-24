'use strict';
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..');
const files = new Set(['bloodline-lab.html', 'css/bloodline-lab.css', 'js/utils/random.js', 'js/rules/horse-generator.js', 'js/rules/bloodline-system.js', 'js/data/bloodline-lab-fixtures.js', 'js/data/chairman-pedigrees.js', 'js/data/bloodline-pilot.js', 'js/bloodline-lab.js']);
files.add('js/data/bloodline-catalog.js');
files.add('js/ui/pedigree-tree.js');files.add('css/pedigree-tree.css');
http.createServer((req, res) => {
  const file = new URL(req.url, 'http://127.0.0.1').pathname.slice(1) || 'bloodline-lab.html';
  if (!files.has(file)) { res.writeHead(404); res.end('Not found'); return; }
  fs.readFile(path.join(root, file), (error, data) => {
    if (error) { res.writeHead(500); res.end('Cannot load preview'); return; }
    res.writeHead(200, { 'Content-Type': ({ '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' }[path.extname(file)]) + '; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(data);
  });
}).listen(9194, '127.0.0.1', () => console.log('血统验证台：http://127.0.0.1:9194/bloodline-lab.html'));
