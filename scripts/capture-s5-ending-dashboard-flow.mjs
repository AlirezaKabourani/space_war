import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const outputDir = "docs/scenario5-ending-dashboard-flow-screenshots";
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

const vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5211"], { stdio: "ignore", windowsHide: true });
const chrome = spawn(chromePath, ["--headless=new", "--remote-debugging-port=9261", `--user-data-dir=${profileDir}`, "--disable-gpu", "--no-first-run", "--no-default-browser-check", "http://127.0.0.1:5211"], { stdio: "ignore", windowsHide: true });
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
  await waitFor("http://127.0.0.1:5211");
  await waitFor("http://127.0.0.1:9261/json");
  const targets = await (await fetch("http://127.0.0.1:9261/json")).json();
  const target = targets.find((item) => item.type === "page" && item.url.startsWith("http://127.0.0.1:5211"));
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
  const results=[];
  const capture=async filename=>{const img=await send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});fs.writeFileSync(outputDir+'/'+filename,Buffer.from(img.data,'base64'));};
  const clickText=async text=>{const ok=await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(n=>n.textContent.trim()===${JSON.stringify(text)});if(!b)return false;b.click();return true;})()`);assert(ok,'Button missing: '+text);await delay(150);};
  await send('Page.enable');await send('Runtime.enable');await setViewport(1440,900);
  const witnesses=JSON.parse(fs.readFileSync('docs/scenario5-phase8d-witnesses.json','utf8'));
  for(const[index,w]of witnesses.entries()){
    await send('Page.navigate',{url:'http://127.0.0.1:5211/scripts/scenario5-phase09c2-witness.html?id='+encodeURIComponent(w.id)});await delay(1000);
    const ending=await evaluate(`(()=>{const root=document.querySelector('.s5-ending'),b=root?.querySelector('.s5-ending-actions button');return {id:root?.dataset.endingId,alternatives:!!root?.querySelector('.s5-other-endings'),alternativeText:root?.innerText.includes('پایان‌های دیگر که ممکن بود رخ دهند'),directFinish:root?.innerText.includes('ثبت پایان و بازگشت')||root?.innerText.includes('پایان سناریو'),actionCount:root?.querySelectorAll('.s5-ending-actions button').length,cta:{label:b?.textContent,primary:b?.classList.contains('s5-primary-button'),disabled:b?.disabled,background:b?getComputedStyle(b).backgroundImage:null},traceCount:root?.querySelectorAll('#s5-trace > details').length,finished:window.__phase09c2Witness.finished};})()`);
    assert(ending.id===w.id,'Realized ending identity');assert(!ending.alternatives&&!ending.alternativeText,'Alternative endings must be absent, not hidden');assert(!ending.directFinish&&ending.actionCount===1,'No completion action before dashboard');assert(ending.cta.primary&&!ending.cta.disabled&&ending.cta.background.includes('linear-gradient'),'Active primary CTA');assert(ending.traceCount===8,'Keep full decision trace');assert(ending.finished===0,'No premature completion');
    const events=await evaluate("localStorage.getItem('space-war.analytics.events')");
    if(index===0){await evaluate("document.querySelector('.s5-ending-actions').scrollIntoView({block:'end'})");await capture('01-ending-footer-primary-1440x900.png');}
    await clickText('مشاهده الگوی تصمیم‌گیری');assert(await evaluate("document.querySelector('[data-cognitive-run]').dataset.cognitiveRun")===w.state.runId,'Dashboard is same run');assert(await evaluate('window.__phase09c2Witness.finished')===0,'Viewing dashboard does not finish run');
    if(index===0)await capture('02-dashboard-with-finish-1440x900.png');
    await clickText('بازگشت به گزارش مأموریت');assert(await evaluate("!document.querySelector('.s5-ending').innerText.includes('ثبت پایان و بازگشت')&&!document.querySelector('.s5-other-endings')"),'Back does not expose a mission-page exit');
    if(index===0){await setViewport(390,844);await evaluate("document.querySelector('.s5-ending-actions').scrollIntoView({block:'end'})");await capture('03-ending-footer-primary-390x844.png');assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Mobile overflow');await setViewport(1440,900);}
    await clickText('مشاهده الگوی تصمیم‌گیری');assert(await evaluate("localStorage.getItem('space-war.analytics.events')")===events,'Passive navigation unchanged');await clickText('پایان سناریو');assert(await evaluate('window.__phase09c2Witness.finished')===1,'Complete exactly once from dashboard');assert(await evaluate("!!document.querySelector('[data-test-finished]')"),'Completion callback exited view');
    results.push({endingId:w.id,ending,entryBackReentry:'PASS',sameRunDashboard:'PASS',passiveNavigation:'PASS',finishOnlyAfterDashboard:'PASS'});
  }
  fs.writeFileSync(outputDir+'/inspection.json',JSON.stringify({status:'PASS',source:'Six genuine archived completed runs rendered through production ScenarioFiveSummary; isolated TEST WITNESS page',results,screenshots:['01-ending-footer-primary-1440x900.png','02-dashboard-with-finish-1440x900.png','03-ending-footer-primary-390x844.png']},null,2)+'\n');console.log(JSON.stringify({status:'PASS',sixEndings:results.length,finishOnlyAfterDashboard:true}));
}catch(error){fs.writeFileSync(outputDir+'/inspection.json',JSON.stringify({status:'FAIL',error:String(error),stack:error.stack},null,2));throw error;}finally{try{socket?.close();}catch{}chrome.kill();vite.kill();}
