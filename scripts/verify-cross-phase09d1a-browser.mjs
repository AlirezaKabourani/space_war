import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

// All data and clicks are confined to a disposable browser profile on a dedicated origin.
const out = 'docs/scenario-cross-phase09d1a-screenshots';
fs.mkdirSync(out, { recursive: true });
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cross09d1a-browser-'));
const chromePath = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const origin = 'http://127.0.0.1:5231';
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5231', '--strictPort'], { stdio: 'ignore', windowsHide: true });
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=9282', `--user-data-dir=${profileDir}`, '--disable-gpu', '--no-first-run', origin], { stdio: 'ignore', windowsHide: true });
const delay = (ms = 60) => new Promise(r => setTimeout(r, ms));
const results = [];
let socket, evaluate, send;
const browserErrors = [];
async function waitFor(check, label) {
  for (let i = 0; i < 160; i++) { try { const value = await check(); if (value) return value; } catch { /* boot/navigation */ } await delay(100); }
  throw new Error('Timed out: ' + label);
}
function check(value, label) { assert.ok(value, label); results.push({ label, status: 'PASS' }); }
try {
  await waitFor(async () => (await fetch(origin)).ok, 'Vite');
  const targets = await waitFor(async () => (await fetch('http://127.0.0.1:9282/json')).json(), 'CDP');
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let seq = 0; const pending = new Map();
  socket.addEventListener('message', ({ data }) => { const m = JSON.parse(data); if (m.method === 'Runtime.exceptionThrown' || m.method === 'Log.entryAdded') browserErrors.push(m.params); if (pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); if (m.error) p.reject(Error(m.error.message)); else p.resolve(m.result); } });
  send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  evaluate = async expression => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text); return r.result.value; };
  await send('Runtime.enable'); await send('Page.enable'); await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  const screenshot = async name => { const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); fs.writeFileSync(`${out}/${name}.png`, Buffer.from(r.data, 'base64')); };
  const click = async selector => { await waitFor(() => evaluate(`(()=>{const n=document.querySelector(${JSON.stringify(selector)});if(!n||n.disabled)return false;n.click();return true})()`), selector); await delay(); };
  const clickText = async text => { await waitFor(() => evaluate(`(()=>{const n=[...document.querySelectorAll('button')].find(n=>n.textContent.trim()===${JSON.stringify(text)}&&!n.disabled);if(!n)return false;n.click();return true})()`), text); await delay(); };
  const navigate = async url => { await send('Page.navigate', { url }); await delay(500); };
  await navigate(origin);
  // First verify the real App admin gate and settings with normal login.
  await waitFor(() => evaluate("!!document.querySelector('.main-menu-card')"), 'app ready');
  check(!await evaluate("!!document.querySelector('[role=switch]')"), 'Player has no admin archive setting');
  await clickText('ساخت / انتخاب پروفایل');
  await evaluate("[...document.querySelectorAll('.profile-item')].find(n=>n.querySelector('.profile-name').textContent==='ادمین').click()"); await delay();
  await evaluate("(()=>{const n=document.querySelector('#admin-password');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(n,'8888');n.dispatchEvent(new Event('input',{bubbles:true}))})()"); await delay();
  await clickText('ورود به ادمین'); await clickText('مدیریت سامانه');
  check(await evaluate("document.querySelector('[role=switch]').getAttribute('aria-checked')==='false'"), 'Archive defaults OFF without writing configuration');
  check(await evaluate("localStorage.getItem('space-war-cognitive-archive.policy.v1')===null"), 'No implicit archive activation');
  await clickText('توقف لاگ‌برداری رفتاری'); await click('[role=switch]');
  await screenshot('01-real-app-admin-two-controls');
  await navigate(origin + '/scripts/scenario-cross-phase09d1a-witness.html');
  await waitFor(() => evaluate("!!document.querySelector('[data-host=s1]')"), 'test host');
  await evaluate(`(async()=>{window.repo=await import('/src/services/storage/cognitiveRunRepository.ts');window.attempts=await import('/src/services/storage/completedCognitiveAttempt.ts');window.validation=await import('/src/services/storage/cognitiveRunValidation.ts');window.policy=await import('/src/services/storage/cognitiveArchivePolicy.ts');window.logger=(await import('/src/services/analytics/eventLogger.ts')).eventLogger;window.sys=(await import('/src/services/analytics/systemLogger.ts')).systemLogger;window.actor={id:'admin',name:'ادمین',role:'admin'};})()`);
  const list = (owner = 'test-player', scenario = 4) => evaluate(`repo.listCognitiveRuns(${JSON.stringify(owner)},${scenario},${JSON.stringify(owner)})`);
  const configure = (old, archive) => evaluate(`logger.setLoggingEnabled(${old});policy.setCognitiveArchivePolicy(actor,${archive})`);
  const status = () => evaluate("document.querySelector('[data-cognitive-archive-status]')?.textContent??''");
  const home = async () => { await click('[data-host=home]'); };
  async function completeS1(switchAfterStart = false) {
    await click('[data-host=s1]');
    check(await evaluate("!!document.querySelector('[data-cognitive-archive-disclosure]')"), 'S1 enabled entry disclosure');
    await screenshot('02-s1-enabled-disclosure');
    for (let i = 0; i < 6; i++) await click('.s4-intro-shell button.primary');
    if (switchAfterStart) await click('[data-host=switch]');
    for (let step = 0; step < 100; step++) {
      if (await evaluate("document.querySelector('[data-cognitive-archive-status]')?.textContent.includes('گزارش شناختی این اجرا')")) break;
      const action = await evaluate(`(()=>{
        const buttons=[...document.querySelectorAll('.s4-shell button')];
        const got=buttons.find(n=>n.textContent.trim()==='متوجه شدم'&&!n.disabled);if(got){got.click();return 'notice'}
        const options=[...document.querySelectorAll('.s4-option-card > button:first-child')].filter(n=>!n.disabled);
        const selected=document.querySelector('.s4-option-card.selected');
        if(options.length&&!selected){options[0].click();return 'select'}
        const confirm=buttons.find(n=>n.textContent.trim()==='ثبت تصمیم'&&!n.disabled);
        if(confirm){confirm.click();confirm.click();return 'confirm twice'}
        const next=document.querySelector('.s4-move1-action-bar button:not(:disabled)')??document.querySelector('.s4-main .primary:not(:disabled)');
        if(next){next.click();return next.textContent.trim()}return null;
      })()`);
      await delay(80);
      if (!action) throw Error('S1 stalled: ' + await evaluate('document.body.innerText.slice(0,1800)'));
    }
    await waitFor(() => status().then(s => s.includes('ذخیره شد') || s.includes('ذخیره نشد')), 'S1 storage result');
    check((await status()).includes('ذخیره شد'), 'S1 genuine completion persists: ' + await status());
    await screenshot('03-s1-real-completion-saved');
  }
  async function completeS2({ switchOwner = false, expectSaved = true, archiveAtCompletion, shot } = {}) {
    await click('[data-host=s2]');
    if (await evaluate('policy.readCognitiveArchivePolicy().enabled')) check(await evaluate("!!document.querySelector('[data-cognitive-archive-disclosure]')"), 'S2 enabled entry disclosure');
    await click('.s5-briefing-card > .s5-primary-button');
    if (archiveAtCompletion !== undefined) await evaluate(`policy.setCognitiveArchivePolicy(actor,${archiveAtCompletion})`);
    if (switchOwner) await click('[data-host=switch]');
    for (let step = 0; step < 110; step++) {
      if (await evaluate("!!document.querySelector('.s5-ending')")) break;
      const action = await evaluate(`(()=>{
        const phase=document.querySelector('.s5-phase-summary .s5-primary-button');if(phase){phase.click();return 'phase'}
        const belief=document.querySelector('.s5-belief-panel');if(belief){const radio=belief.querySelector('.s5-corridor-card input');if(radio&&!radio.checked){radio.click();return 'belief select'}const b=belief.querySelector('.s5-primary-button:not(:disabled)');if(b){b.click();return 'belief confirm'}return 'belief ranges'}
        const reason=document.querySelector('.s5-reason-options input');if(reason&&!reason.checked){reason.click();return 'reason select'}
        const reasonConfirm=document.querySelector('.s5-form-panel .s5-primary-button:not(:disabled)');if(reasonConfirm){reasonConfirm.click();return 'reason confirm'}
        const outcome=document.querySelector('.s5-outcome-panel .s5-primary-button');if(outcome){outcome.click();return 'outcome'}
        const actions=[...document.querySelectorAll('.s5-action-card')].filter(n=>!n.disabled);
        if(actions.length){const confirm=document.querySelector('.s5-decision-actions .s5-primary-button');if(confirm&&!confirm.disabled){confirm.click();return 'confirm'}
          const selected=document.querySelector('.s5-action-card[aria-pressed=true],.s5-action-card.selected');
          const target=document.querySelector('.s5-map-target:not(:disabled)');if(selected&&target){target.dispatchEvent(new MouseEvent('click',{bubbles:true}));return 'target'}
          actions[0].click();return 'action'}return null;
      })()`);
      if (action === 'belief ranges') for (let i = 0; i < 3; i++) {
        await evaluate(`document.querySelectorAll('.s5-belief-range')[${i}].focus()`);
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
      }
      await delay(70);
      if (!action) throw Error('S2 stalled: ' + await evaluate('document.body.innerText.slice(0,2000)'));
    }
    await waitFor(() => evaluate("!!document.querySelector('.s5-ending')"), 'S2 full completion');
    if (!switchOwner) {
      await waitFor(() => status().then(s => s && !s.includes('در حال')), 'S2 archive status');
      check((await status()).includes(expectSaved ? 'ذخیره شد' : 'غیرفعال'), 'S2 genuine completion storage policy: ' + await status());
    } else check(await status() === '', 'Switched profile cannot see original owner storage status');
    if (shot) await screenshot(shot);
  }
  await configure(false, true);
  await completeS1(); const s1 = await list(); check(s1.length === 1, 'A/F: double S1 finish produces one record');
  await evaluate('(async()=>{window.s1Saved=await repo.listCognitiveRuns("test-player",4,"test-player")})()');
  check(await evaluate("JSON.stringify(s1Saved[0].cognitive)===JSON.stringify(JSON.parse(localStorage.getItem('space-war.scenario4.redesigned-s1.final.snapshot')).cognitiveScoresV3)"), 'Exact S1 canonical object, including timing telemetry retained');
  await home(); await completeS2({ shot: '04-s2-real-completion-saved' });
  check((await list('test-player', 5)).length === 1, 'A: S2 stored with old logger OFF');
  check(await evaluate('logger.getEvents().length===0'), 'A: real S1/S2 no behavioral events when old flag OFF');
  await evaluate('(async()=>{window.s2Saved=await repo.listCognitiveRuns("test-player",5,"test-player")})()');
  check(await evaluate('(async()=>(await repo.insertCompletedCognitiveRunIfAbsent(s2Saved[0])).status==="already-saved")()'), 'F: durable insert-if-absent');
  await home(); await click('[data-host=switch]'); await completeS1();
  const secondS1 = await list('scenario-tester', 4);
  check(secondS1.length === 1 && secondS1[0].sourceRunId === s1[0].sourceRunId && secondS1[0].recordId !== s1[0].recordId, 'G: shared scientific S1 ID, separate attempts and owners');
  await home(); await click('[data-host=switch]');
  await configure(true, false); await completeS2({ expectSaved: false, shot: '05-archive-disabled-completion' });
  check((await list('test-player', 5)).length === 1, 'B/E: OFF stops new records and retains old ones');
  check(await evaluate('logger.getEvents().some(e=>e.type==="s5_v3_run_completed")'), 'B: legacy completion event obeys independent flag');
  await home(); await configure(false, false); const beforeC = await evaluate('logger.getEvents().length');
  await completeS2({ expectSaved: false });
  check(await evaluate('logger.getEvents().length') === beforeC && (await list('test-player', 5)).length === 1, 'C: both OFF no new behavioral event or cognitive record');
  check(await evaluate('!!sys.log("cross09d1a_admin_witness",actor)'), 'C: system administrative logger remains independent');
  await home(); await configure(true, true); await completeS2({ switchOwner: true, shot: '06-owner-switch-completion' });
  check((await list('test-player', 5)).length === 2 && (await list('scenario-tester', 5)).length === 0, 'D/H: both ON; switched profile does not reassign attempt');
  await home(); await click('[data-host=switch]');
  await configure(false, true); await completeS2({ archiveAtCompletion: false, expectSaved: false });
  check((await list('test-player', 5)).length === 2, 'Policy re-read: ON at start, OFF at completion prevents insert');
  await home(); await completeS2({ archiveAtCompletion: true });
  check((await list('test-player', 5)).length === 3, 'Policy re-read: OFF at start, ON at completion saves result');
  await home();
  const negative = await evaluate(`(async()=>{
    const checks=[];const rejects=async(name,fn)=>{try{await fn();checks.push({name,pass:false})}catch{checks.push({name,pass:true})}};
    await rejects('I missing owner',()=>attempts.beginCognitiveAttempt(undefined,5,'s5-live'));
    await rejects('I unknown owner',()=>attempts.beginCognitiveAttempt('no-such-owner',5,'s5-live'));
    await rejects('J legacy ID',()=>attempts.beginCognitiveAttempt('test-player',2,'s5-live'));
    await rejects('J preview identity',()=>attempts.beginCognitiveAttempt('test-player',5,'ADMIN-DESIGN-PREVIEW-ONLY'));
    await rejects('J forged/reloaded attempt',()=>attempts.archiveS2Completion({}, {}, {}));
    await rejects('H read mismatch',()=>repo.readCognitiveRun(s1Saved[0].recordId,'scenario-tester'));
    await rejects('H list mismatch',()=>repo.listCognitiveRuns('test-player',4,'scenario-tester'));
    const backup=await import('/src/services/storage/systemStorage.ts');
    checks.push({name:'Policy not auto-enabled by legacy backup transfer',pass:!Object.hasOwn(backup.readSystemEntries(),policy.COGNITIVE_ARCHIVE_POLICY_KEY)});
    const s=s2Saved[0];const mutate=fn=>{const c=structuredClone(s);fn(c);validation.validateSavedCognitiveRun(c)};
    for(const [name,fn] of [
      ['J missing nested field',c=>delete c.cognitive.telemetrySummary.totalRevisions],
      ['J omitted vs null',c=>delete c.cognitive.constructs.informationDiscipline],
      ['J wrong version',c=>c.cognitive.formulaVersion='unvalidated'],
      ['J NaN',c=>c.cognitive.orientation.overall=NaN],
      ['J out of range',c=>c.cognitive.orientation.overall=-2],
      ['J run mismatch',c=>c.cognitive.runId='different'],
      ['J unknown scientific field',c=>c.cognitive.extraScientificField=123],
      ['J malformed array',c=>c.cognitive.orientation.phaseScores=[0]],
    ])await rejects(name,()=>mutate(fn));
    mutate(c=>{c.cognitive.orientation.overall=-1;c.cognitive.orientation.phaseScores=[-1,0,1,null];c.cognitive.constructs.riskPosture=0});checks.push({name:'K signed/null/zero preserved without coercion',pass:true});
    await rejects('F identity conflict never overwrites',()=>repo.insertCompletedCognitiveRunIfAbsent({...s,cognitive:{...s.cognitive,orientation:{...s.cognitive.orientation,overall:s.cognitive.orientation.overall===1?-1:1}}}));
    const raw=await new Promise((resolve,reject)=>{const q=indexedDB.open(repo.COGNITIVE_ARCHIVE_DB,1);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
    const rawPut=value=>new Promise((resolve,reject)=>{const tx=raw.transaction(repo.COGNITIVE_ARCHIVE_STORE,'readwrite');tx.objectStore(repo.COGNITIVE_ARCHIVE_STORE).put(value);tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)});
    const corrupted=structuredClone(s);delete corrupted.cognitive.orientation.overall;await rawPut(corrupted);
    await rejects('Read schema validation',()=>repo.readCognitiveRun(s.recordId,'test-player'));
    await rejects('List schema validation',()=>repo.listCognitiveRuns('test-player',5,'test-player'));
    await rawPut(s);raw.close();
    const original=indexedDB;Object.defineProperty(window,'indexedDB',{value:undefined,configurable:true});
    await rejects('L unavailable IndexedDB',()=>repo.listCognitiveRuns('test-player',4,'test-player'));
    checks.push({name:'L unavailable storage status never claims saved',pass:(await attempts.completionArchiveStatus(()=>repo.insertCompletedCognitiveRunIfAbsent({...s,recordId:crypto.randomUUID()}))).startsWith('گزارش شناختی ذخیره نشد:')});
    Object.defineProperty(window,'indexedDB',{value:original,configurable:true});
    const add=IDBObjectStore.prototype.add;IDBObjectStore.prototype.add=function(){throw new DOMException('isolated quota injection','QuotaExceededError')};
    await rejects('L quota failure',()=>repo.insertCompletedCognitiveRunIfAbsent({...s,recordId:crypto.randomUUID()}));
    checks.push({name:'L quota storage status never claims saved',pass:(await attempts.completionArchiveStatus(()=>repo.insertCompletedCognitiveRunIfAbsent({...s,recordId:crypto.randomUUID()}))).startsWith('گزارش شناختی ذخیره نشد:')});
    IDBObjectStore.prototype.add=add;
    localStorage.setItem(policy.COGNITIVE_ARCHIVE_POLICY_KEY,'malformed');
    await rejects('M invalid policy fails closed',()=>repo.insertCompletedCognitiveRunIfAbsent({...s,recordId:crypto.randomUUID()}));
    policy.setCognitiveArchivePolicy(actor,true);
    const a=attempts.beginCognitiveAttempt('test-player',5,s.sourceRunId);
    await rejects('J incomplete route',()=>attempts.archiveS2Completion(a,{runId:s.sourceRunId,stage:{stageId:'decision:A1'}},{runId:s.sourceRunId,cognitive:s.cognitive}));
    await rejects('J three-way identity mismatch',()=>attempts.archiveS2Completion(a,{runId:s.sourceRunId,stage:{stageId:'complete'}},{runId:'other',cognitive:s.cognitive}));
    policy.setCognitiveArchivePolicy(actor,false);
    checks.push({name:'E archive OFF read existing',pass:(await repo.listCognitiveRuns('test-player',4,'test-player')).length===1});
    return checks;
  })()`);
  for (const r of negative) check(r.pass, r.name);
  const reloadIds = (await list('test-player', 5)).map(x => x.recordId);
  await send('Page.reload'); await delay(600);
  await click('[data-host=admin]'); await screenshot('07-refresh-admin-independent-settings');
  check(await evaluate("localStorage.getItem('space-war.analytics.enabled')==='false'&&document.querySelector('[role=switch]').getAttribute('aria-checked')==='false'"), 'M config reload persists independently');
  const reloaded = await evaluate("(async()=>{const r=await import('/src/services/storage/cognitiveRunRepository.ts');return r.listCognitiveRuns('test-player',5,'test-player')})()");
  check(JSON.stringify(reloaded.map(x => x.recordId)) === JSON.stringify(reloadIds), 'A/F/E reload retains records without duplication while archive OFF');
  fs.writeFileSync('docs/scenario-cross-phase09d1a-completion-witnesses.json', JSON.stringify({ testOnly: true, source: 'Eight genuine UI completions in a disposable browser; canonical records read back after reload; never migration input', s1: [s1[0], secondS1[0]], s2: reloaded }, null, 2));
  await evaluate(`(async()=>{const p=await import('/src/services/storage/profileStorage.ts');const s=p.loadProfileState(3);p.saveProfileState(p.deleteProfile({...s,activeProfileId:'admin'},'test-player'));})()`);
  check(await evaluate(`(async()=>{const r=await import('/src/services/storage/cognitiveRunRepository.ts');try{await r.listCognitiveRuns('test-player',4,'test-player');return false}catch{return (await r.listCognitiveRuns('scenario-tester',4,'scenario-tester')).length===1}})()`), 'N deleted-owner records never reassigned');
  fs.writeFileSync('docs/scenario-cross-phase09d1a-browser-verification.json', JSON.stringify({ status: 'PASS', assertions: results.length, results, realUiCompletions: { s1: 2, s2: 6 }, strictMode: true, liveUserDataAccessed: false, profileDir, screenshots: fs.readdirSync(out).filter(x => x.endsWith('.png') && x !== 'failure.png') }, null, 2));
  console.log(JSON.stringify({ status: 'PASS', assertions: results.length, realUiCompletions: 8, out }));
} catch (error) {
  if (send) { try { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}/failure.png`, Buffer.from(r.data, 'base64')); } catch { /* disconnected */ } }
  const page = evaluate ? await evaluate("({url:location.href,html:document.documentElement.outerHTML.slice(0,3000)})").catch(String) : null;
  fs.writeFileSync('docs/scenario-cross-phase09d1a-browser-verification.json', JSON.stringify({ status: 'FAIL', error: String(error), stack: error.stack, results, browserErrors, page }, null, 2));
  throw error;
} finally { socket?.close(); chrome.kill(); vite.kill(); }
