import {readdir, readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {brotliDecompressSync} from 'node:zlib';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR=path.join(__dirname,'public');
const SINGLE_BUNDLE=path.join(PUBLIC_DIR,'game.br');
const PARTS_DIR=path.join(PUBLIC_DIR,'game-parts');
let cached=null;

export async function loadGameHtml(){
  if(cached!==null)return cached;
  let compressed;
  if(existsSync(SINGLE_BUNDLE)){
    compressed=await readFile(SINGLE_BUNDLE);
  }else{
    const names=(await readdir(PARTS_DIR)).filter(n=>n.endsWith('.b64')).sort();
    if(!names.length)throw new Error('No game bundle found');
    const encoded=(await Promise.all(names.map(n=>readFile(path.join(PARTS_DIR,n),'utf8')))).join('');
    compressed=Buffer.from(encoded,'base64');
  }
  cached=brotliDecompressSync(compressed).toString('utf8');
  if(!cached.toLowerCase().includes('<!doctype html>')||!cached.includes('TRILLIONAIRE'))throw new Error('Game bundle assembly failed');
  return cached;
}
