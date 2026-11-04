import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import fs from 'node:fs';
const exec=promisify(execFile);
const jobs=['3-model','4-mission','5-cognitive','6-runtime','7-ui','8-calibration','8a-audit','8b-calibration','8c-ui'].map(id=>({id,args:['node_modules/tsx/dist/cli.mjs',`scripts/verify-s5-phase${id}.ts`]}));
jobs.push({id:'8d-integrated-gameplay',args:['node_modules/tsx/dist/cli.mjs','scripts/verify-s5-phase8d-integrated-gameplay.ts']});
jobs.push({id:'metric-inventory',args:['node_modules/tsx/dist/cli.mjs','scripts/verify-s5-metric-inventory.ts']});
jobs.push({id:'typecheck',args:['node_modules/typescript/bin/tsc','-b','--pretty','false']});
jobs.push({id:'build',args:['node_modules/vite/bin/vite.js','build']});
const out=[];
// Sequential to keep compiler/cache/output mutations independent.
for(const job of jobs){
  let r;
  try{const {stdout,stderr}=await exec(process.execPath,job.args,{maxBuffer:16*1024*1024,windowsHide:true});r={id:job.id,status:'PASS',exitCode:0,stdout,stderr};}
  catch(e){r={id:job.id,status:'FAIL',exitCode:e.code,stdout:e.stdout??'',stderr:e.stderr??''};}
  fs.writeFileSync(`docs/scenario5-phase8d-checks/after-${job.id}.txt`,r.stdout+r.stderr);
  const p=`docs/scenario5-phase8d-checks/before-${job.id}.txt`;
  if(fs.existsSync(p)){
    const b=fs.readFileSync(p);r.beforeOutput=b.toString(b[0]===255&&b[1]===254?'utf16le':'utf8');
  }
  out.push(r);console.log(`${r.id}: ${r.status} ${r.stdout.trim().split('\n').at(-1)??''}`);
}
fs.writeFileSync('docs/scenario5-phase8d-check-results.json',JSON.stringify(out,null,2));
