import {readFile,writeFile,unlink} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const dir=path.dirname(fileURLToPath(import.meta.url));
const sourcePath=path.join(dir,'comp13-competent-cohort.mjs');
const tempPath=path.join(dir,`.comp13-threshold-${process.pid}.mjs`);
let src=await readFile(sourcePath,'utf8');
const replacement=`const RULES={
  current_920_750_t16:cand(.920,.750,16),
  r900_700_t18:cand(.900,.700,18),
  r900_650_t18:cand(.900,.650,18),
  r890_700_t18:cand(.890,.700,18),
  r890_650_t18:cand(.890,.650,18),
  r880_700_t18:cand(.880,.700,18),
  r880_650_t18:cand(.880,.650,18),
  r870_650_t18:cand(.870,.650,18)
};`;
const re=/const RULES=\{[\s\S]*?\n\};/;
if(!re.test(src))throw new Error('Could not locate RULES block');
src=src.replace(re,replacement);
try{
  await writeFile(tempPath,src,'utf8');
  await import(pathToFileURL(tempPath).href+'?v='+Date.now());
}finally{
  await unlink(tempPath).catch(()=>{});
}
