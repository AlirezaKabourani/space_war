import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const outputDir = "docs/scenario5-current-flow-screenshots";
fs.mkdirSync(outputDir, { recursive: true });
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "s5-phase7c-chrome-"));
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
    const clicked = await evaluate(`(() => { const node = document.querySelectorAll(${JSON.stringify(selector)})[${index}]; if (!node) return false; node.click(); return true; })()`);
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
  const capture = async (filename, width, height, stage) => {
    await setViewport(width, height);
    await evaluate("scrollTo(0, 0)");
    const metrics = await inspect();
    const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, fromSurface: true });
    fs.writeFileSync(`${outputDir}/${filename}`, Buffer.from(shot.data, "base64"));
    return metrics;
  };
  const assert=(condition,message)=>{if(!condition)throw new Error(message);};
  const audit=JSON.parse(fs.readFileSync('docs/scenario5-current-audit-data.json','utf8'));
  const balanced=audit.runs.find((run)=>run.policyId==='balanced_network');
  const manifest=[]; const observations=[]; const failures=[];
  const getStateExpression=`(() => {
    const root=document.querySelector('.s5-root');if(!root)return null;
    const key=Object.keys(root).find((key)=>key.startsWith('__reactFiber'));let fiber=root[key];
    while(fiber && fiber.type?.name!=='ScenarioFiveSimulation')fiber=fiber.return;
    if(!fiber)return null;
    return fiber.memoizedState?.memoizedState ?? null;
  })()`;
  const inspect=async()=>evaluate(`(() => {
    const runtime=${getStateExpression};
    const doc=document.documentElement;const pane=document.querySelector('.s5-control-pane .s5-control-scroll');
    const box=(selector)=>document.querySelector(selector)?.getBoundingClientRect().toJSON()??null;
    const map=document.querySelector('.s5-map-pane');
    const text=document.querySelector('.s5-root')?.innerText??document.body.innerText;
    const expected=runtime?.missionState;
    const markers=[...document.querySelectorAll('.s5-convoy-marker')].map((node)=>({id:node.dataset.convoyId,statusClass:node.getAttribute('class'),progress:Number(node.dataset.visualProgress),transform:node.style.transform}));
    return {runtimeStageId:runtime?.stage.stageId??(document.querySelector('.intro-modal')?'outer_intro':document.querySelector('.s5-briefing')?'briefing':document.body.innerText.includes('پایان مرحله')?'outer_end':'scenario_card'),
      phase:runtime?(runtime.stage.stageId.startsWith('decision:')?runtime.stage.stageId.split(':')[1][0]:runtime.pendingDecision?.phaseId??runtime.domainDecisionRecords.at(-1)?.windowId[0]??'A'):null,
      round:runtime?(runtime.stage.stageId.startsWith('decision:')?runtime.missionState.currentRound:runtime.pendingDecision?.roundId??runtime.domainDecisionRecords.at(-1)?.roundId??runtime.missionState.currentRound):null,
      playerFacingTitle:document.querySelector('#s5-outcome-title,#s5-belief-title,#s5-reason-title,.s5-root h1,.intro-modal h3,.scenario-play-card h2')?.textContent??'انتخاب سناریو',
      visibleEvidenceCount:runtime?.evidence.length??0,selectedAction:runtime?.currentSelectionHistory.at(-1)?.actionId??runtime?.pendingDecision?.selection.actionId??null,
      pageScrollDimensions:{scrollHeight:doc.scrollHeight,clientHeight:doc.clientHeight,scrollWidth:doc.scrollWidth,clientWidth:doc.clientWidth},
      leftPaneScrollDimensions:pane?{scrollHeight:pane.scrollHeight,clientHeight:pane.clientHeight,scrollTop:pane.scrollTop,overflowY:getComputedStyle(pane).overflowY}:null,
      mapVisible:!!map&&map.getBoundingClientRect().height>0&&!document.querySelector('.s5-outcome-dialog[open]'),mapMounted:!!map,mapBounds:box('.s5-map-pane'),
      rootText:text,headerClock:document.querySelectorAll('.s5-command-chip strong')[2]?.textContent??null,
      remainingTime:document.querySelectorAll('.s5-command-chip strong')[3]?.textContent??null,
      convoyCardTexts:[...document.querySelectorAll('.s5-convoy-mini')].map((node)=>node.innerText),markers,
      evidenceBadgeTexts:[...document.querySelectorAll('.s5-route-evidence-badge text')].map((node)=>node.textContent),
      evidenceCountLeft:document.querySelector('.s5-evidence-access')?.textContent??null,
      sliders:[...document.querySelectorAll('.s5-belief-range')].map((node)=>({value:node.value,aria:node.getAttribute('aria-valuetext'),untouched:node.classList.contains('s5-untouched')})),
      beliefs:runtime?.beliefs??[],mission:expected?{worldClockMinutes:expected.worldClockMinutes,currentRound:expected.currentRound,resources:expected.resources,convoys:expected.convoys}:null,
      evidence:runtime?.evidence??[],worldAudit:expected?{worldId:expected.trueWorldState.worldId,seed:expected.trueWorldState.seed,actorProfile:expected.trueWorldState.actorProfileId,primaryCorridor:expected.trueWorldState.primaryAffectedCorridorId}:null,
      domainRecords:runtime?.domainDecisionRecords??[],stageId:runtime?.stage.stageId??null,
    };
  })()`);
  let priorProgress={};let precommitIds=[];
  const checkDom=async(metrics)=>{
    const state=metrics.mission;if(!state)return;
    const fail=(id,condition,detail)=>{if(!condition)failures.push({id,stage:metrics.runtimeStageId,detail});};
    if(metrics.stageId!=='complete'){
      fail('A',metrics.headerClock===`T+${state.worldClockMinutes}`,'header vs runtime');
      fail('B',metrics.remainingTime===`${Math.max(0,360-state.worldClockMinutes)}′`,'remaining vs horizon');
      for(const [index,c]of state.convoys.entries()){
        const card=metrics.convoyCardTexts[index]; const eta=c.baselineArrivalMinute+c.delayMinutes;
        fail('C',card.includes(`ETA T+${eta}`),c.convoyId);fail('D',card.includes(`D T+${c.deadlineMinute}`),c.convoyId);
        fail('E',card.includes(`یکپارچگی ${c.integrity}`),c.convoyId);fail('F',card.includes(`تأخیر ${c.delayMinutes}`),c.convoyId);
        const marker=metrics.markers.find((m)=>m.id===c.convoyId);fail('G',marker.statusClass.includes(`s5-status-${c.status}`),c.convoyId);
        const desired=c.status==='delivered'?1:Math.min(.97,Math.max(0,state.worldClockMinutes/Math.max(eta,1)));
        const expected=c.status==='delivered'?1:c.status==='held'?(priorProgress[c.convoyId]??desired):Math.max(priorProgress[c.convoyId]??desired,desired);
        fail('H',Math.abs(expected-marker.progress)<1e-9,c.convoyId);priorProgress[c.convoyId]=marker.progress;
      }
      const counts=state.convoys.map((c)=>metrics.evidence.filter((e)=>e.observedCorridorId===c.corridorId).length).filter(Boolean);
      fail('I',JSON.stringify(counts)===JSON.stringify(metrics.evidenceBadgeTexts.map((text)=>Number(text.replace('شاهد ','')))),'route badge counts');
      if(metrics.evidenceCountLeft)fail('J',metrics.evidenceCountLeft.includes(`(${metrics.evidence.length})`),'left evidence count');
      if(metrics.stageId==='outcome_review'){
        const fresh=metrics.evidence.filter((e)=>!precommitIds.includes(e.evidenceId));
        const rec=metrics.domainRecords.at(-1);
        fail('K',fresh.length===rec.newVisibleEvidenceIds.length,'outcome snapshot difference');
        if(fresh.length)fail('K',metrics.rootText.includes(`${fresh.length} شاهد تازه`),'outcome displayed count');
      }
    }
  };
  const snap=async(filename,notes='')=>{
    await delay(900);const metrics=await capture(filename,1440,900,'audit');
    await checkDom(metrics);
    const {rootText,mission,evidence,worldAudit,domainRecords,beliefs,convoyCardTexts,markers,sliders,...publicManifest}=metrics;
    manifest.push({filename,...publicManifest,notes});observations.push({filename,...metrics});
    return metrics;
  };
  const selectAction=async(round)=>{
    const requested=balanced.decisionTrace.find((d)=>d.roundId===round).actualActionId;
    const title=audit.copy.SCENARIO5_ACTION_COPY_FA[requested].title;
    const selected=await evaluate(`(() => { const button=[...document.querySelectorAll('.s5-action-card')].find((node)=>node.querySelector('h3').textContent===${JSON.stringify(title)});if(!button)return false;button.click();return true;})()`);
    assert(selected,'Requested balanced action not available');await delay(160);
    await evaluate(`(() => {const select=document.querySelector('.s5-target-picker select');if(select){Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(select,[...select.options].find(o=>o.value).value);select.dispatchEvent(new Event('change',{bubbles:true}));}})()`);
    await delay(100);
    precommitIds=(await inspect()).evidence.map((e)=>e.evidenceId);
  };
  const fillBelief=async()=>{
    await click('.s5-corridor-card input',1);
    for(const [index,key]of ['ArrowRight','End','Home'].entries()){
      await evaluate(`document.querySelectorAll('.s5-belief-range')[${index}].focus()`);
      await send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key});
    }
    await delay(150);
    assert(await evaluate(`!document.querySelector('.s5-form-panel .s5-primary-button').disabled`),'Belief submit gate did not open');
  };
  await send('Page.enable');await send('Runtime.enable');
  await send('Page.navigate',{url:'http://127.0.0.1:5196'});await delay(1500);
  await send('Page.addScriptToEvaluateOnNewDocument',{source:'Date.now=()=>1793448000000;'});
  await evaluate(`localStorage.setItem('space-war.profiles.v1',JSON.stringify({profiles:[{id:'test-player',name:'بازیکن تست',role:'player',scenarioCatalog:'released',progress:6}],activeProfileId:'test-player'}))`);
  await send('Page.reload');await delay(1600);await setViewport(1440,900);
  await click('.menu-buttons button',0);await click('.scenario-card:last-child .scenario-actions .secondary');
  await snap('01-scenario2-card-details.png','Released catalog: display scenario 2, internal id=5; expanded details.');
  await click('.scenario-card:last-child .scenario-actions button:last-child');await snap('02-outer-intro.png');
  await click('.intro-modal .primary');await snap('03-internal-briefing.png');
  await click('.s5-briefing .s5-primary-button');
  for(let round=1;round<=8;round++){
    const names={1:'04-r1-decision.png',2:'07-r2-decision.png',3:'11-r3-decision.png',4:'13-r4-decision.png',5:'16-r5-decision.png',6:'18-r6-decision.png',7:'22-r7-decision.png',8:'25-r8-decision.png'};
    const decision=await snap(names[round]);assert(decision.runtimeStageId.startsWith('decision:'),'Expected decision stage');
    if(round===1){await click('.s5-glossary-control');await snap('29-live-glossary.png','Informational modal; no runtime stage change.');await click('.s5-glossary-dialog .s5-secondary-button');}
    await selectAction(round);
    if(round===2){await click('.s5-evidence-access');await snap('08-r2-evidence-view.png','Collapsed visible evidence summaries.');await click('.s5-evidence-card .s5-secondary-button',0);await snap('30-r2-evidence-expanded.png','Only visible quality/limitation exposed.');await click('.s5-back-to-decision');}
    await click('.s5-decision-actions .s5-primary-button');
    if([4,6,8].includes(round)){
      await snap(({4:'14-b-reason.png',6:'19-c-reason.png',8:'26-d-reason.png'})[round]);
      await click('.s5-reason-options input',0);await click('.s5-form-panel .s5-primary-button');
    }
    await snap(({1:'05-r1-outcome.png',2:'09-r2-outcome.png',3:'12-r3-outcome.png',4:'15-r4-outcome.png',5:'17-r5-outcome.png',6:'20-r6-outcome.png',7:'23-r7-outcome.png',8:'27-r8-outcome.png'})[round]);
    await click('.s5-outcome-modal .s5-primary-button');
    if([1,2,6,7].includes(round)){
      const checkpoint=await snap(({1:'06-a2-prebelief.png',2:'10-a2-postbelief.png',6:'21-c-belief.png',7:'24-d-final-belief.png'})[round]);
      assert(checkpoint.sliders.every((s)=>s.untouched&&s.aria==='ثبت نشده'),'Belief checkpoint not initially null');
      await fillBelief();if(round===1)await snap('31-a2-prebelief-entered.png','Actual submitted values: beta corridor; 51/100/0.');
      await click('.s5-form-panel .s5-primary-button');
      const b=(await inspect()).beliefs.at(-1);assert(b.mostLikelyCorridorId==='corridor_beta_south'&&b.corridorConfidence===51&&b.targetedInterferenceEstimate===100&&b.targetedInterferenceConfidence===0,'O/P actual UI payload mismatch');
    }
  }
  await snap('28-aar-overview.png');
  const completed=await inspect();assert(completed.runtimeStageId==='complete','Run did not complete');
  const aarResultMatchesRuntime=await evaluate(`(async()=>{
    const root=document.querySelector('.s5-aar');const key=Object.keys(root).find((key)=>key.startsWith('__reactFiber'));
    let fiber=root[key];while(fiber&&fiber.type?.name!=='ScenarioFiveSummary')fiber=fiber.return;
    const api=await import('/src/ui/components/scenario/scenario-five/model/runtime/index.ts');
    return JSON.stringify(api.calculateScenario5RuntimeResult(fiber.memoizedProps.runtimeState))===JSON.stringify(fiber.memoizedProps.result);
  })()`);
  assert(aarResultMatchesRuntime,'Q actual mounted AAR result mismatches current runtime');
  for(const section of ['truth','belief','evidence','decisions','domain','cognitive','limitations']){
    await evaluate(`document.querySelector('[data-aar-section="${section}"]').scrollIntoView({block:'start'})`);
    // Capture helper normally resets window scroll; take these directly to retain the section position.
    const filename=`32-aar-${section}.png`;const metrics=await inspect();
    const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});fs.writeFileSync(`${outputDir}/${filename}`,Buffer.from(shot.data,'base64'));
    manifest.push({filename,runtimeStageId:'complete',phase:'D',round:8,playerFacingTitle:`AAR ${section}`,visibleEvidenceCount:metrics.visibleEvidenceCount,selectedAction:null,pageScrollDimensions:metrics.pageScrollDimensions,leftPaneScrollDimensions:null,mapVisible:false,notes:'Current AAR section; page scrolled to existing section.'});
  }
  await click('.s5-finish-button');await snap('33-outer-end-screen.png','Actual post-AAR ScenarioRunner end node; outside S5 runtime.');
  fs.writeFileSync(`${outputDir}/manifest.json`,JSON.stringify({browser:path.basename(chromePath),viewport:{width:1440,height:900},deterministicEpoch:1793448000000,observedWorld:completed.worldAudit,screenshots:manifest,syncFailures:failures,allRequiredScreenshotsPresent:true,aarResultMatchesRuntime,notes:'Hidden world metadata below belongs to research only; no gameplay source was changed.'},null,2));
  fs.writeFileSync(`${outputDir}/observations.json`,JSON.stringify(observations,null,2));
  console.log(JSON.stringify({screenshots:manifest.length,syncFailures:failures.length,outputDir},null,2));
} finally {try{socket?.close();}catch{}chrome.kill();vite.kill();}
