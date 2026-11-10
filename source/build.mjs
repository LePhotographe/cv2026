import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const src = p => readFileSync(join(root, 'src', p), 'utf8');
const b64 = (p, mime) => 'data:' + mime + ';base64,' + readFileSync(join(root, 'assets', p)).toString('base64');

const IMG = { avatar: b64('avatar.jpg', 'image/jpeg'), portrait: b64('portrait.webp', 'image/webp') };
const WALL = b64('wallpaper.jpg', 'image/jpeg');
const JS_ORDER = ['data.js', 'xp-icons.js', 'audio.js', 'fs.js', 'core.js', 'apps.js', 'minigolf.js', 'desktop.js'];
const js = JS_ORDER.map(f => {
  if (!existsSync(join(root, 'src/js', f))) throw new Error('manquant : ' + f);
  return '/* ---- ' + f + ' ---- */\n' + src('js/' + f);
}).join('\n');

// Pointeurs : PNG en data URI (1x et 2x)
let css = src('xp.css');
for (const name of ['arrow', 'hand', 'text', 'nwse', 'wait', 'help']) {
  const key = name.toUpperCase();
  css = css.split('{{CUR_' + key + '2}}').join(b64('cursors/' + name + '@2x.png', 'image/png'));
  css = css.split('{{CUR_' + key + '}}').join(b64('cursors/' + name + '.png', 'image/png'));
}
if (/\{\{CUR_/.test(css)) throw new Error('pointeur non remplacé : ' + css.match(/\{\{CUR_\w+\}\}/)[0]);
const body = src('body-xp.html').replace('{{AVATAR}}', IMG.avatar).replace('{{WALLPAPER}}', WALL);

const TITLE = 'Arthur Chauvineau';
const DESC = 'Arthur Chauvineau, expérience client et transformation digitale. Un CV interactif façon bureau des années 2000, avec un mini-golf.';
const scripts = '<script>window.__IMG=' + JSON.stringify(IMG) + ';</script>\n<script>\n' + js + '\n</script>';

mkdirSync(join(root, 'dist/standalone'), { recursive: true });

const artifact = '<title>' + TITLE + '</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<meta name="description" content="' + DESC + '">\n<style>\n' + css + '\n</style>\n' + body + '\n' + scripts + '\n';
writeFileSync(join(root, 'dist/artifact.html'), artifact);

const standalone = '<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<title>' + TITLE + '</title>\n<meta name="description" content="' + DESC + '">\n<meta property="og:title" content="' + TITLE + '">\n<meta property="og:description" content="' + DESC + '">\n<meta name="theme-color" content="#245edb">\n<style>\n:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}\n[hidden]{display:none!important}\n' + css + '\n</style>\n</head>\n<body>\n' + body + '\n' + scripts + '\n</body>\n</html>\n';
writeFileSync(join(root, 'dist/standalone/index.html'), standalone);
const PDF = join(root, 'assets/CV_Arthur_Chauvineau.pdf');
copyFileSync(PDF, join(root, 'dist/standalone/CV_Arthur_Chauvineau.pdf'));
copyFileSync(PDF, join(root, 'dist/CV_Arthur_Chauvineau.pdf'));
console.log('artifact', (artifact.length / 1024).toFixed(0) + ' KB', '· standalone', (standalone.length / 1024).toFixed(0) + ' KB');
