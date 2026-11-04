import fs from 'node:fs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile);
const jobs=[['verifier-and-08d-regressions',['node_modules/tsx/dist/cli.mjs','scripts/verify-s5-phase09c1.tsx']],['typecheck',['node_modules/typescript/bin/tsc','-b','--pretty','false']],['build',['node_modules/vite/bin/vite.js','build']],['eslint',['node_modules/eslint/bin/eslint.js','src/ui/components/scenario/ScenarioFiveSummary.tsx','src/ui/components/scenario/scenario-five/ui/ScenarioFiveCognitiveDashboard.tsx','src/ui/components/scenario/scenario-five/ui/cognitiveDashboardPresentation.ts']]];
const checks=[];fs.mkdirSync('docs/scenario5-phase09c1-checks',{recursive:true});
for(const[id,args]of jobs){let r;try{const{stdout,stderr}=await exec(process.execPath,args,{windowsHide:true,maxBuffer:16*1024*1024});r={id,status:'PASS',exitCode:0,stdout,stderr};}catch(e){r={id,status:'FAIL',exitCode:e.code,stdout:e.stdout??'',stderr:e.stderr??''};}checks.push(r);fs.writeFileSync(`docs/scenario5-phase09c1-checks/${id}.txt`,r.stdout+r.stderr);console.log(`${id}: ${r.status}`);}
fs.writeFileSync('docs/scenario5-phase09c1-checks.json',JSON.stringify(checks,null,2)+'\n');if(checks.some(c=>c.status!=='PASS'))process.exitCode=1;
