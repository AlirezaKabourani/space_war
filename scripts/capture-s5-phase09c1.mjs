import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const outputDir = "docs/scenario5-phase09c1-screenshots";
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputDir+'/inspection.json',JSON.stringify({status:'RUNNING'}));
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "s5-phase09c1-chrome-"));
const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
].filter(Boolean);
const chromePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));
if (!chromePath) throw new Error("Chrome/Edge executable was not found. Set CHROME_PATH.");

const vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5195"], { stdio: "ignore", windowsHide: true });
const chrome = spawn(chromePath, ["--headless=new", "--remote-debugging-port=9245", `--user-data-dir=${profileDir}`, "--disable-gpu", "--no-first-run", "--no-default-browser-check", "http://127.0.0.1:5195"], { stdio: "ignore", windowsHide: true });
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
  await waitFor("http://127.0.0.1:5195");
  await waitFor("http://127.0.0.1:9245/json");
  const targets = await (await fetch("http://127.0.0.1:9245/json")).json();
  const target = targets.find((item) => item.type === "page" && item.url.startsWith("http://127.0.0.1:5195"));
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

  const reportShots=[],layoutFindings=[],navigation=[],witnessChecks=[];
  const storedEvents=()=>evaluate("localStorage.getItem('space-war.analytics.events')");
  const screenshot=async(filename,section=null,width=1440,height=900)=>{
    await setViewport(width,height);
    if(section)await evaluate(`document.querySelector(${JSON.stringify(section)}).scrollIntoView({block:'start'})`);
    else await evaluate("document.querySelector('.s5-cognitive-dashboard')?.scrollTo(0,0)");
    await delay(150);
    const m=await evaluate(`(()=>{const root=document.querySelector('.s5-cognitive-dashboard'),d=document.documentElement;return {viewport:{width:innerWidth,height:innerHeight},rootRect:root?.getBoundingClientRect().toJSON(),rootClientWidth:root?.clientWidth,rootScrollWidth:root?.scrollWidth,documentWidth:d.scrollWidth,headings:[...document.querySelectorAll('.s5-cognitive-dashboard h1,.s5-cognitive-dashboard h2')].map(n=>n.innerText),displayedText:root?.innerText??document.body.innerText,runId:root?.dataset.cognitiveRun??null,constructs:[...document.querySelectorAll('[data-construct]')].map(n=>n.dataset.construct),signedMarkers:[...document.querySelectorAll('[data-signed-marker]')].map(n=>({field:n.dataset.signedMarker,left:n.style.left,rect:n.getBoundingClientRect().toJSON()})),fieldValues:[...document.querySelectorAll('.s5-cognitive-dashboard [data-cognitive-field]')].map(n=>({field:n.dataset.cognitiveField,text:n.innerText})),hiddenTruthLeak:/W-corridor_|cautious_denial|deceptive_diversion|opportunistic_interdiction|pressure_escalator|actorInternalState|hiddenProvenance|trueWorldState/.test(root?.innerText??''),testOnly:!!window.__phase09c1Witness?.fixture};})()`);
    if(m.runId){const axes=await evaluate(`[...document.querySelectorAll('.s5-cog-signed')].filter(n=>n.querySelector('[data-signed-marker]')).map(n=>{const el=document.querySelector('.s5-cognitive-dashboard');let f=el[Object.keys(el).find(k=>k.startsWith('__reactFiber'))];while(f&&f.type?.name!=='ScenarioFiveCognitiveDashboard')f=f.return;const r=f?.memoizedProps.cognitive,field=n.dataset.cognitiveField;const v=field==='constructs.riskPosture'?r.constructs.riskPosture:field==='orientation.overall'?r.orientation.overall:r.orientation.phaseScores[Number(field.at(-2))],t=n.querySelector('.s5-cog-axis-track').getBoundingClientRect(),m=n.querySelector('[data-signed-marker]').getBoundingClientRect();return {field,value:v,actual:(m.left+m.right)/2,expected:t.left+t.width*(v+1)/2};})`);assert(axes.every(a=>Math.abs(a.actual-a.expected)<2),'Signed axis direction in actual LTR browser');}
    assert(m.documentWidth<=width,'Horizontal document overflow '+filename);assert(!m.rootRect||m.rootScrollWidth<=m.rootClientWidth+1,'Report horizontal clipping '+filename);assert(!m.hiddenTruthLeak,'Truth in cognitive view '+filename);
    const img=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});fs.writeFileSync(outputDir+'/'+filename,Buffer.from(img.data,'base64'));reportShots.push({filename,section,...m});return m;
  };
  const clickText=async(text)=>{const ok=await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(n=>n.textContent.trim()===${JSON.stringify(text)});if(!b)return false;b.click();return true;})()`);assert(ok,'Missing button '+text);await delay(300);};
  const openDashboard=async()=>{await clickText('مشاهده الگوی تصمیم‌گیری');assert(await evaluate("!!document.querySelector('[data-cognitive-run]')"),'Dedicated dashboard absent');};
  const moduleShot=async(name,module)=>screenshot(name,'[data-cognitive-module='+module+']');
  await send('Page.enable');await send('Runtime.enable');await send('Page.navigate',{url:'http://127.0.0.1:5195'});await delay(1300);
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`Date.now=()=>1793448000000;localStorage.setItem('space-war.profiles.v1',JSON.stringify({profiles:[{id:'test-player',name:'بازیکن تست',role:'player',scenarioCatalog:'released',progress:6}],activeProfileId:'test-player'}));`});
  await send('Page.reload');await delay(1600);await setViewport(1440,900);await click('.menu-buttons button',0);await click('.scenario-card:last-child .scenario-actions button:last-child');await click('.intro-modal .primary');await click('.s5-briefing .s5-primary-button');
  const live=[];for(const[w,h]of [[1280,720],[1366,768],[1440,900]]){await capture('live-unchanged-'+w+'x'+h+'.png','unchanged live gameplay',w,h);const geom=await evaluate("document.querySelector('.s5-map-frame').getBoundingClientRect().toJSON()");const prior=JSON.parse(fs.readFileSync('docs/scenario5-phase8d2-ux-screenshots/inspection.json','utf8')).geometry.find(g=>g.width===w&&g.map);for(const key of ['x','y','width','height'])assert(Math.abs(geom[key]-prior.map[key])<1,'Live map regression');live.push({width:w,height:h,geometry:geom,unchanged:true});}
  await setViewport(1440,900);
  const dismissPhase=async()=>{if(await evaluate("!!document.querySelector('.s5-phase-summary')"))await click('.s5-phase-summary .s5-primary-button');};
  await chooseAction(0);await confirm();await outcomeContinue();await fillBelief();await chooseAction(0);await confirm();await outcomeContinue();await fillBelief();await dismissPhase();
  await chooseAction(2);await confirm();await outcomeContinue();await chooseAction(1);await confirm();await submitReason();await outcomeContinue();await dismissPhase();
  await chooseAction(0);await confirm();await outcomeContinue();await chooseAction(2);await confirm();await submitReason();await outcomeContinue();await fillBelief();await dismissPhase();
  await chooseAction(0);await confirm();await outcomeContinue();await fillBelief();await chooseAction(0);await confirm();await submitReason();await outcomeContinue();
  const completed=await state();assert(completed.stage.stageId==='complete','Runtime completion');const eventsBefore=await storedEvents();
  await openDashboard();const normal=await screenshot('01-normal-dashboard-top-1440x900.png');assert(normal.runId===completed.runId,'Dashboard wrong current run');assert(normal.constructs.length===9,'Nine constructs');
  await evaluate("document.querySelector('[data-cognitive-module=M0] summary').focus()");await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13});await delay(100);assert(await evaluate("document.querySelector('[data-cognitive-module=M0] details').open"),'Keyboard disclosure');await moduleShot('01b-coverage-keyboard-disclosure-1440x900.png','M0');
  await moduleShot('02-orientation-and-phases-1440x900.png','M1');await moduleShot('03-all-nine-constructs-1440x900.png','M2');await screenshot('03b-constructs-resources-and-coherence-1440x900.png','.s5-cog-construct-group:nth-child(3)');
  await evaluate("document.querySelectorAll('[data-construct] details').forEach(n=>n.open=true)");await moduleShot('04-construct-definitions-1440x900.png','M2');
  await moduleShot('05-risk-and-interaction-1440x900.png','M3');await evaluate("document.querySelector('.s5-cog-technical').open=true");await moduleShot('06-method-and-metadata-1440x900.png','M4');
  for(const[w,h]of [[1280,720],[1366,768],[390,844]]){const m=await screenshot('07-normal-top-'+w+'x'+h+'.png',null,w,h);layoutFindings.push(m);if(w===390){await screenshot('08-mobile-constructs-390x844.png','[data-cognitive-module=M2]',w,h);await screenshot('09-mobile-risk-390x844.png','[data-cognitive-module=M3]',w,h);}}
  await setViewport(1440,900);await clickText('بازگشت به گزارش مأموریت');assert(await evaluate("!!document.querySelector('.s5-ending')"),'Back failed');assert(JSON.stringify(await state())===JSON.stringify(completed),'Back changed runtime');await openDashboard();assert(await storedEvents()===eventsBefore,'Passive dashboard/back emitted events');
  await clickText('مرور مسیر تصمیم‌ها');assert(await evaluate("document.querySelectorAll('#s5-trace > details').length===8"),'Trace is not all eight decisions');await openDashboard();assert(await storedEvents()===eventsBefore,'Trace navigation emitted events');navigation.push({flow:'actual product run: dashboard/back/reopen/trace/reopen',sameRunId:completed.runId,immutableRuntime:true,passiveEventsUnchanged:true});
  await clickText('گزارش فنی کامل');assert(await evaluate("document.querySelector('.s5-aar-header h1').textContent.includes('تحلیل اجرای مأموریت')"),'Old technical report missing');await clickText('بازگشت به الگوی تصمیم‌گیری');assert(await storedEvents()===eventsBefore,'Technical report navigation emitted events');
  const events=JSON.parse(eventsBefore??'[]');assert(events.filter(e=>e.type==='s5_v3_run_completed').length===1,'Completion log changed');await clickText('پایان سناریو');assert(!(await evaluate("!!document.querySelector('.s5-cognitive-dashboard')")),'Finish callback did not exit');
  const witnesses=JSON.parse(fs.readFileSync('docs/scenario5-phase8d-witnesses.json','utf8'));
  for(const[index,w]of witnesses.entries()){
    await send('Page.navigate',{url:'http://127.0.0.1:5195/scripts/scenario5-phase09c1-witness.html?id='+encodeURIComponent(w.id)});await delay(700);assert(await evaluate("document.querySelector('[data-ending-id]').dataset.endingId")===w.id,'Witness ending identity');const before=await storedEvents();await openDashboard();const shot=await screenshot('witness-'+(index+1)+'-'+w.id+'.png');assert(shot.runId===w.state.runId&&shot.runId===w.result.runId&&shot.runId===w.result.cognitive.runId,'Witness run gate');await clickText('بازگشت به گزارش مأموریت');await openDashboard();assert(await storedEvents()===before,'Witness passive telemetry');witnessChecks.push({endingId:w.id,runId:shot.runId,access:'PASS',backReopen:'PASS',passiveTelemetry:'PASS'});
  }
  for(const fixture of ['null','partial']){
    await send('Page.navigate',{url:'http://127.0.0.1:5195/scripts/scenario5-phase09c1-witness.html?fixture='+fixture});await delay(700);await openDashboard();await screenshot('test-only-'+fixture+'-orientation.png','[data-cognitive-module=M1]');await screenshot('test-only-'+fixture+'-constructs.png','[data-cognitive-module=M2]');await screenshot('test-only-'+fixture+'-risk-timing.png','[data-cognitive-module=M3]');if(fixture==='null')await screenshot('test-only-null-mobile-390x844.png','[data-cognitive-module=M3]',390,844);await setViewport(1440,900);
  }
  for(const fixture of ['missing','mismatch']){await send('Page.navigate',{url:'http://127.0.0.1:5195/scripts/scenario5-phase09c1-witness.html?fixture='+fixture});await delay(700);assert(await evaluate("document.body.innerText.includes('گزارش شناختی این اجرا در دسترس نیست.')&&!document.querySelector('[data-cognitive-run]')"),'Missing/mismatch fallback fabricated');await screenshot('test-only-'+fixture+'-unavailable.png');}
  fs.copyFileSync('docs/scenario5-phase09c0-scenario1-screenshots/02-scenario1-cognitive-dashboard-1440x900.png',outputDir+'/00-s4-reference-genuine-09c0.png');
  fs.writeFileSync(outputDir+'/inspection.json',JSON.stringify({status:'PASS',snapshots,reportShots,layoutFindings,navigation,witnessChecks,liveGameplay:live,completionEventCount:1,normalRunId:completed.runId,normalRunSource:'Actual product UI, no metric/resource injection',nullFixtures:'Explicit TEST ONLY banner; isolated witness page, never product data',s4Reference:{filename:'00-s4-reference-genuine-09c0.png',source:'docs/scenario5-phase09c0-scenario1-screenshots/02-scenario1-cognitive-dashboard-1440x900.png',genuinePriorCapture:true,sourceUnchanged:true},hiddenTruthFirewall:'PASS'},null,2));console.log(JSON.stringify({status:'PASS',normalRun:completed.runId,sixWitnesses:witnessChecks.length,screenshots:reportShots.length+snapshots.length+1},null,2));
} catch(error){fs.writeFileSync(outputDir+'/inspection.json',JSON.stringify({status:'FAIL',error:String(error),stack:error.stack},null,2));throw error;}finally{try{socket?.close();}catch{}chrome.kill();vite.kill();}
