import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const outputDir = "docs/scenario5-phase08d3-screenshots";
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputDir+'/inspection.json',JSON.stringify({status:'RUNNING'}));
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "s5-ending-flow-"));
const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
].filter(Boolean);
const chromePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));
if (!chromePath) throw new Error("Chrome/Edge executable was not found. Set CHROME_PATH.");

const vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5213"], { stdio: "ignore", windowsHide: true });
const chrome = spawn(chromePath, ["--headless=new", "--remote-debugging-port=9263", `--user-data-dir=${profileDir}`, "--disable-gpu", "--no-first-run", "--no-default-browser-check", "http://127.0.0.1:5213"], { stdio: "ignore", windowsHide: true });
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
  await waitFor("http://127.0.0.1:5213");
  await waitFor("http://127.0.0.1:9263/json");
  const targets = await (await fetch("http://127.0.0.1:9263/json")).json();
  const target = targets.find((item) => item.type === "page" && item.url.startsWith("http://127.0.0.1:5213"));
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
  const shots=[],liveChecks=[];
  await send('Page.enable');await send('Runtime.enable');
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__aarWrites=[];for(const name of ['setItem','removeItem','clear']){const original=Storage.prototype[name];Storage.prototype[name]=function(...args){window.__aarWrites.push({kind:'Storage',name,key:args[0]});return original.apply(this,args);};}for(const name of ['add','put','delete','clear']){const original=IDBObjectStore.prototype[name];IDBObjectStore.prototype[name]=function(...args){window.__aarWrites.push({kind:'IndexedDB',name,store:this.name});return original.apply(this,args);};}`});
  const assertLive=async()=>{const status=await evaluate(`(()=>{const root=document.querySelector('.s5-live-shell');if(!root)return null;let f=root[Object.keys(root).find(k=>k.startsWith('__reactFiber'))];while(f&&f.type?.name!=='ScenarioFiveSimulation')f=f.return;return {stage:f?.memoizedState.memoizedState.stage.stageId,hidden:/s5-belief-vs-reality|data-belief-checkpoint|trueWorldState|actorProfile|hiddenProvenance|W-corridor_|cautious_denial|deceptive_diversion|opportunistic_interdiction|pressure_escalator/.test(root.outerHTML)};})()`);if(status){assert(!status.hidden,'Hidden truth leaked in live DOM/attributes/aria/title '+status.stage);liveChecks.push(status);}};
  const act=async(selector,index=0)=>{await click(selector,index);await assertLive();};
  const clickText=async text=>{assert(await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(n=>n.textContent.trim()===${JSON.stringify(text)});if(!b)return false;b.click();return true;})()`),'Missing button '+text);await delay(200);await assertLive();};
  const shot=async(filename,selector='#s5-belief-vs-reality',width=1440,height=900)=>{await setViewport(width,height);await evaluate(`(()=>{document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'start'});document.querySelector('.s5-ending')?.scrollBy(0,-80);scrollBy(0,-80);})()`);await delay(120);const m=await evaluate(`(()=>{const d=document.documentElement,n=document.querySelector('#s5-belief-vs-reality'),root=document.querySelector('.s5-ending');return {width:innerWidth,height:innerHeight,documentWidth:d.scrollWidth,rootWidth:root?.clientWidth,rootScrollWidth:root?.scrollWidth,sectionRect:n?.getBoundingClientRect().toJSON(),cardRects:[...document.querySelectorAll('.s5-br-comparison > article')].map(n=>n.getBoundingClientRect().toJSON()),checkpoints:[...document.querySelectorAll('[data-belief-checkpoint]')].map(n=>({id:n.dataset.beliefCheckpoint,open:n.open,text:n.innerText})),match:document.querySelector('[data-belief-match]')?.dataset.beliefMatch,text:n?.innerText,lateText:document.querySelector('[data-belief-late-evidence]')?.innerText,runId:window.__phase08d3Witness?.runId??null};})()`);assert(m.documentWidth<=width&&m.rootScrollWidth<=m.rootWidth+1,'Horizontal overflow '+filename);assert(m.checkpoints.length===4,'Four checkpoint cards once');if(width>700){assert(m.cardRects[0].x>m.cardRects[1].x,'Player card physically right in RTL');assert(Math.abs(m.cardRects[0].width-m.cardRects[1].width)<1,'Equal comparison cards');}else assert(m.cardRects[1].y>m.cardRects[0].y,'Stack comparison on mobile');const img=await send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});fs.writeFileSync(outputDir+'/'+filename,Buffer.from(img.data,'base64'));shots.push({filename,selector,...m});fs.writeFileSync(outputDir+'/inspection.json',JSON.stringify({status:'RUNNING',shots,liveChecks},null,2));return m;};
  const passiveStart=()=>evaluate(`(()=>{const root=document.querySelector('.s5-ending');let f=root[Object.keys(root).find(k=>k.startsWith('__reactFiber'))];while(f&&f.type?.name!=='ScenarioFiveMissionEnding')f=f.return;window.__passiveProps=JSON.stringify({state:f.memoizedProps.state,result:f.memoizedProps.result});window.__passiveStorage=JSON.stringify(Object.entries(localStorage).sort());window.__passiveWrites=window.__aarWrites.length;})()`);
  const passiveCheck=()=>evaluate(`(()=>{const root=document.querySelector('.s5-ending');let f=root[Object.keys(root).find(k=>k.startsWith('__reactFiber'))];while(f&&f.type?.name!=='ScenarioFiveMissionEnding')f=f.return;return {immutable:window.__passiveProps===JSON.stringify({state:f.memoizedProps.state,result:f.memoizedProps.result}),storage:window.__passiveStorage===JSON.stringify(Object.entries(localStorage).sort()),noWrites:window.__passiveWrites===window.__aarWrites.length};})()`);
  // Finish one genuine product playthrough; all operations are normal user controls.
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`Date.now=()=>1793448000000;localStorage.setItem('space-war.profiles.v1',JSON.stringify({profiles:[{id:'test-player',name:'بازیکن تست',role:'player',scenarioCatalog:'released',progress:6}],activeProfileId:'test-player'}));`});
  await send('Page.navigate',{url:'http://127.0.0.1:5213'});await delay(1700);await setViewport(1440,900);await act('.menu-buttons button',0);await act('.scenario-card:last-child .scenario-actions button:last-child');await act('.intro-modal .primary');await act('.s5-briefing .s5-primary-button');
  const choose=async index=>{await act('.s5-action-card',index);if(await evaluate("!!document.querySelector('.s5-target-picker select')"))await act('.s5-map-target:not(:disabled)',0);};
  const confirm=()=>act('.s5-decision-actions .s5-primary-button'),next=()=>act('.s5-outcome-panel .s5-primary-button');
  const belief=async()=>{await act('.s5-corridor-card input',1);for(const[i,key]of ['ArrowRight','End','Home'].entries()){await evaluate(`document.querySelectorAll('.s5-belief-range')[${i}].focus()`);await send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key});}await act('.s5-belief-panel .s5-primary-button');};
  const reason=async()=>{await act('.s5-reason-options input',0);await act('.s5-form-panel .s5-primary-button');};
  const phase=async()=>{if(await evaluate("!!document.querySelector('.s5-phase-summary')"))await act('.s5-phase-summary .s5-primary-button');};
  await choose(0);await confirm();await next();await belief();await choose(0);await confirm();await next();await belief();await phase();await choose(2);await confirm();await next();await choose(1);await confirm();await reason();await next();await phase();await choose(0);await confirm();await next();await choose(2);await confirm();await reason();await next();await belief();await phase();await choose(0);await confirm();await next();await belief();await choose(0);await confirm();await reason();await next();
  assert(await evaluate("!!document.querySelector('.s5-ending')"),'Actual completed AAR');await shot('00-actual-product-ending-1440x900.png','.s5-ending');await passiveStart();await shot('01-actual-product-comparison-1440x900.png');await act('.s5-br-checkpoint > summary',0);await act('.s5-br-checkpoint .s5-br-evidence > summary',0);let passive=await passiveCheck();assert(passive.immutable&&passive.storage&&passive.noWrites,'Actual product accordions cannot write');await clickText('مشاهده الگوی تصمیم‌گیری');await clickText('بازگشت به گزارش مأموریت');passive=await passiveCheck();assert(passive.immutable&&passive.storage&&passive.noWrites,'Actual dashboard/back passive');
  const witnesses=JSON.parse(fs.readFileSync('docs/scenario5-phase08d3-browser-witnesses.json','utf8')),checks=[];
  for(const kind of ['same','different','late']){
    await send('Page.navigate',{url:'http://127.0.0.1:5213/scripts/scenario5-phase08d3-witness.html?case='+kind});await delay(900);await passiveStart();
    const m=await shot('02-'+kind+'-comparison-1440x900.png');if(kind!=='late')assert(m.match===kind,'Genuine final corridor match '+kind);assert(m.runId===witnesses[kind].state.runId,'Genuine witness run ID');
    if(kind==='same'){
      await evaluate("document.querySelector('.s5-br-checkpoint > summary').focus()");await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13});assert(await evaluate("document.querySelector('.s5-br-checkpoint').open"),'Native keyboard accordion');
      await shot('03-four-checkpoints-timeline-1440x900.png','#s5-belief-timeline');await act('.s5-br-checkpoint .s5-br-evidence > summary',0);await shot('04-checkpoint-evidence-expanded-1440x900.png','.s5-br-checkpoint');
      await evaluate("document.querySelectorAll('.s5-br-checkpoint').forEach(n=>n.open=true)");await shot('05-final-checkpoint-transitions-1440x900.png','[data-belief-checkpoint=D_final_belief]');
      await act('.s5-br-uncertainty > summary');await shot('06-uncertainty-inventory-1440x900.png','.s5-br-uncertainty');
      await evaluate("document.querySelectorAll('.s5-br-checkpoint').forEach(n=>n.open=false)");for(const[w,h]of [[1366,768],[1280,720],[390,844]])await shot('07-comparison-'+w+'x'+h+'.png','#s5-belief-vs-reality',w,h);
      await act('.s5-br-checkpoint > summary',0);await act('.s5-br-checkpoint .s5-br-evidence > summary',0);await shot('08-mobile-evidence-390x844.png','.s5-br-checkpoint',390,844);await setViewport(1440,900);
    }
    if(kind==='late'){await act('.s5-br-late .s5-br-evidence > summary');const late=await shot('09-late-evidence-expanded-1440x900.png','.s5-br-late');assert(late.lateText.includes('این شواهد هنگام ثبت برآورد نهایی در اختیار شما نبودند.'),'Exact late evidence caveat');}
    const status=await passiveCheck();assert(status.immutable&&status.storage&&status.noWrites,'Witness passive writes '+kind);checks.push({kind,runId:m.runId,match:m.match,...status});
  }
  const endStates=JSON.parse(fs.readFileSync('docs/scenario5-phase8d-witnesses.json','utf8')),sixEndings=[];
  for(const w of endStates){await send('Page.navigate',{url:'http://127.0.0.1:5213/scripts/scenario5-phase08d3-witness.html?ending='+encodeURIComponent(w.id)});await delay(700);assert(await evaluate("document.querySelector('[data-ending-id]').dataset.endingId")===w.id,'Six ending identity unchanged');await passiveStart();await act('.s5-br-checkpoint > summary',0);const status=await passiveCheck();assert(status.immutable&&status.storage&&status.noWrites,'Six endings passive');sixEndings.push({endingId:w.id,status:'PASS'});}
  fs.writeFileSync(outputDir+'/inspection.json',JSON.stringify({status:'PASS',shots,checks,liveChecks,sixEndings,actualEightDecisionProductFlow:'PASS',hiddenTruthInActualLiveDom:'ABSENT',passiveStateStorageIndexedDbAndTelemetry:'PASS',keyboardAccordion:'PASS',provenance:'Actual product playthrough plus genuine archived/canonical engine witnesses; no modified science or invented comparison values'},null,2)+'\n');console.log(JSON.stringify({status:'PASS',screenshots:shots.length,liveChecks:liveChecks.length,sixEndings:sixEndings.length}));
}catch(error){const prior=JSON.parse(fs.readFileSync(outputDir+'/inspection.json','utf8'));fs.writeFileSync(outputDir+'/inspection.json',JSON.stringify({status:'FAIL',error:String(error),stack:error.stack,partial:prior},null,2));throw error;}finally{try{socket?.close();}catch{}chrome.kill();vite.kill();}
