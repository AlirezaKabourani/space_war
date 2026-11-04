import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const before=process.argv.includes('--before');
const outputDir = 'docs/scenario5-c2-refinement-'+(before?'before':'screenshots');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputDir+'/inspection.json',JSON.stringify({status:'RUNNING'}));
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "s5-c2-chrome-"));
const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
].filter(Boolean);
const chromePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));
if (!chromePath) throw new Error("Chrome/Edge executable was not found. Set CHROME_PATH.");

const vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5199"], { stdio: "ignore", windowsHide: true });
const chrome = spawn(chromePath, ["--headless=new", "--remote-debugging-port=9249", `--user-data-dir=${profileDir}`, "--disable-gpu", "--no-first-run", "--no-default-browser-check", "http://127.0.0.1:5199"], { stdio: "ignore", windowsHide: true });
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
  await waitFor("http://127.0.0.1:5199");
  await waitFor("http://127.0.0.1:9249/json");
  const targets = await (await fetch("http://127.0.0.1:9249/json")).json();
  const target = targets.find((item) => item.type === "page" && item.url.startsWith("http://127.0.0.1:5199"));
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
  const shots=[];
  const runtime=()=>evaluate(`(()=>{let f=document.querySelector('.s5-live-shell');if(!f)return null;f=f[Object.keys(f).find(k=>k.startsWith('__reactFiber'))];while(f&&f.type?.name!=='ScenarioFiveSimulation')f=f.return;return f?.memoizedState?.memoizedState;})()`);
  const events=()=>evaluate("localStorage.getItem('space-war.analytics.events')");
  const shot=async(name,w,h,scrollSelector=null)=>{
    await setViewport(w,h);await evaluate('scrollTo(0,0)');if(scrollSelector)await evaluate(`document.querySelector(${JSON.stringify(scrollSelector)}).scrollIntoView({block:'center'})`);await delay(180);
    const state=await runtime();
    const m=await evaluate(`(()=>{const root=document.querySelector('.s5-live-shell'),strip=document.querySelector('.s5-convoy-strip'),map=document.querySelector('.s5-map-frame'),svg=map.querySelector('svg'),t=svg.getScreenCTM(),rect=n=>n?.getBoundingClientRect().toJSON(),doc=document.documentElement;return {width:innerWidth,height:innerHeight,document:{width:doc.scrollWidth,height:doc.scrollHeight},root:rect(root),header:rect(document.querySelector('.s5-command-bar')),strip:{rect:rect(strip),clientHeight:strip.clientHeight,scrollHeight:strip.scrollHeight,clientWidth:strip.clientWidth,scrollWidth:strip.scrollWidth,overflowY:getComputedStyle(strip).overflowY,columns:getComputedStyle(strip).gridTemplateColumns},map:{rect:rect(map),viewBox:svg.getAttribute('viewBox'),matrix:{a:t.a,b:t.b,c:t.c,d:t.d}},cards:[...document.querySelectorAll('[data-convoy-card]')].map(n=>({id:n.dataset.convoyCard,rect:rect(n),height:n.clientHeight,scrollHeight:n.scrollHeight,text:n.innerText,font:getComputedStyle(n.querySelector('p')).fontSize})),expandedConvoys:!!document.querySelector('.s5-convoy-mini details[open]'),options:[...document.querySelectorAll('.s5-action-card')].map(n=>({text:n.innerText,pressed:n.getAttribute('aria-pressed'),rect:rect(n),font:getComputedStyle(n.querySelector('h3')).fontSize})),headerText:document.querySelector('.s5-command-bar').innerText,stop:rect(document.querySelector('.scenario-footer button')),fixedControls:[...document.querySelectorAll('button')].filter(n=>getComputedStyle(n).position==='fixed').map(n=>({text:n.innerText,rect:rect(n)}))};})()`);
    assert(m.cards.length===4,'All four convoy cards');assert(m.document.width<=w,'Horizontal page overflow '+name);assert(Math.abs(m.map.matrix.a-m.map.matrix.d)<.001&&m.map.matrix.b===0&&m.map.matrix.c===0,'Map proportions unchanged');
    if(!before){assert(m.strip.scrollHeight<=m.strip.clientHeight+1&&m.strip.scrollWidth<=m.strip.clientWidth+1,'Convoy panel must size to content '+name);assert(m.strip.overflowY==='visible','No hidden/scroll overflow workaround');for(const c of m.cards){assert(c.scrollHeight<=c.height+1,'Clipped convoy '+c.id);assert(parseFloat(c.font)>=12,'Readable convoy details');}
      if(w>=1600){if(!m.expandedConvoys)assert(m.cards.every(c=>c.rect.top>=0&&c.rect.bottom<=h),'All four cards visible in desktop viewport '+name);assert(m.cards.every(c=>Math.abs(c.rect.top-m.cards[0].rect.top)<1),'Four-column convoy grid');assert(m.map.rect.height>=200,'Operationally readable map');if(!m.expandedConvoys)assert(m.stop.bottom<=h,'Stop button remains inside desktop viewport');}
      const convoys=await evaluate(`(()=>{let f=document.querySelector('.s5-map-panel');f=f[Object.keys(f).find(k=>k.startsWith('__reactFiber'))];while(f&&f.type?.name!=='ScenarioFiveMap')f=f.return;return f.memoizedProps.convoys;})()`);for(const c of convoys){const card=m.cards.find(n=>n.id===c.convoyId);assert(card.text.includes('T+'+c.projectedArrivalMinute)&&card.text.includes('T+'+c.deadlineMinute),'Current arrival/deadline '+c.convoyId);assert(card.text.includes(c.integrity+' / 100'),'Current integrity '+c.convoyId);}
    }
    const img=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});fs.writeFileSync(outputDir+'/'+name+'.png',Buffer.from(img.data,'base64'));shots.push({filename:name+'.png',stage:state?.stage.stageId,...m});fs.writeFileSync(outputDir+'/inspection.json',JSON.stringify({status:'RUNNING',shots},null,2));return m;
  };
  const clickText=async text=>{assert(await evaluate(`(()=>{const n=[...document.querySelectorAll('button')].find(n=>n.textContent.trim()===${JSON.stringify(text)});if(!n)return false;n.click();return true;})()`),'Button '+text);await delay(280);};
  await send('Page.enable');await send('Runtime.enable');
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`Date.now=()=>1793448000000;localStorage.setItem('space-war.profiles.v1',JSON.stringify({profiles:[{id:'test-player',name:'بازیکن تست',role:'player',scenarioCatalog:'released',progress:6}],activeProfileId:'test-player'}));`});
  await send('Page.navigate',{url:'http://127.0.0.1:5199'});await delay(1800);await setViewport(1600,900);await click('.menu-buttons button',0);await click('.scenario-card:last-child .scenario-actions button:last-child');await click('.intro-modal .primary');await click('.s5-briefing .s5-primary-button');
  for(const[w,h]of [[1920,1080],[1600,900],[1366,768]])await shot('01-initial-'+w+'x'+h,w,h);
  if(!before){
    await shot('01b-convoys-scrolled-1366x768',1366,768,'.s5-convoy-strip');await shot('02-mobile-390x844',390,844);await shot('02b-mobile-convoy-details-390x844',390,844,'.s5-convoy-strip');await setViewport(1600,900);
    const beforeInspect=JSON.stringify(await runtime()),beforeEvents=await events();await click('.s5-glossary-control');assert(await evaluate("document.querySelector('.s5-glossary-dialog').open"),'Glossary opens');await clickText('بستن راهنمای اصطلاحات');const stopPending=evaluate("document.querySelector('.scenario-footer button').click()");await delay(180);await send('Page.handleJavaScriptDialog',{accept:false});await stopPending;assert(JSON.stringify(await runtime())===beforeInspect&&await events()===beforeEvents,'Glossary and cancelled stop preserve runtime/events');
    const cardRect=await evaluate("document.querySelector('[data-convoy-card=alpha]').getBoundingClientRect().toJSON()");
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:cardRect.x+20,y:cardRect.y+20});await delay(100);
    assert(await evaluate("getComputedStyle(document.querySelector('[data-convoy-route=alpha]')).strokeWidth==='5px'"),'Card hover highlights correct route');
    await shot('03-convoy-hover-1600x900',1600,900);
    assert(JSON.stringify(await runtime())===beforeInspect&&await events()===beforeEvents,'Hover never changes runtime or telemetry');
    const markerRect=await evaluate("document.querySelector('[data-convoy-id=beta]').getBoundingClientRect().toJSON()");
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:markerRect.x+markerRect.width/2,y:markerRect.y+markerRect.height/2});await delay(100);
    assert(await evaluate("getComputedStyle(document.querySelector('[data-convoy-card=beta]')).borderTopColor==='rgb(125, 229, 245)'"),'Map hover highlights corresponding card');
    assert(JSON.stringify(await runtime())===beforeInspect&&await events()===beforeEvents,'Map inspection passive');
    await evaluate("document.querySelector('.s5-action-card').focus()");assert(await evaluate("getComputedStyle(document.querySelector('.s5-action-card')).outlineStyle==='solid'"),'Keyboard focus visible');
    const decisionLayouts=[];const choose=async index=>{await click('.s5-action-card',index);if(await evaluate("!!document.querySelector('.s5-target-picker select')")){assert(await evaluate("document.querySelector('.s5-decision-actions .s5-primary-button').disabled"),'Target required before confirmation');await click('.s5-map-target:not(:disabled)',0);assert(await evaluate("document.querySelector('.s5-target-picker select').value!==''"),'Map-to-card target selection preserved');}const stage=(await runtime()).stage.stageId;decisionLayouts.push(await shot('selected-'+stage.replaceAll(':','-'),1600,900));};
    const confirm=()=>click('.s5-decision-actions .s5-primary-button'),next=()=>click('.s5-outcome-panel .s5-primary-button');
    const belief=async()=>{await click('.s5-corridor-card input',1);for(const[i,key]of ['ArrowRight','End','Home'].entries()){await evaluate(`document.querySelectorAll('.s5-belief-range')[${i}].focus()`);await send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key});}await click('.s5-belief-panel .s5-primary-button');};
    const reason=async()=>{await click('.s5-reason-options input',0);await click('.s5-form-panel .s5-primary-button');};
    const phase=async()=>{if(await evaluate("!!document.querySelector('.s5-phase-summary')"))await click('.s5-phase-summary .s5-primary-button');};
    await choose(0);await shot('04-selected-action-1600x900',1600,900);await confirm();await shot('05-outcome-1600x900',1600,900);await next();
    for(const[w,h]of [[1600,900],[1366,768]])await shot('06-belief-'+w+'x'+h,w,h);await setViewport(1600,900);await belief();
    await choose(0);await confirm();await next();await belief();await phase();
    const beforeEvidence=await runtime();await click('.s5-evidence-access');await shot('07-evidence-1600x900',1600,900);await click('.s5-evidence-card .s5-secondary-button',0);await click('.s5-evidence-card .s5-secondary-button',0);await click('.s5-back-to-decision');assert((await runtime()).stage.stageId===beforeEvidence.stage.stageId,'Evidence navigation preserves stage');
    await choose(2);await confirm();await next();await choose(1);await confirm();await reason();await next();
    await shot('08-phase-summary-1600x900',1600,900);await phase();
    for(const[w,h]of [[1920,1080],[1600,900],[1366,768]])await shot('09-updated-convoys-'+w+'x'+h,w,h);await setViewport(1600,900);
    await evaluate("document.querySelectorAll('.s5-convoy-mini details').forEach(n=>n.open=true)");await shot('10-all-convoy-evidence-expanded-1600x900',1600,900);await shot('10b-expanded-convoy-details-scrolled-1600x900',1600,900,'.s5-convoy-strip');await evaluate("document.querySelectorAll('.s5-convoy-mini details').forEach(n=>n.open=false)");
    await choose(0);await confirm();await next();await choose(2);await confirm();await reason();await next();await belief();await phase();
    await choose(0);await confirm();await next();await belief();await choose(0);await confirm();await reason();await next();
    assert(await evaluate("!!document.querySelector('.s5-ending')"),'Full scenario completion');await clickText('مشاهده الگوی تصمیم‌گیری');assert(await evaluate("!!document.querySelector('[data-cognitive-run]')"),'Cognitive dashboard intact');await clickText('بازگشت به گزارش مأموریت');await clickText('مشاهده الگوی تصمیم‌گیری');await clickText('پایان سناریو');
  }
  fs.writeFileSync(outputDir+'/inspection.json',JSON.stringify({status:'PASS',before,shots,provenance:'Real product UI; no runtime injection',fullEightDecisionFlow:!before,passiveMapInspection:!before,glossaryOpenClose:!before,stopConfirmationAndCancel:!before},null,2));console.log(JSON.stringify({status:'PASS',before,screenshots:shots.length}));
}catch(error){fs.writeFileSync(outputDir+'/inspection.json',JSON.stringify({status:'FAIL',error:String(error),stack:error.stack,partialShots:JSON.parse(fs.readFileSync(outputDir+'/inspection.json','utf8')).shots},null,2));throw error;}finally{try{socket?.close();}catch{}chrome.kill();vite.kill();}
