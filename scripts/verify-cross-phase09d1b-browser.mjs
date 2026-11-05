import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';

const output = 'docs/scenario-cross-phase09d1b-screenshots'; fs.mkdirSync(output, { recursive: true });
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cross09d1b-browser-'));
const chromePath = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
if (!chromePath) throw Error('Chromium executable not found');
const origin = 'http://127.0.0.1:5233';
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5233', '--strictPort'], { stdio: 'ignore', windowsHide: true });
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=9284', `--user-data-dir=${profileDir}`, '--disable-gpu', '--no-first-run', origin], { stdio: 'ignore', windowsHide: true });
const delay = (ms = 80) => new Promise(r => setTimeout(r, ms));
const checks = [], screenshots = [], errors = [];
let send, evaluate, socket;
const check = (v, message) => { assert.ok(v, message); checks.push({ message, status: 'PASS' }); };
async function waitFor(fn, message) { for (let i = 0; i < 240; i++) { try { const r = await fn(); if (r) return r; } catch { /* loading */ } await delay(100); } throw Error('Timeout: ' + message); }
try {
  await waitFor(async () => (await fetch(origin)).ok, 'Vite');
  const targets = await waitFor(async () => (await fetch('http://127.0.0.1:9284/json')).json(), 'CDP');
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let seq = 0; const pending = new Map();
  socket.addEventListener('message', ({ data }) => { const m = JSON.parse(data); if (m.method === 'Runtime.exceptionThrown') errors.push(m.params); if (pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); if (m.error) p.reject(Error(m.error.message)); else p.resolve(m.result); } });
  send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  evaluate = async expression => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text); return r.result.value; };
  await send('Runtime.enable'); await send('Page.enable'); await send('Page.navigate', { url: origin });
  const viewport = async (width = 1440, height = 900) => { await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }); await delay(120); };
  await viewport();
  const click = async selector => { await waitFor(() => evaluate(`(()=>{const n=document.querySelector(${JSON.stringify(selector)});if(!n||n.disabled)return false;n.click();return true})()`), selector); await delay(); };
  const clickText = async text => { await waitFor(() => evaluate(`(()=>{const n=[...document.querySelectorAll('button')].find(n=>n.textContent.trim()===${JSON.stringify(text)}&&!n.disabled);if(!n)return false;n.click();return true})()`), text); await delay(); };
  const input = async (selector, value) => { await evaluate(`(()=>{const n=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(n,${JSON.stringify(value)});n.dispatchEvent(new Event('input',{bubbles:true}))})()`); await delay(); };
  const shot = async (name, selector, width = 1440, height = 900) => {
    await viewport(width, height);
    await evaluate(selector ? `document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'start'})` : 'scrollTo(0,0)'); await delay(150);
    const layout = await evaluate(`(()=>{const nodes=[...document.querySelectorAll('.cross-dashboard,.cross-section,.cross-scenario,.cross-run-picker,.cross-axis,.cross-concept-cell')];return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,overflows:nodes.filter(n=>n.scrollWidth>n.clientWidth+2).map(n=>({class:n.className,width:n.clientWidth,scroll:n.scrollWidth})),actions:[...document.querySelectorAll('.cross-dashboard button,.cross-dashboard select')].map(n=>({label:n.getAttribute('aria-label')||n.textContent.trim(),width:n.getBoundingClientRect().width}))}})()`);
    check(layout.scrollWidth <= width + 1 && layout.overflows.length === 0, 'No horizontal overflow or chart clipping: ' + name);
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); const file = `${output}/${name}-${width}x${height}.png`;
    fs.writeFileSync(file, Buffer.from(r.data, 'base64')); screenshots.push({ file, ...layout });
  };
  const profileManager = async () => {
    if (await evaluate("!!document.querySelector('[data-cross-dashboard]')")) { await clickText('بازگشت به مدیریت پروفایل‌ها'); return; }
    if (await evaluate("!!document.querySelector('.profile-manager-card')")) return;
    if (await evaluate("!!document.querySelector('.main-menu-card')")) await clickText('ساخت / انتخاب پروفایل');
    else { await click('[aria-label="منوی سریع"]'); await clickText('مدیریت پروفایل'); }
  };
  const login = async () => {
    await profileManager(); await evaluate("[...document.querySelectorAll('.profile-item')].find(n=>n.querySelector('.profile-name').textContent==='ادمین').click()"); await delay();
    await input('#admin-password', '8888'); await clickText('ورود به ادمین');
    await waitFor(() => evaluate("!!document.querySelector('.main-menu-card')"), 'admin main menu');
  };
  const chooseOwner = async id => {
    await profileManager();
    await evaluate(`(async()=>{const p=await import('/src/services/storage/profileStorage.ts');const index=p.loadProfileState(3).profiles.findIndex(x=>x.id===${JSON.stringify(id)});if(index<0)throw Error('Missing owner');document.querySelectorAll('.profile-item')[index].click()})()`);
    await waitFor(() => evaluate("!!document.querySelector('.main-menu-card')"), 'owner selected');
  };
  const captureAccess = () => evaluate(`(()=>{const root=document.getElementById('root'),k=Object.keys(root).find(k=>k.startsWith('__reactContainer$'));let found;function walk(f){if(!f||found)return;if(f.type?.name==='App'){found=f;return}walk(f.child);walk(f.sibling)}walk(root[k]);for(let h=found?.memoizedState;h;h=h.next){const a=h.memoizedState?.current;if(a&&typeof a.sessionId==='symbol'){window.realAdminAccess=a;return true}}return false})()`);
  await waitFor(() => evaluate("!!document.querySelector('.main-menu-card')"), 'real App');
  // Only disposable local profile fixtures are provisioned. Cognitive results below are
  // generated by real App -> ScenarioRunner -> production component -> completion hooks.
  const owners = await evaluate(`(async()=>{const p=await import('/src/services/storage/profileStorage.ts'),t=await import('/src/core/types/profile.ts');const state=p.loadProfileState(3);const labels=[['کاربر','مشترک'],['کاربر','مشترک'],['کاربر','سناریو دوم'],['کاربر','بدون اجرا']];const users=labels.map(([firstName,lastName],i)=>({...t.createPlayerProfile({firstName,lastName,nationalId:String(1000000000+i),phoneNumber:'09120000000'}),progress:3}));p.saveProfileState({profiles:[...state.profiles,...users],activeProfileId:users[0].id});return users.map(p=>({id:p.id,name:p.name}))})()`);
  await send('Page.reload'); await delay(600); await login();
  check(await captureAccess(), 'Real admin session established before any archive exists');
  check(await evaluate(`(async()=>{const r=await import('/src/services/storage/cognitiveRunRepository.ts');const before=JSON.stringify(await indexedDB.databases());const empty=await r.listCognitiveRunsForAdmin(${JSON.stringify(owners[3].id)},4,realAdminAccess);return empty.length===0&&before===JSON.stringify(await indexedDB.databases())})()`), 'Empty archive read creates no IndexedDB database or schema'); await clickText('مدیریت سامانه'); await click('[role=switch]'); await clickText('بازگشت به منوی اصلی');
  async function startScenario(id) {
    await clickText('شروع');
    await evaluate(`(()=>{const title=${JSON.stringify(id === 4 ? 'حریم خاکستری مدار' : 'امواج خاموش')};const card=[...document.querySelectorAll('.scenario-card')].find(n=>n.querySelector('.scenario-title').textContent.includes(title));if(!card)throw Error('Missing scenario');card.querySelector('.scenario-actions button:last-child').click()})()`);
    await delay(); if (await evaluate("!!document.querySelector('.intro-modal .primary')")) await click('.intro-modal .primary');
  }
  async function completeS1() {
    await startScenario(4); for (let i = 0; i < 6; i++) await click('.s4-intro-shell button.primary');
    for (let step = 0; step < 100; step++) {
      if (await evaluate("document.querySelector('[data-cognitive-archive-status]')?.textContent.includes('ذخیره شد')")) break;
      const action = await evaluate(`(()=>{const b=[...document.querySelectorAll('.s4-shell button')],notice=b.find(n=>n.textContent.trim()==='متوجه شدم'&&!n.disabled);if(notice){notice.click();return true}const options=[...document.querySelectorAll('.s4-option-card > button:first-child')].filter(n=>!n.disabled);if(options.length&&!document.querySelector('.s4-option-card.selected')){options[0].click();return true}const confirm=b.find(n=>n.textContent.trim()==='ثبت تصمیم'&&!n.disabled);if(confirm){confirm.click();return true}const next=document.querySelector('.s4-move1-action-bar button:not(:disabled)')??document.querySelector('.s4-main .primary:not(:disabled)');if(next){next.click();return true}return false})()`);
      if (!action) throw Error('S1 stalled: ' + await evaluate('document.body.innerText.slice(0,1200)')); await delay(65);
    }
    check(await evaluate("document.querySelector('[data-cognitive-archive-status]')?.textContent.includes('ذخیره شد')"), 'Real App S1 canonical completion saved');
  }
  async function completeS2() {
    await startScenario(5); await click('.s5-briefing-card > .s5-primary-button');
    for (let step = 0; step < 115; step++) {
      if (await evaluate("!!document.querySelector('.s5-ending')")) break;
      const action = await evaluate(`(()=>{const phase=document.querySelector('.s5-phase-summary .s5-primary-button');if(phase){phase.click();return 'phase'}const belief=document.querySelector('.s5-belief-panel');if(belief){const radio=belief.querySelector('.s5-corridor-card input');if(radio&&!radio.checked){radio.click();return 'select'}const b=belief.querySelector('.s5-primary-button:not(:disabled)');if(b){b.click();return 'confirm'}return 'ranges'}const reason=document.querySelector('.s5-reason-options input');if(reason&&!reason.checked){reason.click();return 'reason'}const rb=document.querySelector('.s5-form-panel .s5-primary-button:not(:disabled)');if(rb){rb.click();return 'reason confirm'}const outcome=document.querySelector('.s5-outcome-panel .s5-primary-button');if(outcome){outcome.click();return 'outcome'}const confirm=document.querySelector('.s5-decision-actions .s5-primary-button:not(:disabled)');if(confirm){confirm.click();return 'decision'}const actions=[...document.querySelectorAll('.s5-action-card')].filter(n=>!n.disabled);if(actions.length){const selected=document.querySelector('.s5-action-card[aria-pressed=true]');const target=document.querySelector('.s5-map-target:not(:disabled)');if(selected&&target&&document.querySelector('.s5-target-picker select')?.value===''){target.dispatchEvent(new MouseEvent('click',{bubbles:true}));return 'target'}actions[0].click();return 'select action'}return null})()`);
      if (action === 'ranges') for (let i = 0; i < 3; i++) {
        await evaluate(`document.querySelectorAll('.s5-belief-range')[${i}].focus()`);
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
      }
      if (!action) throw Error('S2 stalled: ' + await evaluate('document.body.innerText.slice(0,1200)')); await delay(65);
    }
    await waitFor(() => evaluate("document.querySelector('[data-cognitive-archive-status]')?.textContent.includes('ذخیره شد')"), 'S2 saved'); check(true, 'Real App S2 canonical completion saved');
  }
  for (const [owner, scenarios] of [[owners[0], [4, 5, 4, 5]], [owners[1], [4]], [owners[2], [5]]]) {
    for (const id of scenarios) { await chooseOwner(owner.id); if (id === 4) await completeS1(); else await completeS2(); }
  }
  await login(); await clickText('مدیریت سامانه'); await click('[role=switch]'); await clickText('بازگشت به منوی اصلی'); await profileManager();
  check(await evaluate(`document.querySelectorAll('[data-cognitive-dashboard-profile]').length`) === owners.length + 3, 'One admin action per existing profile, including built-ins');
  await shot('01-admin-profile-list', '.profile-list');
  // Read the real App's existing session handle, without changing any React state.

  check(await captureAccess(), 'Repository tests use the actual password-established App session');
  await evaluate(`(async()=>{window.repo=await import('/src/services/storage/cognitiveRunRepository.ts');window.accessModule=await import('/src/services/storage/cognitiveAdminReadAccess.ts');window.owners=${JSON.stringify(owners)};window.records={};for(const p of owners)records[p.id]=[...await repo.listCognitiveRunsForAdmin(p.id,4,realAdminAccess),...await repo.listCognitiveRunsForAdmin(p.id,5,realAdminAccess)];})()`);
  const records = JSON.parse(await evaluate('JSON.stringify(records)'));
  fs.writeFileSync('docs/scenario-cross-phase09d1b-real-completions.json', JSON.stringify({ testOnly: true, source: 'Six real completions through real App navigation in a disposable Chromium profile; no cognitive payload injection', owners, records }, null, 2));
  check(records[owners[0].id].length === 4 && records[owners[1].id].length === 1 && records[owners[2].id].length === 1 && records[owners[3].id].length === 0, 'Both / S1 only / S2 only / neither genuine archive coverage');
  check(records[owners[0].id].filter(r => r.releasedScenarioId === 4).map(r => r.sourceRunId).every((id, _, a) => id === a[0]), 'Repeated S1 scientific ID remains visible as separate UUID records');
  const snapshot = () => evaluate(`(async()=>JSON.stringify({local:Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])),records:await Promise.all(owners.map(async p=>[...await repo.listCognitiveRunsForAdmin(p.id,4,realAdminAccess),...await repo.listCognitiveRunsForAdmin(p.id,5,realAdminAccess)]))}))()`);
  const beforeRead = await snapshot();
  await evaluate(`(()=>{window.writes=[];window.restoreInstrumentation=[];for(const [proto,key]of [[Storage.prototype,'setItem'],[Storage.prototype,'removeItem'],[Storage.prototype,'clear'],[IDBObjectStore.prototype,'add'],[IDBObjectStore.prototype,'put'],[IDBObjectStore.prototype,'delete'],[IDBObjectStore.prototype,'clear']]){const old=proto[key];restoreInstrumentation.push(()=>proto[key]=old);proto[key]=function(...args){writes.push(key);return old.apply(this,args)}}})()`);
  async function openDashboard(id, ready = true) {
    await profileManager(); await click(`[data-cognitive-dashboard-profile="${id}"]`);
    if (ready) await waitFor(() => evaluate("!!document.querySelector('[data-cross-dashboard]')&&!document.body.innerText.includes('در حال خواندن آرشیو…')"), 'dashboard settled');
  }
  await openDashboard(owners[0].id);
  check(await evaluate('document.activeElement.tagName==="H1"'), 'Dashboard heading receives keyboard/screen-reader focus');
  check(await evaluate("document.querySelectorAll('[data-cross-concept]').length===9"), 'Exactly nine conceptual rows');
  check(await evaluate("document.body.innerText.includes('ذخیره گزارش جدید غیرفعال است؛ گزارش‌های قبلی قابل مشاهده‌اند')"), 'Archive OFF retains readable results');
  check(await evaluate("document.querySelector('[data-cross-unmeasured]').textContent.includes('در سناریو ۲ سنجیده نمی‌شود')&&!document.querySelector('[data-cross-unmeasured]').querySelector('[role=meter]')"), 'S2 information discipline is explicitly unmeasured');
  check(await evaluate("!document.querySelector('#cross-run-4 option').value.includes('run-')&&document.querySelectorAll('#cross-run-4 option').length===2"), 'Distinct attempt UUID selectors, even shared S1 scientific run ID');
  const defaults = await evaluate("({s1:document.querySelector('#cross-run-4').value,s2:document.querySelector('#cross-run-5').value})");
  check(defaults.s1 === records[owners[0].id].filter(r => r.releasedScenarioId === 4)[0].recordId && defaults.s2 === records[owners[0].id].filter(r => r.releasedScenarioId === 5)[0].recordId, 'Newest independent runs selected by default');
  await shot('02-both-scenarios', null); await shot('03-shared-concepts', '#cross-concepts'); await shot('04-risk', '#cross-risk'); await shot('05-unique', '#cross-unique'); await shot('06-quality', '#cross-quality');
  for (const [width, height] of [[1280, 720], [1366, 768], [390, 844]]) { await shot('07-responsive-top', null, width, height); await shot('08-responsive-concepts', '#cross-concepts', width, height); await shot('09-responsive-risk', '#cross-risk', width, height); }
  await viewport();
  await evaluate("(()=>{const s=document.querySelector('#cross-run-4');s.value=s.options[1].value;s.dispatchEvent(new Event('change',{bubbles:true}))})()"); await delay();
  check(await evaluate(`document.querySelector('#cross-run-5').value===${JSON.stringify(defaults.s2)}`), 'S1 selection does not change S2 selection');
  const olderS1 = await evaluate("document.querySelector('#cross-run-4').value");
  await evaluate("(()=>{const s=document.querySelector('#cross-run-5');s.value=s.options[1].value;s.dispatchEvent(new Event('change',{bubbles:true}))})()"); await delay();
  check(await evaluate(`document.querySelector('#cross-run-4').value===${JSON.stringify(olderS1)}`), 'S2 selection does not change S1 selection');
  check(await evaluate(`(()=>{const selected=[document.querySelector('#cross-run-4').value,document.querySelector('#cross-run-5').value],runs=records[owners[0].id].filter(r=>selected.includes(r.recordId));return [...document.querySelectorAll('[data-cross-field]')].every(n=>{const [id,...parts]=n.dataset.crossField.split('.');const run=runs.find(r=>r.releasedScenarioId===Number(id));const keys=parts.join('.').replaceAll('[','.').replaceAll(']','').split('.');let v=run.cognitive;for(const key of keys)v=v[key];return n.dataset.sourceValue===(v===null?'null':String(v))})})()`), 'Every rendered numeric source equals the selected stored payload exactly');
  await evaluate("document.querySelector('#cross-run-4').focus()"); await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  check(await evaluate("document.querySelector('[data-cross-dashboard]').contains(document.activeElement)"), 'Keyboard controls remain reachable');
  check(await evaluate("[...document.querySelectorAll('.cross-dashboard select')].every(n=>!!document.querySelector('label[for='+n.id+']'))&&[...document.querySelectorAll('.cross-axis[role=img],[role=meter]')].every(n=>!!n.getAttribute('aria-label'))"), 'Pickers, spectra and meters have screen-reader labels');
  await profileManager();
  check(await evaluate(`document.activeElement.dataset.cognitiveDashboardProfile===${JSON.stringify(owners[0].id)}`), 'Back restores focus to the same profile action');
  await openDashboard(owners[1].id); check(await evaluate("!!document.querySelector('#cross-run-4')&&!document.querySelector('#cross-run-5')"), 'Same display name, different owner ID, S1-only isolation'); await shot('10-s1-only', null);
  await openDashboard(owners[2].id); check(await evaluate("!document.querySelector('#cross-run-4')&&!!document.querySelector('#cross-run-5')"), 'S2-only empty counterpart'); await shot('11-s2-only', null);
  await openDashboard(owners[3].id); check(await evaluate("!document.querySelector('#cross-run-4')&&!document.querySelector('#cross-run-5')"), 'Both absent, no legacy log/snapshot fallback'); await shot('12-neither', null);
  await profileManager();
  check(await evaluate('writes.length===0'), 'Dashboard open, select, navigate, refresh-list and close perform zero storage writes');
  await evaluate('restoreInstrumentation.forEach(fn=>fn())');
  const afterRead = await snapshot(); check(JSON.stringify(beforeRead) === JSON.stringify(afterRead), 'All browser storage, logs, selected admin profile and scientific records unchanged by dashboard interactions');
  // Real App session + scoped repository denial, corruption and request-race checks.
  const repositoryChecks = await evaluate(`(async()=>{const results=[];const reject=async(name,fn)=>{try{await fn();results.push({name,pass:false})}catch(e){results.push({name,pass:true,code:e.code??e.name})}};
    const A=owners[0].id,B=owners[1].id,record=records[A][0];
    await reject('Nonadmin-shaped access cannot list another owner',()=>repo.listCognitiveRunsForAdmin(A,4,{id:'admin',role:'admin'}));
    await reject('Missing session cannot read',()=>repo.readCognitiveRunForAdmin(record.recordId,A,null));
    await reject('Record read requires exact target owner',()=>repo.readCognitiveRunForAdmin(record.recordId,B,realAdminAccess));
    await reject('Deleted or unknown owner is explicit',()=>repo.listCognitiveRunsForAdmin('player-deleted-owner',4,realAdminAccess));
    results.push({name:'Scoped read returns exact canonical owner record',pass:JSON.stringify(await repo.readCognitiveRunForAdmin(record.recordId,A,realAdminAccess))===JSON.stringify(record)});
    const original=indexedDB;Object.defineProperty(window,'indexedDB',{value:undefined,configurable:true});await reject('Unavailable IDB',()=>repo.listCognitiveRunsForAdmin(A,4,realAdminAccess));Object.defineProperty(window,'indexedDB',{value:original,configurable:true});
    const getAll=IDBIndex.prototype.getAll;IDBIndex.prototype.getAll=function(){throw new DOMException('isolated read restriction','QuotaExceededError')};await reject('Quota/read restriction explicit',()=>repo.listCognitiveRunsForAdmin(A,4,realAdminAccess));IDBIndex.prototype.getAll=getAll;
    const db=await new Promise((resolve,reject)=>{const q=indexedDB.open(repo.COGNITIVE_ARCHIVE_DB,1);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
    const put=x=>new Promise((resolve,reject)=>{const tx=db.transaction(repo.COGNITIVE_ARCHIVE_STORE,'readwrite');tx.objectStore(repo.COGNITIVE_ARCHIVE_STORE).put(x);tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)});
    window.corruptionFixture={db,put,record};const bad=structuredClone(record);delete bad.cognitive.orientation.overall;await put(bad);
    await reject('Malformed required value rejects scoped list',()=>repo.listCognitiveRunsForAdmin(A,4,realAdminAccess));await reject('Malformed required value rejects scoped read',()=>repo.readCognitiveRunForAdmin(record.recordId,A,realAdminAccess));
    return results;})()`);
  for (const r of repositoryChecks) check(r.pass, r.name);
  await openDashboard(owners[0].id); check(await evaluate("!!document.querySelector('[data-cross-error]')&&!document.querySelector('#cross-run-4')"), 'Corrupt archive is a data error, never a silent empty result'); await shot('13-invalid-data-error', null);
  await evaluate('corruptionFixture.put(corruptionFixture.record).then(()=>corruptionFixture.db.close())');
  await profileManager(); await evaluate('window.savedIDB=indexedDB;void Object.defineProperty(window,"indexedDB",{value:undefined,configurable:true})'); await openDashboard(owners[0].id); check(await evaluate("!!document.querySelector('[data-cross-error=Unavailable]')"), 'Unavailable IDB is distinct from valid empty archive'); await shot('14-unavailable-error', null); await evaluate('void Object.defineProperty(window,"indexedDB",{value:savedIDB,configurable:true})');
  await profileManager();
  // Stable timestamp tie-break on real records, in isolated test DB only; restore both bytes.
  const tieCheck = await evaluate(`(async()=>{const originals=records[owners[0].id].filter(r=>r.releasedScenarioId===4);const db=await new Promise(r=>{const q=indexedDB.open(repo.COGNITIVE_ARCHIVE_DB,1);q.onsuccess=()=>r(q.result)});const put=x=>new Promise(r=>{const tx=db.transaction(repo.COGNITIVE_ARCHIVE_STORE,'readwrite');tx.objectStore(repo.COGNITIVE_ARCHIVE_STORE).put(x);tx.oncomplete=r});for(const r of originals)await put({...r,recordedAtIso:originals[0].recordedAtIso});const sorted=await repo.listCognitiveRunsForAdmin(owners[0].id,4,realAdminAccess);for(const r of originals)await put(r);db.close();return sorted.map(r=>r.recordId).join('|')===originals.map(r=>r.recordId).sort().reverse().join('|')})()`); check(tieCheck, 'Stable timestamp / UUID descending tie-break');
  const installBarrier = () => evaluate(`(()=>{window.releaseReads=[];window.originalDatabases=indexedDB.databases.bind(indexedDB);indexedDB.databases=()=>new Promise(resolve=>releaseReads.push(()=>originalDatabases().then(resolve)))})()`);
  const releaseBarrier = () => evaluate('(()=>{indexedDB.databases=originalDatabases;releaseReads.splice(0).forEach(fn=>fn())})()');
  await installBarrier(); await openDashboard(owners[0].id, false); await profileManager(); await openDashboard(owners[1].id, false); await releaseBarrier(); await delay(250);
  check(await evaluate(`document.querySelector('[data-cross-dashboard]').dataset.crossOwner===${JSON.stringify(owners[1].id)}&&!document.querySelector('#cross-run-5')`), 'Target change during pending fetch never renders stale prior-owner data');
  await profileManager(); await installBarrier();
  await evaluate(`void (window.pendingAdminRead=repo.listCognitiveRunsForAdmin(${JSON.stringify(owners[0].id)},4,realAdminAccess).then(()=>false,()=>true))`);
  await openDashboard(owners[0].id, false); await profileManager(); await chooseOwner(owners[2].id); await releaseBarrier(); await delay(150);
  check(await evaluate('pendingAdminRead'), 'Profile switch revokes an already pending admin repository read');
  check(await evaluate("!document.querySelector('[data-cross-dashboard]')&&!document.querySelector('[data-cross-field]')"), 'No stale dashboard data after actual profile switch');
  await profileManager(); check(await evaluate("document.querySelectorAll('[data-cognitive-dashboard-profile]').length===0"), 'Normal mode has no dashboard links'); await shot('15-normal-mode-denied-links', '.profile-list');
  check(await evaluate(`repo.listCognitiveRunsForAdmin(${JSON.stringify(owners[0].id)},4,realAdminAccess).then(()=>false,()=>true)`), 'Revoked real session cannot be reused by a normal user');
  await send('Page.navigate', { url: origin + '/?cognitiveDashboard=' + encodeURIComponent(owners[0].id) }); await delay(500); check(await evaluate("!document.querySelector('[data-cross-dashboard]')&&!document.querySelector('[data-cross-field]')"), 'Direct navigation/refresh does not restore admin dashboard');
  await login(); await profileManager(); await captureAccess(); await openDashboard(owners[0].id); check(await evaluate("document.querySelectorAll('#cross-run-4 option').length===2&&document.querySelectorAll('#cross-run-5 option').length===2"), 'After refresh and real admin re-login, saved results remain readable'); await shot('16-refresh-persistence', null);
  const finalRecords = JSON.parse(await evaluate(`(async()=>{const r=await import('/src/services/storage/cognitiveRunRepository.ts');const result={};for(const p of ${JSON.stringify(owners)})result[p.id]=[...await r.listCognitiveRunsForAdmin(p.id,4,realAdminAccess),...await r.listCognitiveRunsForAdmin(p.id,5,realAdminAccess)];return JSON.stringify(result)})()`));
  check(JSON.stringify(finalRecords) === JSON.stringify(records), 'All six canonical completed records unchanged after error, race and refresh tests');
  await profileManager();
  const storedProfiles = await evaluate('localStorage.getItem("space-war.profiles.v1")');
  await evaluate(`(()=>{const p=JSON.parse(localStorage.getItem('space-war.profiles.v1'));p.profiles=p.profiles.filter(x=>x.id!==${JSON.stringify(owners[3].id)});localStorage.setItem('space-war.profiles.v1',JSON.stringify(p))})()`);
  await openDashboard(owners[3].id);
  check(await evaluate("!!document.querySelector('[data-cross-error=OwnerMissing]')&&!document.querySelector('[data-cross-field]')"), 'Deleted existing owner produces explicit status and no report data');
  await shot('17-deleted-owner-error', null);
  await evaluate(`localStorage.setItem('space-war.profiles.v1',${JSON.stringify(storedProfiles)})`);
  await send('Page.navigate', { url: origin + '/scripts/scenario-cross-phase09d1b-presentation.html' }); await delay(600); await viewport(390, 844);
  check(await evaluate(`(()=>{const cases=[...document.querySelectorAll('[data-scalar-case]')];return cases.length===4&&cases.every(n=>{const value=n.dataset.scalarCase,markers=[...n.querySelectorAll('[data-cross-marker]')];if(value==='null')return markers.length===0&&n.innerText.includes('داده کافی برای محاسبه وجود ندارد');return markers.length===2&&markers.every(m=>{const track=m.parentElement.getBoundingClientRect(),r=m.getBoundingClientRect();return m.style.left===String((Number(value)+1)*50)+'%'&&r.left>=track.left-9&&r.right<=track.right+9})})})()`), 'Negative / zero / positive signed endpoints, null and contained marker geometry in real mobile browser');
  check(await evaluate("document.querySelector('[data-zero-case]').innerText.includes('0.00')&&document.querySelector('[data-zero-case] [role=meter]').getAttribute('aria-valuenow')==='0'&&!document.querySelector('[data-null-case] [role=meter]')&&document.querySelector('[data-missing-case]').innerText.includes('خطای داده')"), 'Zero / null / omitted presentation invariants in browser');
  check(await evaluate("!!document.querySelector('[data-denied-props] [data-cross-error=PermissionDenied]')&&!document.querySelector('[data-denied-props] [data-cross-field]')"), 'Direct component props without real session fail closed in browser');
  const digest = createHash('sha256').update(JSON.stringify(records)).digest('hex');
  const result = { status: 'PASS', assertions: checks.length, checks, screenshots, genuineCompletions: { s1: 3, s2: 3 }, source: 'REAL App navigation and normal admin password flow, disposable Chromium only', realUserStorageAccessed: false, profileDir, originalRecordsDigest: digest, errors };
  fs.writeFileSync(`${output}/inspection.json`, JSON.stringify(result, null, 2)); console.log(JSON.stringify({ status: 'PASS', assertions: checks.length, screenshots: screenshots.length }));
} catch (error) {
  let page;
  if (evaluate) { try { page = await evaluate('({url:location.href,text:document.body.innerText.slice(0,2500)})'); const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${output}/failure.png`, Buffer.from(r.data, 'base64')); } catch { /* disconnected */ } }
  fs.writeFileSync(`${output}/inspection.json`, JSON.stringify({ status: 'FAIL', error: String(error), stack: error.stack, checks, errors, page, screenshots }, null, 2)); throw error;
} finally { socket?.close(); chrome.kill(); vite.kill(); }
