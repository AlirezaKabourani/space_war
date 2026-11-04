import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const outputDir = "docs/scenario5-phase8d1-screenshots";
fs.mkdirSync(outputDir, { recursive: true });
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "s5-phase8d1-chrome-"));
const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
].filter(Boolean);
const chromePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));
if (!chromePath) throw new Error("Chrome/Edge executable was not found. Set CHROME_PATH.");

const vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5189"], { stdio: "ignore", windowsHide: true });
const chrome = spawn(chromePath, ["--headless=new", "--remote-debugging-port=9239", `--user-data-dir=${profileDir}`, "--disable-gpu", "--no-first-run", "--no-default-browser-check", "http://127.0.0.1:5189"], { stdio: "ignore", windowsHide: true });
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
  await waitFor("http://127.0.0.1:5189");
  await waitFor("http://127.0.0.1:9239/json");
  const targets = await (await fetch("http://127.0.0.1:9239/json")).json();
  const target = targets.find((item) => item.type === "page" && item.url.startsWith("http://127.0.0.1:5189"));
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

  const progressHistory=[];
  const previousProgress=new Map();
  const snap=async(name,stage)=>{
    const shot=await capture(name,stage);
    const markers=await evaluate(`Array.from(document.querySelectorAll('[data-convoy-id]')).map(n=>({id:n.dataset.convoyId,progress:Number(n.dataset.visualProgress)}))`);
    for(const m of markers){assert(m.progress>=(previousProgress.get(m.id)??0),'Marker progress regressed');previousProgress.set(m.id,m.progress);}
    progressHistory.push({stage,markers});return shot;
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
  const summary=async(phase,title)=>{
    assert(await evaluate(`document.querySelector('.s5-phase-summary h2').innerText`)===title,`Incorrect phase ${phase} heading`);
    assert(!/فاز [ABCD]/.test(await evaluate(`document.querySelector('.s5-phase-summary').innerText`)),'Internal phase letter rendered');
    await snap(`08d1-phase-${phase.toLowerCase()}-summary-1440x900.png`,`phase ${phase} local summary`);
    const before=JSON.stringify(await state());await click('.s5-phase-summary .s5-primary-button');
    assert(JSON.stringify(await state())===before,'Summary dismissal mutated runtime');
  };
  await send('Page.enable');await send('Runtime.enable');
  await send('Page.navigate',{url:'http://127.0.0.1:5189'});await delay(1300);
  await send('Page.addScriptToEvaluateOnNewDocument',{source:'Date.now = () => 1793448000000;'});
  await evaluate(`localStorage.setItem('space-war.profiles.v1',JSON.stringify({profiles:[{id:'test-player',name:'بازیکن تست',role:'player',scenarioCatalog:'released',progress:6}],activeProfileId:'test-player'}))`);
  await send('Page.reload');await delay(1600);await setViewport(1440,900);
  await click('.menu-buttons button',0);await click('.scenario-card:last-child .scenario-actions button:last-child');
  assert(await evaluate(`document.querySelector('.intro-modal').innerText.includes('سناریو ۲ — امواج خاموش')`),'Released title/routing mismatch');
  await click('.intro-modal .primary');await click('.s5-briefing .s5-primary-button');
  await chooseAction(0);await confirm();await outcomeContinue();await fillBelief();
  await chooseAction(0);await confirm();await outcomeContinue();await fillBelief();
  await summary('A','فاز ۱ — ساخت تصویر اولیه کامل شد');
  await chooseAction(2);await confirm();await outcomeContinue();
  await chooseAction(1);await confirm();await submitReason();await delay(1000);

  const reroute=await evaluate(`(() => {
    const path=document.querySelector('.s5-alternate-route path');
    const numbers=path.getAttribute('d').match(/[-+]?\\d*\\.?\\d+(?:e[-+]?\\d+)?/g).map(Number);
    const [x0,y0,cx,cy,x1,y1]=numbers;
    const corridor=path.dataset.corridorId;
    const ids={corridor_alpha_east:'alpha',corridor_beta_south:'beta',corridor_gamma_northwest:'gamma',corridor_delta_west:'delta'};
    const marker=document.querySelector('[data-convoy-id="'+ids[corridor]+'"]');
    const p=Number(marker.dataset.visualProgress),q=1-p;
    const svg=marker.ownerSVGElement;
    const actual=new DOMPoint(0,0).matrixTransform(marker.getScreenCTM()).matrixTransform(svg.getScreenCTM().inverse());
    return {convoyId:ids[corridor],corridorId:corridor,progress:p,originalPoint:{x:x0+(x1-x0)*p,y:y0+(y1-y0)*p},alternatePoint:{x:q*q*x0+2*q*p*cx+p*p*x1,y:q*q*y0+2*q*p*cy+p*p*y1},actualRenderedPoint:{x:actual.x,y:actual.y}};
  })()`);
  assert(reroute.progress>.08&&reroute.progress<1,'Reroute witness not in transit');
  assert(Math.hypot(reroute.actualRenderedPoint.x-reroute.alternatePoint.x,reroute.actualRenderedPoint.y-reroute.alternatePoint.y)<.001,'Actual marker does not follow alternate SVG path');
  assert(Math.hypot(reroute.actualRenderedPoint.x-reroute.originalPoint.x,reroute.actualRenderedPoint.y-reroute.originalPoint.y)>1,'Marker still follows original route');
  const runtime=await state();const convoy=runtime.missionState.convoys.find(c=>c.convoyId===reroute.convoyId);
  const prior=JSON.parse(fs.readFileSync('docs/scenario5-phase8d-screenshots/inspection.json','utf8')).snapshots.find(s=>s.filename==='09-r4-outcome-reroute-map-1440x900.png');
  const priorConvoy=prior.visibleConvoyValues.find(c=>c.convoyId===reroute.convoyId);
  Object.assign(reroute,{projectedArrivalMinute:convoy.baselineArrivalMinute+convoy.delayMinutes,delayMinutes:convoy.delayMinutes,baselineProjectedArrivalMinute:priorConvoy.arrival,baselineDelayMinutes:priorConvoy.delay});
  assert(reroute.projectedArrivalMinute===priorConvoy.arrival&&reroute.delayMinutes===priorConvoy.delay,'Mission ETA/delay differs from accepted 08D browser witness');
  const beforeGeometry=JSON.stringify(await state());
  await snap('08d1-r4-reroute-marker-1440x900.png','R4 committed reroute');
  assert(JSON.stringify(await state())===beforeGeometry,'Rendering geometry mutated runtime');
  await outcomeContinue();await summary('B','فاز ۲ — تمرکز و مدیریت مسیر کامل شد');
  await chooseAction(0);await confirm();await outcomeContinue();
  await chooseAction(2);await confirm();await submitReason();await outcomeContinue();await fillBelief();
  await summary('C','فاز ۳ — ایجاد تاب‌آوری کامل شد');
  assert(await evaluate(`document.querySelector('.s5-command-identity h1').innerText.includes('مدیریت فشار و تحویل')`),'Phase D title changed');
  await chooseAction(3);await confirm();
  const completed='اسکورت در جریان این اقدام اعمال شد و با ورود به مرحله بعد پایان یافت.';
  assert(await evaluate(`document.querySelector('.s5-outcome-panel').innerText.includes(${JSON.stringify(completed)})`),'R7 lifecycle message missing');
  assert(!await evaluate(`document.querySelector('.s5-root').innerText.includes('اسکورت فعال')`),'False active escort after expired R7 window');
  assert(!await evaluate(`document.querySelector('.s5-root').innerText.includes('اسکورت مرحله قبل پایان یافت')`),'R7 outcome has duplicate expiry wording');
  await evaluate(`(() => {const span=[...document.querySelectorAll('.s5-outcome-list span')].find(n=>n.textContent.includes(${JSON.stringify(completed)}));span.scrollIntoView({block:'center'});})()`);
  await snap('08d1-r7-escort-outcome-1440x900.png','R7 escort outcome');
  await outcomeContinue();
  assert(await evaluate(`!!document.querySelector('#s5-belief-title')`),'Expected existing next belief stage');
  assert(!await evaluate(`document.querySelector('.s5-root').innerText.includes('اسکورت فعال')`),'Next stage retained false active escort');
  assert(await evaluate(`document.querySelector('.s5-map-pane').innerText.includes('اسکورت مرحله قبل پایان یافت')`),'Missing exact historical expiry copy');
  await evaluate(`document.querySelector('.s5-convoy-strip').scrollTop=10000`);
  await snap('08d1-post-r7-escort-expired-1440x900.png','post-R7 existing final belief');
  const inspection={status:'PASS',snapshots,layoutChecks,progressHistory,reroute,phaseSummaryGuard:'PASS',escortLifecycleGuard:'PASS',hiddenTruthFirewall:'PASS',notes:['Six real browser captures of the normal active id=5 player flow.','All three viewport sizes checked for every captured stage.']};
  fs.writeFileSync(`${outputDir}/inspection.json`,JSON.stringify(inspection,null,2));
  console.log(JSON.stringify({status:'PASS',screenshots:snapshots.length,layoutChecks:layoutChecks.length,reroute,outputDir},null,2));
} finally {
  try{socket?.close();}catch{}
  chrome.kill();vite.kill();
}
