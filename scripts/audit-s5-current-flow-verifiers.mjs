import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const run=promisify(execFile);
const commands=[3,4,5,6,7].map(n=>({id:`phase${n}`,args:['node_modules/tsx/dist/cli.mjs',`scripts/verify-s5-phase${n}-${({3:'model',4:'mission',5:'cognitive',6:'runtime',7:'ui'})[n]}.ts`]}));
commands.push({id:'phase8b',args:['node_modules/tsx/dist/cli.mjs','scripts/verify-s5-phase8b-calibration.ts']});
const output=await Promise.all(commands.map(async({id,args})=>{
  try {const r=await run(process.execPath,args,{maxBuffer:8*1024*1024,windowsHide:true});return {id,status:'PASS',exitCode:0,stdout:r.stdout,stderr:r.stderr};}
  catch(e){return {id,status:'FAIL',exitCode:e.code,stdout:e.stdout,stderr:e.stderr};}
}));
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'s5-current-audit-lf-'));
const sourceRoot='src/ui/components/scenario/scenario-five/model';
const walk=(directory)=>fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(`${directory}/${entry.name}`):[`${directory}/${entry.name}`]);
for(const filename of [...walk(sourceRoot),'scripts/verify-s5-phase6-runtime.ts','package.json']){
  const target=path.join(temporary,filename);fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,filename.startsWith(sourceRoot)?fs.readFileSync(filename,'utf8').replace(/\r\n/g,'\n'):fs.readFileSync(filename));
}
try{
  const r=await run(process.execPath,[path.resolve('node_modules/tsx/dist/cli.mjs'),'scripts/verify-s5-phase6-runtime.ts'],{cwd:temporary,windowsHide:true});
  output.push({id:'phase6_isolated_LF',status:'PASS',exitCode:0,stdout:r.stdout,stderr:r.stderr,notes:'Unchanged verifier bytes; normalized temporary model checkout only. Original sources untouched.'});
}catch(e){output.push({id:'phase6_isolated_LF',status:'FAIL',exitCode:e.code,stdout:e.stdout,stderr:e.stderr});}
fs.writeFileSync('docs/scenario5-current-verifier-status.json',JSON.stringify(output,null,2));
for(const r of output)console.log(r.id,r.status,r.stdout?.trim() || r.stderr?.split('\n').find(line=>line.includes('Error')||line.includes('error:')));
