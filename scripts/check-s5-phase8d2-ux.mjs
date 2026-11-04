import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile),hash=b=>createHash('sha256').update(b).digest('hex');
const baseline=JSON.parse(fs.readFileSync('docs/scenario5-phase8d2-ux-baseline.json','utf8'));
const {stdout}=await exec('git',['ls-files','--cached','--others','--exclude-standard','-z'],{windowsHide:true});
const appFiles=stdout.split('\0').filter(p=>p.startsWith('src/')&&fs.existsSync(p)&&(!baseline.hashes[p]||hash(fs.readFileSync(p))!==baseline.hashes[p]));
const jobs=[['refinement-and-parity',['node_modules/tsx/dist/cli.mjs','scripts/verify-s5-phase8d2-ux.tsx']],['typecheck',['node_modules/typescript/bin/tsc','-b','--pretty','false']],['build',['node_modules/vite/bin/vite.js','build']],['eslint',['node_modules/eslint/bin/eslint.js',...appFiles.filter(p=>!p.endsWith('.css'))]]];
const checks=[];fs.mkdirSync('docs/scenario5-phase8d2-ux-checks',{recursive:true});
for(const [id,args] of jobs){let result;try{const {stdout,stderr}=await exec(process.execPath,args,{windowsHide:true,maxBuffer:16*1024*1024});result={id,status:'PASS',exitCode:0,stdout,stderr};}catch(e){result={id,status:'FAIL',exitCode:e.code,stdout:e.stdout??'',stderr:e.stderr??''};}checks.push(result);fs.writeFileSync(`docs/scenario5-phase8d2-ux-checks/${id}.txt`,result.stdout+result.stderr);console.log(`${id}: ${result.status}`);}
fs.writeFileSync('docs/scenario5-phase8d2-ux-checks.json',JSON.stringify({checks,applicationFiles:appFiles},null,2)+'\n');if(checks.some(c=>c.status!=='PASS'))process.exitCode=1;
