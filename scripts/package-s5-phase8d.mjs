import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const manifest=JSON.parse(fs.readFileSync('docs/scenario5-phase8d-file-manifest.json','utf8'));
// An isolated index protects the user's real staging area. No working files move.
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'s5-phase8d-patch-'));
const env={...process.env,GIT_INDEX_FILE:path.join(temp,'index')};
function git(args){
  const r=spawnSync('git',args,{env,encoding:'utf8',windowsHide:true,maxBuffer:128*1024*1024});
  if(r.stderr)process.stderr.write(r.stderr);
  if(r.status!==0)throw new Error(`git ${args[0]} failed: ${r.status}`);
  return r.stdout;
}
git(['read-tree','HEAD']);
git(['add','--',...manifest.deliveryFiles]);
const patch=git(['diff','--cached','--binary','HEAD','--',...manifest.deliveryFiles]);
fs.writeFileSync('docs/scenario5-phase8d.patch',patch);
git(['apply','--check','--reverse','--whitespace=error-all','docs/scenario5-phase8d.patch']);
console.log(`Full implementation patch: ${Buffer.byteLength(patch)} bytes; reverse check PASS; real index unchanged.`);
