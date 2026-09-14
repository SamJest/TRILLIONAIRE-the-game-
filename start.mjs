import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const launchUiPath=fileURLToPath(new URL('./launch-ui.mjs',import.meta.url));
let src=await readFile(launchUiPath,'utf8');

const launchMeta=`
<meta name="description" content="Run a trillion-dollar Mars programme. Build fast, manage consequences, and race the verified leaderboard.">
<meta name="theme-color" content="#07111b">
<meta property="og:type" content="website">
<meta property="og:site_name" content="TRILLIONAIRE">
<meta property="og:title" content="TRILLIONAIRE — Mars Race">
<meta property="og:description" content="You have $1 trillion. Get Mars off Earth. Build, borrow, recover and compete on server-verified leaderboards.">
<meta property="og:url" content="https://trillionairethegame.com/">
<meta property="og:image" content="https://raw.githubusercontent.com/SamJest/TRILLIONAIRE-the-game-/main/public/assets/trillionaire-social-card.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="TRILLIONAIRE Mars Race — You have $1 trillion. Get Mars off Earth.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="TRILLIONAIRE — Mars Race">
<meta name="twitter:description" content="You have $1 trillion. Get Mars off Earth. Build, borrow, recover and compete.">
<meta name="twitter:image" content="https://raw.githubusercontent.com/SamJest/TRILLIONAIRE-the-game-/main/public/assets/trillionaire-social-card.png">
<link rel="icon" type="image/png" sizes="64x64" href="https://raw.githubusercontent.com/SamJest/TRILLIONAIRE-the-game-/main/public/assets/favicon.png">
<link rel="apple-touch-icon" sizes="180x180" href="https://raw.githubusercontent.com/SamJest/TRILLIONAIRE-the-game-/main/public/assets/apple-touch-icon.png">
<link rel="canonical" href="https://trillionairethegame.com/">
`;

const patched=src.replace(/const LAUNCH_META=`[\s\S]*?`;\n/,`const LAUNCH_META=\`${launchMeta}\`;\n`);
if(patched===src)throw new Error('launch metadata patch target not found');
await writeFile(launchUiPath,patched,'utf8');
await import('./server.mjs');
