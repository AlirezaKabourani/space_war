import fs from 'node:fs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile);
const applicationFiles=['src/ui/components/scenario/ScenarioFiveSimulation.tsx','src/ui/components/scenario/scenario-five/ui/ScenarioFiveProgress.tsx','src/ui/components/scenario/ScenarioFive.css','src/ui/components/scenario/scenario-five/ui/phaseHeader.ts'];
const jobs=[['phase08d2',['node_modules/tsx/dist/cli.mjs','scripts/verify-s5-phase8d2-header.tsx']],['typecheck',['node_modules/typescript/bin/tsc','-b','--pretty','false']],['build',['node_modules/vite/bin/vite.js','build']],['eslint',['node_modules/eslint/bin/eslint.js',...applicationFiles.filter(p=>!p.endsWith('.css'))]]];
const checks=[];fs.mkdirSync('docs/scenario5-phase8d2-checks',{recursive:true});
for(const [id,args] of jobs){let r;try{const {stdout,stderr}=await exec(process.execPath,args,{windowsHide:true,maxBuffer:16*1024*1024});r={id,status:'PASS',exitCode:0,stdout,stderr};}catch(e){r={id,status:'FAIL',exitCode:e.code,stdout:e.stdout??'',stderr:e.stderr??''};}checks.push(r);fs.writeFileSync(`docs/scenario5-phase8d2-checks/${id}.txt`,r.stdout+r.stderr);console.log(`${id}: ${r.status}`);if(r.stderr)process.stderr.write(r.stderr);}
fs.writeFileSync('docs/scenario5-phase8d2-checks.json',JSON.stringify(checks,null,2));if(checks.some(r=>r.status!=='PASS'))process.exitCode=1;
