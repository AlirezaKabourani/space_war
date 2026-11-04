import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const outputDir = "docs/scenario5-phase8d-screenshots";
fs.mkdirSync(outputDir, { recursive: true });
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "s5-phase8d-chrome-"));
const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
].filter(Boolean);
const chromePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));
if (!chromePath) throw new Error("Chrome/Edge executable was not found. Set CHROME_PATH.");

const vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5187"], { stdio: "ignore", windowsHide: true });
const chrome = spawn(chromePath, ["--headless=new", "--remote-debugging-port=9237", `--user-data-dir=${profileDir}`, "--disable-gpu", "--no-first-run", "--no-default-browser-check", "http://127.0.0.1:5187"], { stdio: "ignore", windowsHide: true });
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
  await waitFor("http://127.0.0.1:5187");
  await waitFor("http://127.0.0.1:9237/json");
  const targets = await (await fetch("http://127.0.0.1:9237/json")).json();
  const target = targets.find((item) => item.type === "page" && item.url.startsWith("http://127.0.0.1:5187"));
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
          const layout=await evaluate(`(() => {const d=document.documentElement;const map=document.querySelector('.s5-map-frame').getBoundingClientRect();const foot=document.querySelector('.s5-stage-body:not([hidden]) .s5-control-footer')?.getBoundingClientRect();return {width:innerWidth,height:innerHeight,scrollHeight:d.scrollHeight,scrollWidth:d.scrollWidth,mapHeight:map.height,mapBottom:map.bottom,footerBottom:foot?.bottom??null};})()`);
          layoutChecks.push({filename,...layout});
          assert(layout.scrollHeight<=h&&layout.scrollWidth<=w&&layout.mapHeight>=100&&layout.mapBottom<=h&&(!layout.footerBottom||layout.footerBottom<=h),`Responsive overflow ${filename}/${w}`);
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
  const fillBelief = async () => {
    assert(await evaluate(`document.querySelector('.s5-belief-panel .s5-primary-button').disabled`),'Belief not empty');
    assert(await evaluate(`Array.from(document.querySelectorAll('.s5-belief-range')).every(n=>n.getAttribute('aria-valuetext')==='ثبت نشده')`),'Previous belief preloaded');
    await click('.s5-corridor-card input',1);
    for(const [i,key] of ['ArrowRight','End','Home'].entries()){
      await evaluate(`document.querySelectorAll('.s5-belief-range')[${i}].focus()`);
      await send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key}); await send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key});
    }
    await click('.s5-belief-panel .s5-primary-button');
    if(await evaluate(`!!document.querySelector('.s5-phase-summary')`)) {
      const before=JSON.stringify(await state());await click('.s5-phase-summary .s5-primary-button');
      assert(JSON.stringify(await state())===before,'Phase summary mutated runtime/telemetry');
    }
  };
  const confirm=()=>click('.s5-decision-actions .s5-primary-button');
  const outcomeContinue=async()=>{
    await click('.s5-outcome-panel .s5-primary-button');
    if(await evaluate(`!!document.querySelector('.s5-phase-summary')`)) {
      const before=JSON.stringify(await state());await click('.s5-phase-summary .s5-primary-button');
      assert(JSON.stringify(await state())===before,'Phase summary mutated runtime/telemetry');
    }
  };
  const submitReason=async()=>{await click('.s5-reason-options input',0);await click('.s5-form-panel .s5-primary-button');};
  await send('Page.enable');await send('Runtime.enable');
  await send('Page.navigate',{url:'http://127.0.0.1:5187'});await delay(1300);
  await send('Page.addScriptToEvaluateOnNewDocument',{source:'Date.now = () => 1793448000000;'});
  await evaluate(`localStorage.setItem('space-war.profiles.v1',JSON.stringify({profiles:[{id:'test-player',name:'بازیکن تست',role:'player',scenarioCatalog:'released',progress:6}],activeProfileId:'test-player'}))`);
  await send('Page.reload');await delay(1600);await setViewport(1440,900);
  await click('.menu-buttons button',0);await click('.scenario-card:last-child .scenario-actions button:last-child');
  assert(await evaluate(`document.querySelector('.intro-modal').innerText.includes('سناریو ۲ — امواج خاموش')`),'Active id5 intro mismatch');
  await click('.intro-modal .primary');
  await capture('01-briefing-or-entry-1440x900.png','briefing');
  await click('.s5-briefing .s5-primary-button');
  await capture('02-r1-decision-1440x900.png','R1 decision');
  await chooseAction();await confirm();
  await capture('03-r1-outcome-1440x900.png','R1 outcome');
  await outcomeContinue();await capture('04-prebelief-1440x900.png','prebelief');
  await click('.s5-corridor-card input',0);
  const beforeReview=JSON.stringify(await state());
  await click('.s5-last-decision button');
  assert(await evaluate(`document.querySelector('.s5-outcome-panel').innerText.includes('پایش مبنای سراسری')`),'Stored outcome review is not exact');
  await click('.s5-outcome-panel .s5-primary-button');
  assert(JSON.stringify(await state())===beforeReview,'Review changed runtime/telemetry');
  assert(await evaluate(`document.querySelector('.s5-corridor-card input').checked`),'Review lost partial belief input');
  await fillBelief();
  await chooseAction();await capture('05-r2-target-selection-1440x900.png','R2 target');
  const beforeTarget=JSON.stringify(await state());
  await evaluate(`(() => {const select=document.querySelector('.s5-target-picker select');const target=select.options[2].value;Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(select,target);select.dispatchEvent(new Event('change',{bubbles:true}));})()`);await delay(100);
  assert(await evaluate(`document.querySelector('.s5-convoy-mini.s5-selected').dataset.convoyCard==='beta'`),'Left target did not update map');
  await click('.s5-route-hit',0);
  assert(await evaluate(`document.querySelector('.s5-target-picker select').value==='corridor_alpha_east'`),'Route target did not update left pane');
  assert(JSON.stringify(await state())===beforeTarget,'Target previews mutated runtime');
  // Only an explicit decision-stage evidence detail interaction creates open telemetry.
  await click('.s5-evidence-access');await click('.s5-evidence-card .s5-secondary-button',0);await click('.s5-back-to-decision');
  await confirm();await outcomeContinue();await capture('06-postbelief-1440x900.png','postbelief');await fillBelief();
  await capture('07-r3-decision-1440x900.png','R3 decision');await chooseAction(2);await confirm();await outcomeContinue();
  await chooseAction(1);await capture('08-r4-reroute-selected-1440x900.png','R4 reroute');await confirm();await submitReason();
  await capture('09-r4-outcome-reroute-map-1440x900.png','R4 outcome');
  assert(await evaluate(`!!document.querySelector('.s5-alternate-route')`),'Reroute not visualized');
  await outcomeContinue();await chooseAction(0);await capture('10-r5-resilience-1440x900.png','R5 resilience');await confirm();await outcomeContinue();
  await chooseAction(2);await evaluate(`document.querySelector('.s5-control-pane .s5-control-scroll').scrollTop=10000`);
  await capture('11-r6-resource-preview-1440x900.png','R6 preview');await confirm();
  await setViewport(1366,768);
  const mapBefore=await evaluate(`JSON.stringify(document.querySelector('.s5-map-pane').getBoundingClientRect().toJSON())`);
  await evaluate(`document.querySelector('.s5-form-panel .s5-control-scroll').scrollTop=10000`);
  const scroll=await capture('21-left-pane-scroll-1366x768.png','reason scroll',1366,768);
  assert(scroll.leftPane.scrollTop>0,'Left pane did not scroll');
  assert(await evaluate(`JSON.stringify(document.querySelector('.s5-map-pane').getBoundingClientRect().toJSON())`)===mapBefore,'Left scroll moved map');
  await evaluate(`document.querySelector('.s5-form-panel .s5-control-scroll').scrollTop=0`);
  await capture('22-live-console-1280x720.png','live console',1280,720);
  await submitReason();await outcomeContinue();await capture('12-c-belief-1440x900.png','C belief');await fillBelief();
  await capture('13-r7-decision-1440x900.png','R7 decision');await chooseAction(3);await confirm();await outcomeContinue();
  await capture('14-final-belief-1440x900.png','final belief');await fillBelief();
  await capture('15-r8-decision-1440x900.png','R8 decision');await chooseAction(1);await confirm();await submitReason();
  await capture('16-r8-outcome-time-breakdown-1440x900.png','R8 outcome');
  assert(await evaluate(`document.querySelector('.s5-time-breakdown').innerText.includes('ادامه مأموریت')`),'Final time breakdown missing');
  await outcomeContinue();await capture('17-mission-ending-1440x900.png','ending');
  await capture('18-why-this-ending-1440x900.png','why',1440,900,'#s5-why');
  await capture('19-decision-trace-1440x900.png','trace',1440,900,'#s5-trace');
  assert(await evaluate(`document.querySelectorAll('#s5-trace > details').length===8`),'Trace omitted decision');
  await capture('20-hidden-truth-belief-timeline-1440x900.png','truth',1440,900,'#s5-truth');
  const events=await evaluate(`JSON.parse(localStorage.getItem('space-war.analytics.events') ?? '[]')`);
  assert(events.filter(e=>e.type==='s5_v3_evidence_opened').length===1,'Passive evidence telemetry contamination');
  assert(events.filter(e=>e.type==='s5_v3_run_completed').length===1,'Completion not logged exactly once');
  const witnesses=JSON.parse(fs.readFileSync('docs/scenario5-phase8d-witnesses.json','utf8'));
  for(const [index,w] of witnesses.entries()){
    await send('Page.navigate',{url:`http://127.0.0.1:5187/scripts/scenario5-phase8d-witness.html?id=${w.id}`});await delay(700);
    const m=await capture(`witness-${index+1}-${w.id}-1440x900.png`,'completed deterministic witness');
    assert(m.endingId===w.id,`Witness title/ID mismatch: ${w.id}`);
    Object.assign(m,{runtimeStage:'complete',phase:'D',round:8,clock:w.state.missionState.worldClockMinutes,ISR:w.state.missionState.resources.isrCapacity,Support:w.state.missionState.resources.supportReserve,evidenceCount:w.state.evidence.length,visibleConvoyValues:w.state.missionState.convoys.map(c=>({convoyId:c.convoyId,integrity:c.integrity,delay:c.delayMinutes,arrival:c.baselineArrivalMinute+c.delayMinutes,deadline:c.deadlineMinute,status:c.status})),notes:['Real browser rendering of an unmodified frozen-engine witness; QA harness, not a production route.']});
  }
  fs.writeFileSync(`${outputDir}/inspection.json`,JSON.stringify({snapshots,layoutChecks,explicitEvidenceOpenCount:1,completionEventCount:1,passiveEvidenceTelemetry:'PASS',liveHiddenTruthFirewall:'PASS'},null,2));
  console.log(JSON.stringify({result:'PASS',screenshots:snapshots.length,outputDir},null,2));
} finally {
  try{socket?.close();}catch{}
  chrome.kill();vite.kill();
}
