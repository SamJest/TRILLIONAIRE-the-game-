import {createHash} from 'node:crypto';
import {existsSync} from 'node:fs';
import {readdir,readFile} from 'node:fs/promises';
import {brotliDecompressSync} from 'node:zlib';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const publicDir=path.join(root,'public');
const single=path.join(publicDir,'game.br');
const partsDir=path.join(publicDir,'game-parts');
const EXPECTED_COMPRESSED_SHA256='a6510032d19e94ff57e18fcbed3037896d61b4decad44f1dd13b0f4a9176b164';
const EXPECTED_PARTS=54;

let compressed;
if(existsSync(single)){
  compressed=await readFile(single);
  console.log('preflight: using public/game.br');
}else{
  const names=(await readdir(partsDir)).filter(n=>/^part-\d{3}\.b64$/.test(n)).sort();
  if(names.length!==EXPECTED_PARTS){
    throw new Error(`Game bundle incomplete: expected ${EXPECTED_PARTS} parts, found ${names.length}`);
  }
  const encoded=(await Promise.all(names.map(n=>readFile(path.join(partsDir,n),'utf8')))).join('');
  compressed=Buffer.from(encoded,'base64');
  console.log(`preflight: assembled ${names.length} bundle parts`);
}

const hash=createHash('sha256').update(compressed).digest('hex');
if(hash!==EXPECTED_COMPRESSED_SHA256){
  throw new Error(`Game bundle SHA256 mismatch: ${hash}`);
}
const html=brotliDecompressSync(compressed).toString('utf8');
if(!html.toLowerCase().includes('<!doctype html>'))throw new Error('Game bundle missing doctype');
if(!html.includes('TRILLIONAIRE'))throw new Error('Game bundle missing TRILLIONAIRE marker');
if(!html.includes('COMP-1.2'))throw new Error('Game bundle missing COMP-1.2 marker');
console.log(`preflight: OK (${html.length.toLocaleString()} bytes HTML, ${hash.slice(0,12)}…)`);
