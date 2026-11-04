import fs from 'node:fs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile);
const applications=['src/App.tsx','src/ui/components/scenario/ScenarioFiveMap.tsx','src/ui/components/scenario/ScenarioFiveSimulation.tsx','src/ui/components/scenario/scenario-five/ui/ScenarioFiveProgress.tsx','src/ui/components/scenario/scenario-five/ui/gameplayPresentation.ts','src/ui/components/scenario/scenario-five/ui/presentation.ts'];
const jobs=[
  ['phase08d1',['node_modules/tsx/dist/cli.mjs','scripts/verify-s5-phase8d1-corrections.tsx']],
  ['typecheck',['node_modules/typescript/bin/tsc','-b','--pretty','false']],
  ['build',['node_modules/vite/bin/vite.js','build']],
  ['eslint',['node_modules/eslint/bin/eslint.js',...applications]],
];
const checks=[];
fs.mkdirSync('docs/scenario5-phase8d1-checks',{recursive:true});
for(const [id,args] of jobs){
  let result;
  try{const {stdout,stderr}=await exec(process.execPath,args,{windowsHide:true,maxBuffer:16*1024*1024});result={id,status:'PASS',exitCode:0,stdout,stderr};}
  catch(e){result={id,status:'FAIL',exitCode:e.code,stdout:e.stdout??'',stderr:e.stderr??''};}
  checks.push(result);fs.writeFileSync(`docs/scenario5-phase8d1-checks/${id}.txt`,result.stdout+result.stderr);
  console.log(`${id}: ${result.status}`);if(result.stderr)process.stderr.write(result.stderr);
}
fs.writeFileSync('docs/scenario5-phase8d1-checks.json',JSON.stringify(checks,null,2));
if(checks.some(c=>c.status!=='PASS'))process.exitCode=1;
