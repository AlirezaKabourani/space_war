import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const outputDir = "docs/scenario5-phase8d2-ux-screenshots";
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputDir+'/inspection.json',JSON.stringify({status:'RUNNING'}));
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "s5-phase8d2-ux-chrome-"));
const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
].filter(Boolean);
const chromePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));
if (!chromePath) throw new Error("Chrome/Edge executable was not found. Set CHROME_PATH.");

const vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5192"], { stdio: "ignore", windowsHide: true });
const chrome = spawn(chromePath, ["--headless=new", "--remote-debugging-port=9242", `--user-data-dir=${profileDir}`, "--disable-gpu", "--no-first-run", "--no-default-browser-check", "http://127.0.0.1:5192"], { stdio: "ignore", windowsHide: true });
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
  await waitFor("http://127.0.0.1:5192");
  await waitFor("http://127.0.0.1:9242/json");
  const targets = await (await fetch("http://127.0.0.1:9242/json")).json();
  const target = targets.find((item) => item.type === "page" && item.url.startsWith("http://127.0.0.1:5192"));
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
  const cases=[
    ['A','مرور پایان فاز ۱ — ساخت تصویر اولیه','مرحله بعد: فاز ۲ — تمرکز و مدیریت مسیر · تصمیم ۳ از ۸','decision:B1_monitoring_allocation',3],
    ['B','مرور پایان فاز ۲ — تمرکز و مدیریت مسیر','مرحله بعد: فاز ۳ — ایجاد تاب‌آوری · تصمیم ۵ از ۸','decision:C1_support_and_checkpoints',5],
    ['C','مرور پایان فاز ۳ — ایجاد تاب‌آوری','مرحله بعد: فاز ۴ — مدیریت فشار و تحویل · تصمیم ۷ از ۸','decision:D1_crisis_response',7],
  ];
  const transitions=[];

  const geometry=[];
  const inspect=async(label)=>{
    for(const [width,height] of [[1280,720],[1366,768],[1440,900]]){
      await setViewport(width,height);
      const m=await evaluate(`(() => {const d=document.documentElement,frame=document.querySelector('.s5-map-frame'),pane=document.querySelector('.s5-control-pane'),bar=document.querySelector('.s5-command-bar'),root=document.querySelector('.s5-root');const visible=n=>!!n&&n.getBoundingClientRect().height>0;return {width:innerWidth,height:innerHeight,pageHeight:d.scrollHeight,pageWidth:d.scrollWidth,map:frame?.getBoundingClientRect().toJSON(),leftWidth:pane?.getBoundingClientRect().width,headerHeight:bar?.getBoundingClientRect().height,root:root?.getBoundingClientRect().toJSON(),rootOverflow:getComputedStyle(root).overflowY,timeText:document.querySelector('.s5-time-chip')?.innerText,mapTime:document.querySelector('.s5-map-clock')?.innerText,alternativeCount:document.querySelectorAll('.s5-ending-alternative').length,textFits:[...document.querySelectorAll('.s5-command-identity h1,.s5-command-identity p,.s5-last-decision,.s5-time-chip strong')].every(n=>n.scrollWidth<=n.clientWidth+1&&n.scrollHeight<=n.clientHeight+1),footerVisible:[...document.querySelectorAll('.s5-control-footer')].filter(visible).every(n=>{const r=n.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight})};})()`);
      assert(m.pageHeight<=height&&m.pageWidth<=width,'Page scroll '+label+'/'+width);
      assert(m.root.bottom<=height+1,'Root clipped '+label+'/'+width);
      assert(m.footerVisible&&m.textFits,'Footer or header text clipped '+label+'/'+width);
      if(m.map){const prev=geometry.find(p=>p.width===width&&p.map);if(prev)for(const key of ['x','y','width','height'])assert(Math.abs(m.map[key]-prev.map[key])<1,'Map jumps '+label+'/'+width+'/'+key+': '+m.map[key]+' vs '+prev.map[key]);assert(m.map.height>=200,'Map too short');assert(m.timeText.includes('از 360 دقیقه')&&m.mapTime.includes('زمان فعلی نقشه'),'Time labels missing');}
      geometry.push({label,...m});
    }
    await setViewport(1440,900);
  };
  const shot=async(name,label,selector=null)=>{await inspect(label);return capture(name,label,1440,900,selector);};
  const summary=async(index)=>{
    const [phase,title,subtitle,stage]=cases[index],before=await state(),events=await evaluate("localStorage.getItem('space-war.analytics.events')");
    const dom=await headerDom();assert(dom.title===title&&dom.subtitle===subtitle,'Previous header fix regressed');assert(before.stage.stageId===stage,'Wrong runtime stage');
    await shot('phase-'+phase+'-review-1440x900.png','phase '+phase+' review');await click('.s5-phase-summary .s5-primary-button');assert(JSON.stringify(await state())===JSON.stringify(before),'Summary mutated runtime');assert(await evaluate("localStorage.getItem('space-war.analytics.events')")===events,'Summary emitted analytics');
    await inspect('after phase '+phase+' Continue');
  };
  await send('Page.enable');await send('Runtime.enable');
  await send('Page.navigate',{url:'http://127.0.0.1:5192'});await delay(1300);
  await send('Page.addScriptToEvaluateOnNewDocument',{source: `Date.now = () => 1793448000000; localStorage.setItem('space-war.profiles.v1',JSON.stringify({profiles:[{id:'test-player',name:'بازیکن تست',role:'player',scenarioCatalog:'released',progress:6}],activeProfileId:'test-player'}));`});
  await evaluate(`localStorage.setItem('space-war.profiles.v1',JSON.stringify({profiles:[{id:'test-player',name:'بازیکن تست',role:'player',scenarioCatalog:'released',progress:6}],activeProfileId:'test-player'}))`);
  await send('Page.reload');await delay(1600);await setViewport(1440,900);
  await click('.menu-buttons button',0);await click('.scenario-card:last-child .scenario-actions button:last-child');await click('.intro-modal .primary');await click('.s5-briefing .s5-primary-button');
  await shot('01-first-decision-1440x900.png','R1 before action');
  for(const [w,h] of [[1280,720],[1366,768]])await capture('01-first-decision-'+w+'x'+h+'.png','R1 before action',w,h);
  await setViewport(1440,900);await chooseAction(0);await inspect('R1 selected');await confirm();
  await shot('02-after-action-1440x900.png','R1 post-action recent summary');
  for(const [w,h] of [[1280,720],[1366,768]])await capture('02-after-action-'+w+'x'+h+'.png','R1 post-action recent summary',w,h);
  await setViewport(1440,900);await outcomeContinue();await inspect('A2 prebelief');
  const beforeDisclosure=JSON.stringify(await state()),eventsBeforeDisclosure=await evaluate("localStorage.getItem('space-war.analytics.events')");
  const groupCount=await evaluate("document.querySelectorAll('.s5-information-group').length");
  for(let i=0;i<groupCount;i++)await click('.s5-information-group summary',i);
  for(let i=0;i<groupCount;i++)await click('.s5-information-group summary',i);
  assert(JSON.stringify(await state())===beforeDisclosure,'Grouping mutated telemetry');assert(await evaluate("localStorage.getItem('space-war.analytics.events')")===eventsBeforeDisclosure,'Grouping logged evidence');
  await shot('03-grouped-information-1440x900.png','information grouped by corridor');
  await fillBelief();await chooseAction(0);await confirm();await outcomeContinue();await fillBelief();await summary(0);
  await chooseAction(2);await confirm();await outcomeContinue();await inspect('R4 decision');await chooseAction(1);await confirm();await inspect('B reason');await submitReason();await outcomeContinue();await summary(1);
  await chooseAction(0);await confirm();await outcomeContinue();await chooseAction(2);await confirm();await submitReason();await outcomeContinue();await shot('03b-current-information-picture-1440x900.png','C belief current information grouped');await click('.s5-information-group summary',0);await shot('03c-expanded-corridor-information-1440x900.png','C belief first corridor expanded');await fillBelief();await summary(2);
  await chooseAction(0);await confirm();await outcomeContinue();await inspect('D final belief');await fillBelief();await chooseAction(0);await confirm();await submitReason();
  await shot('04-final-outcome-1440x900.png','R8 consequence');await outcomeContinue();
  await shot('05-mission-ending-1440x900.png','realized mission ending');
  await shot('06-why-this-ending-1440x900.png','why realized ending','#s5-why');
  await shot('07-other-possible-endings-1440x900.png','five alternative endings','.s5-other-endings');
  assert(await evaluate("document.querySelectorAll('.s5-ending-alternative').length")===5,'Other endings count');
  await click('.s5-ending-actions .s5-secondary-button');
  await shot('08-compatibility-cognitive-section-1440x900.png','existing compatibility cognitive section','[data-aar-section=cognitive]');
  const events=await evaluate("JSON.parse(localStorage.getItem('space-war.analytics.events')??'[]')");
  assert(events.filter(e=>e.type==='s5_v3_evidence_opened').length===0,'Passive summary opened evidence');assert(events.filter(e=>e.type==='s5_v3_run_completed').length===1,'Completion log count');
  fs.writeFileSync(outputDir+'/inspection.json',JSON.stringify({status:'PASS',phase:'PHASE 08D.2 — Scenario 2 UI/UX refinement and ending explanation pass',snapshots,layoutChecks,geometry,stableMapAcrossStages:true,groupDisclosuresMutateTelemetry:false,explicitEvidenceOpenCount:0,completionEventCount:1,liveHiddenTruthFirewall:'PASS',endingAlternatives:5},null,2));
  console.log(JSON.stringify({status:'PASS',screenshots:snapshots.length,geometrySamples:geometry.length,stableMapAcrossStages:true},null,2));
} catch(error) {fs.writeFileSync(outputDir+'/inspection.json',JSON.stringify({status:'FAIL',error:String(error)},null,2));throw error;} finally {try{socket?.close();}catch{}chrome.kill();vite.kill();}
