import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const outputDir = "docs/scenario5-admin-preview-screenshots";
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputDir+'/inspection.json',JSON.stringify({status:'RUNNING'}));
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "s5-admin-preview-chrome-"));
const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
].filter(Boolean);
const chromePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));
if (!chromePath) throw new Error("Chrome/Edge executable was not found. Set CHROME_PATH.");

const vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5196"], { stdio: "ignore", windowsHide: true });
const chrome = spawn(chromePath, ["--headless=new", "--remote-debugging-port=9246", `--user-data-dir=${profileDir}`, "--disable-gpu", "--no-first-run", "--no-default-browser-check", "http://127.0.0.1:5196"], { stdio: "ignore", windowsHide: true });
const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
const waitFor = async (url, attempts = 100) => {
  for (let index = 0; index < attempts; index += 1) {
    try { const response = await fetch(url); if (response.ok) return response; } catch { /* wait */ }
    await delay(200);
  }
  throw new Error(`Timed out waiting for ${url}`);
};

let socket;
try {
  await waitFor("http://127.0.0.1:5196");
  await waitFor("http://127.0.0.1:9246/json");
  const targets = await (await fetch("http://127.0.0.1:9246/json")).json();
  const target = targets.find((item) => item.type === "page" && item.url.startsWith("http://127.0.0.1:5196"));
  if (!target) throw new Error("Scenario 5 QA page was not found.");
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  let requestId = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const item = pending.get(message.id); pending.delete(message.id);
    if (message.error) item.reject(new Error(message.error.message)); else item.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++requestId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  };
  const click = async (selector, index = 0) => {
    const clicked = await evaluate(`(() => { const node = document.querySelectorAll(${JSON.stringify(selector)})[${index}]; if (!node) return false; if(typeof node.click==='function')node.click();else node.dispatchEvent(new MouseEvent('click',{bubbles:true})); return true; })()`);
    if (!clicked) {
      const snapshot = await evaluate("({ text: document.body.innerText.slice(0, 500), html: document.body.innerHTML.slice(0, 500) })");
      throw new Error(`Selector not found: ${selector}[${index}] ${JSON.stringify(snapshot)}`);
    }
    await delay(300);
  };
  const setViewport = async (width, height) => {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
    await delay(180);
  };

  const assert = (v,m) => {if(!v)throw new Error(m);};
  const snapshots=[];
  const layoutChecks=[];
  const state = () => evaluate(`(() => {
    const el=document.querySelector('.s5-root'); if(!el)return null;
    let f=el[Object.keys(el).find(k=>k.startsWith('__reactFiber'))];
    while(f && f.type?.name!=='ScenarioFiveSimulation')f=f.return;
    return f?.memoizedState?.memoizedState ?? null;
  })()`);
  const capture = async (filename,stage,width=1440,height=900,scrollSelector=null) => {
    await setViewport(width,height);
    if(scrollSelector) await evaluate(`document.querySelector(${JSON.stringify(scrollSelector)}).scrollIntoView({block:'start'})`);
    else await evaluate('scrollTo(0,0)');
    const runtime=await state();
    const metrics=await evaluate(`(() => {
      const doc=document.documentElement;
      const pane=document.querySelector('.s5-stage-body:not([hidden]) .s5-control-scroll') ?? document.querySelector('.s5-control-pane > .s5-panel .s5-control-scroll');
      const map=document.querySelector('.s5-map-pane'); const rect=map?.getBoundingClientRect();
      const footer=document.querySelector('.s5-stage-body:not([hidden]) .s5-control-footer') ?? document.querySelector('.s5-control-pane > .s5-panel .s5-control-footer');
      const foot=footer?.getBoundingClientRect();
      return {
        page:{scrollHeight:doc.scrollHeight,clientHeight:doc.clientHeight,scrollWidth:doc.scrollWidth,clientWidth:doc.clientWidth},
        leftPane:pane?{scrollHeight:pane.scrollHeight,clientHeight:pane.clientHeight,scrollTop:pane.scrollTop,overflowY:getComputedStyle(pane).overflowY}:null,
        mapVisible:!!rect && rect.height>0 && rect.top>=0 && rect.bottom<=innerHeight,
        mapFrame:document.querySelector('.s5-map-frame')?.getBoundingClientRect().toJSON(),
        footerReachable:!foot || foot.bottom<=innerHeight,
        visibleConvoyCards:[...document.querySelectorAll('[data-convoy-card]')].map(e=>({id:e.dataset.convoyCard,text:e.innerText})),
        selectedAction:document.querySelector('.s5-action-card[aria-pressed=true] h3')?.innerText ?? null,
        selectedTarget:document.querySelector('.s5-target-picker select')?.value ?? null,
        endingId:document.querySelector('[data-ending-id]')?.dataset.endingId ?? null,
        hiddenTruthInDom: /W-corridor_|cautious_denial|deceptive_diversion|opportunistic_interdiction|pressure_escalator|hiddenProvenance|actorInternalState/.test(document.body.innerText),
        sliders:[...document.querySelectorAll('.s5-belief-range')].map(n=>({value:n.value,label:n.getAttribute('aria-valuetext')})),
      };
    })()`);
    const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
    fs.writeFileSync(`${outputDir}/${filename}`,Buffer.from(shot.data,'base64'));
    const round=runtime?.stage.stageId.startsWith('decision:') ? runtime.missionState.currentRound : runtime?.pendingDecision?.roundId ?? runtime?.domainDecisionRecords.at(-1)?.roundId ?? null;
    const m={filename,runtimeStage:runtime?.stage?.stageId ?? stage,stage,phase:round ? ['A','B','C','D'][Math.ceil(round/2)-1] : null,round,clock:runtime?.missionState?.worldClockMinutes ?? null,ISR:runtime?.missionState?.resources.isrCapacity ?? null,Support:runtime?.missionState?.resources.supportReserve ?? null,evidenceCount:runtime?.evidence?.length ?? 0,visibleConvoyValues:runtime?.missionState?.convoys?.map(c=>({convoyId:c.convoyId,integrity:c.integrity,delay:c.delayMinutes,arrival:c.baselineArrivalMinute+c.delayMinutes,deadline:c.deadlineMinute,status:c.status})) ?? [],viewport:{width,height},...metrics,notes:[]};
    m.selectedAction=runtime?.pendingDecision?.selection.actionId ?? runtime?.currentSelectionHistory.at(-1)?.actionId ?? null;
    m.selectedTarget=metrics.selectedTarget ?? runtime?.pendingDecision?.selection.targetCorridorId ?? null;
    snapshots.push(m);
    fs.writeFileSync(`${outputDir}/inspection.json`,JSON.stringify({snapshots},null,2));
    if(runtime && runtime.stage.stageId!=='complete') {
      assert(metrics.page.scrollHeight<=height && metrics.page.scrollWidth<=width,`Page overflow: ${filename}`);
      assert(metrics.mapVisible && metrics.mapFrame.height>=100,`Map not visible: ${filename}`);
      assert(metrics.footerReachable,`Footer clipped: ${filename}`);
      assert(!metrics.hiddenTruthInDom,`Hidden truth leaked: ${filename}`);
      for(const c of m.visibleConvoyValues) {
        const card=metrics.visibleConvoyCards.find(v=>v.id===c.convoyId)?.text ?? '';
        assert(card.includes(`T+${c.arrival}`)&&card.includes(`T+${c.deadline}`),`Stale convoy card ${c.convoyId}`);
      }
      if(width===1440) {
        for(const [w,h] of [[1280,720],[1366,768]]) {
          await setViewport(w,h);
          const layout=await evaluate(`(() => {const d=document.documentElement;const map=document.querySelector('.s5-map-frame').getBoundingClientRect();const foot=document.querySelector('.s5-stage-body:not([hidden]) .s5-control-footer')?.getBoundingClientRect()??document.querySelector('.s5-control-pane > .s5-panel .s5-control-footer')?.getBoundingClientRect();const textFits=[...document.querySelectorAll('.s5-phase-review .s5-command-identity h1,.s5-phase-review .s5-command-identity p')].every(n=>n.scrollWidth<=n.clientWidth+1&&n.scrollHeight<=n.clientHeight+1);return {width:innerWidth,height:innerHeight,scrollHeight:d.scrollHeight,scrollWidth:d.scrollWidth,mapHeight:map.height,mapBottom:map.bottom,footerBottom:foot?.bottom??null,reviewHeaderTextFits:textFits};})()`);
          layoutChecks.push({filename,...layout});
          assert(layout.scrollHeight<=h&&layout.scrollWidth<=w&&layout.mapHeight>=100&&layout.mapBottom<=h&&(!layout.footerBottom||layout.footerBottom<=h)&&layout.reviewHeaderTextFits,`Responsive overflow ${filename}/${w}`);
        }
        await setViewport(width,height);
      }
    }
    return m;
  };
  const chooseAction = async (index=0) => {
    await click('.s5-action-card',index);
    const hasTarget=await evaluate(`!!document.querySelector('.s5-target-picker select')`);
    if(hasTarget) {
      assert(await evaluate(`document.querySelector('.s5-decision-actions .s5-primary-button').disabled`),'Required target gate bypass');
      await click('.s5-map-target:not(:disabled)',0);
      assert(await evaluate(`document.querySelector('.s5-target-picker select').value!==''`),'Map target did not update left pane');
    }
  };


  const fillBelief=async()=>{
    await click('.s5-corridor-card input',1);
    for(const [i,key] of ['ArrowRight','End','Home'].entries()){
      await evaluate(`document.querySelectorAll('.s5-belief-range')[${i}].focus()`);
      await send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key});
    }
    await click('.s5-belief-panel .s5-primary-button');
  };
  const confirm=()=>click('.s5-decision-actions .s5-primary-button');
  const outcomeContinue=()=>click('.s5-outcome-panel .s5-primary-button');
  const submitReason=async()=>{await click('.s5-reason-options input',0);await click('.s5-form-panel .s5-primary-button');};
  const headerDom=()=>evaluate(`(() => {
    const root=document.querySelector('.s5-command-bar');
    return {title:root.querySelector('h1').innerText,subtitle:root.querySelector('.s5-command-identity p').innerText,label:root.querySelector('.s5-stage-chip').innerText,progress:[...root.querySelectorAll('.s5-phase-progress span')].map(n=>({text:n.innerText,current:n.getAttribute('aria-current'),completed:n.classList.contains('s5-done')})),counters:[...root.querySelectorAll('.s5-command-chip')].map(n=>n.innerText),convoys:[...document.querySelectorAll('[data-convoy-card]')].map(n=>n.innerText)};
  })()`);

  const clickText=async(text)=>{const ok=await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(n=>n.textContent.trim()===${JSON.stringify(text)});if(!b)return false;b.click();return true;})()`);assert(ok,'Missing button '+text);await delay(300);};
  const forceView=async(value)=>{assert(await evaluate(`(()=>{const root=document.querySelector('.app-root');if(!root)return false;let app=root[Object.keys(root).find(k=>k.startsWith('__reactFiber'))];while(app&&app.type?.name!=='App')app=app.return;let h=app?.memoizedState;while(h&&!['mainMenu','scenarioFiveDashboardPreview'].includes(h.memoizedState))h=h.next;if(!h?.queue?.dispatch)return false;h.queue.dispatch(${JSON.stringify(value)});return true;})()`),'QA view dispatch');await delay(300);};
  await send('Page.enable');await send('Runtime.enable');await send('Page.navigate',{url:'http://127.0.0.1:5196'});await delay(1400);for(let i=0;i<100;i++){if(await evaluate("!!document.querySelector('.main-menu-card')"))break;await delay(100);}assert(await evaluate("!!document.querySelector('.main-menu-card')"),'Main menu ready');await setViewport(1440,900);
  assert(!(await evaluate("!!document.querySelector('[data-admin-s5-dashboard-shortcut]')")),'Shortcut exposed to player');await forceView('scenarioFiveDashboardPreview');assert(!(await evaluate("!!document.querySelector('[data-admin-cognitive-preview]')")),'Route bypass exposed preview');await forceView('mainMenu');
  await clickText('ساخت / انتخاب پروفایل');await evaluate("[...document.querySelectorAll('.profile-item')].find(n=>n.querySelector('.profile-name')?.textContent==='ادمین').click()");await delay(250);
  const password=fs.readFileSync('scripts/validate-system-management-browser.mjs','utf8').match(/input\("#admin-password",\s*"([^"]+)"/)[1];
  await evaluate(`(()=>{const n=document.querySelector('#admin-password');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(n,${JSON.stringify(password)});n.dispatchEvent(new Event('input',{bubbles:true}));})()`);await clickText('ورود به ادمین');
  assert(await evaluate("!!document.querySelector('[data-admin-s5-dashboard-shortcut]')"),'Admin shortcut missing');await capture('01-admin-only-menu-button.png','authenticated admin menu');
  const eventsBefore=await evaluate("localStorage.getItem('space-war.analytics.events')");await click('[data-admin-s5-dashboard-shortcut]');assert(await evaluate("!!document.querySelector('[data-admin-cognitive-preview]')&&document.body.innerText.includes('داده‌های نمونه آزمایشی')&&document.querySelector('[data-cognitive-run]').dataset.cognitiveRun==='ADMIN-DESIGN-PREVIEW-ONLY'"),'Preview sample label/source');assert(await evaluate("document.querySelectorAll('[data-construct]').length===9"),'Preview is not actual dashboard component');await capture('02-admin-design-dashboard.png','temporary admin-only sample preview');
  assert(await evaluate("document.documentElement.scrollWidth<=innerWidth"),'Horizontal preview overflow');await clickText('بستن پیش‌نمایش');assert(await evaluate("!!document.querySelector('.main-menu-card')"),'Close failed');await click('[data-admin-s5-dashboard-shortcut]');await clickText('پایان سناریو');assert(await evaluate("!!document.querySelector('.main-menu-card')"),'Finish preview failed');assert(await evaluate("localStorage.getItem('space-war.analytics.events')")===eventsBefore,'Preview wrote gameplay telemetry');
  await clickText('ساخت / انتخاب پروفایل');await evaluate("[...document.querySelectorAll('.profile-item')].find(n=>n.querySelector('.profile-name')?.textContent==='بازیکن تست').click()");await delay(300);assert(!(await evaluate("!!document.querySelector('[data-admin-s5-dashboard-shortcut]')")),'Shortcut visible after switching to player');
  fs.writeFileSync(outputDir+'/inspection.json',JSON.stringify({status:'PASS',snapshots,playerButtonAbsent:true,playerForcedRouteBlocked:true,authenticatedAdminShortcut:true,sampleClearlyLabeled:true,closeAndFinishReturnToMenu:true,gameplayTelemetryUnchanged:true,shortcutHiddenAfterProfileSwitch:true},null,2));console.log('Admin-only preview browser checks: PASS');
}catch(error){fs.writeFileSync(outputDir+'/inspection.json',JSON.stringify({status:'FAIL',error:String(error),stack:error.stack},null,2));throw error;}finally{try{socket?.close();}catch{}chrome.kill();vite.kill();}
