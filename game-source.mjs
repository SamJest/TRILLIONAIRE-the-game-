import {readdir, readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {brotliDecompressSync} from 'node:zlib';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {applyComp13Candidate} from './comp13-patch.mjs';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR=path.join(__dirname,'public');
const SINGLE_BUNDLES=[
  path.join(PUBLIC_DIR,'game.br'),
  path.join(PUBLIC_DIR,'game-parts','TRILLIONAIRE_GAME_BUNDLE_v0.095.br')
];
const PARTS_DIR=path.join(PUBLIC_DIR,'game-parts');
let cached=null;

export async function loadGameHtml(){
  if(cached!==null)return cached;
  let compressed;
  const single=SINGLE_BUNDLES.find(existsSync);
  if(single){
    compressed=await readFile(single);
  }else{
    const names=(await readdir(PARTS_DIR)).filter(n=>/^part-\d{3}\.b64$/.test(n)).sort();
    if(!names.length)throw new Error('No game bundle found');
    const encoded=(await Promise.all(names.map(n=>readFile(path.join(PARTS_DIR,n),'utf8')))).join('');
    compressed=Buffer.from(encoded,'base64');
  }
  const base=brotliDecompressSync(compressed).toString('utf8');
  if(!base.toLowerCase().includes('<!doctype html>')||!base.includes('TRILLIONAIRE'))throw new Error('Game bundle assembly failed');
  cached=applyComp13Candidate(base);
  return cached;
}
