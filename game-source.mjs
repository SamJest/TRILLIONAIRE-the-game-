import {readdir, readFile} from 'node:fs/promises';
import {brotliDecompressSync} from 'node:zlib';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const PARTS_DIR=path.join(__dirname,'public','game-parts');
let cached=null;

export async function loadGameHtml(){
  if(cached!==null)return cached;
  const names=(await readdir(PARTS_DIR)).filter(n=>n.endsWith('.b64')).sort();
  if(!names.length)throw new Error('No game bundle parts found');
  const encoded=(await Promise.all(names.map(n=>readFile(path.join(PARTS_DIR,n),'utf8')))).join('');
  cached=brotliDecompressSync(Buffer.from(encoded,'base64')).toString('utf8');
  if(!cached.toLowerCase().includes('<!doctype html>')||!cached.includes('TRILLIONAIRE'))throw new Error('Game bundle assembly failed');
  return cached;
}
