import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const outputDir = "docs/scenario5-phase8c-screenshots";
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

const vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5186"], { stdio: "ignore", windowsHide: true });
const chrome = spawn(chromePath, ["--headless=new", "--remote-debugging-port=9236", `--user-data-dir=${profileDir}`, "--disable-gpu", "--no-first-run", "--no-default-browser-check", "http://127.0.0.1:5186"], { stdio: "ignore", windowsHide: true });
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
  await waitFor("http://127.0.0.1:5186");
  await waitFor("http://127.0.0.1:9236/json");
  const targets = await (await fetch("http://127.0.0.1:9236/json")).json();
  const target = targets.find((item) => item.type === "page" && item.url.startsWith("http://127.0.0.1:5186"));
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
    const metrics = await evaluate(`(() => {
      const doc = document.documentElement;
      const rect = (selector) => document.querySelector(selector)?.getBoundingClientRect().toJSON() ?? null;
      const pane = document.querySelector('.s5-control-pane .s5-control-scroll');
      const sliders = [...document.querySelectorAll('.s5-belief-range')];
      const forbidden = /W-corridor_|cautious_denial|deceptive_diversion|opportunistic_interdiction|pressure_escalator|hiddenProvenance|trueWorldState|actorInternalState|background_noise|decoy_relation/;
      return {
        stage: ${JSON.stringify(stage)}, viewport: { width: innerWidth, height: innerHeight },
        document: { scrollHeight: doc.scrollHeight, clientHeight: doc.clientHeight, scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth },
        noPageScroll: doc.scrollHeight <= innerHeight && doc.scrollWidth <= innerWidth,
        leftPane: pane ? { scrollHeight: pane.scrollHeight, clientHeight: pane.clientHeight, overflowY: getComputedStyle(pane).overflowY, scrollTop: pane.scrollTop } : null,
        stickyFooter: rect('.s5-control-pane .s5-control-footer'), footerPosition: document.querySelector('.s5-control-footer') ? getComputedStyle(document.querySelector('.s5-control-footer')).position : null,
        mapBounds: rect('.s5-map-pane'), controlBounds: rect('.s5-control-pane'), headerBounds: rect('.s5-command-bar'),
        evidenceSummaries: document.querySelectorAll('.s5-information-summary').length,
        corridorCards: document.querySelectorAll('.s5-corridor-card').length,
        rangeSliders: sliders.length,
        sliderInitialization: sliders.map((node) => ({ value: node.value, state: node.getAttribute('aria-valuetext'), untouched: node.classList.contains('s5-untouched'), min: node.min, max: node.max, step: node.step })),
        hasNumericBeliefInput: Boolean(document.querySelector('.s5-form-panel input[type=number]')),
        hiddenTruthInDom: forbidden.test(document.body.innerText),
        submitDisabled: document.querySelector('.s5-form-panel .s5-primary-button')?.disabled ?? null,
      };
    })()`);
    const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, fromSurface: true });
    fs.writeFileSync(`${outputDir}/${filename}`, Buffer.from(shot.data, "base64"));
    return metrics;
  };
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const snapshots = [];
  const snap = async (name, width, height, stage) => { const metrics = await capture(name, width, height, stage); snapshots.push(metrics); return metrics; };
  const chooseAction = async (index = 0) => {
    await click('.s5-action-card', index);
    await evaluate(`(() => { const node = document.querySelector('.s5-target-picker select'); if (node) {
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(node, [...node.options].find((option) => option.value).value);
      node.dispatchEvent(new Event('change', { bubbles: true }));
    } })()`);
    await delay(120);
  };
  const fillBelief = async (submit = true) => {
    await click('.s5-corridor-card input', 1);
    assert(await evaluate(`document.querySelector('.s5-form-panel .s5-primary-button').disabled`), 'Corridor alone bypassed belief gate');
    for (const [index, key] of ['ArrowRight', 'End', 'Home'].entries()) {
      await evaluate(`document.querySelectorAll('.s5-belief-range')[${index}].focus()`);
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key });
      if (index < 2) assert(await evaluate(`document.querySelector('.s5-form-panel .s5-primary-button').disabled`), 'Partial belief bypassed gate');
    }
    await delay(150);
    assert(await evaluate(`!document.querySelector('.s5-form-panel .s5-primary-button').disabled`), 'Belief remains disabled after four actual answers');
    if (submit) await click('.s5-form-panel .s5-primary-button');
  };
  const outcomeContinue = () => click('.s5-outcome-modal .s5-primary-button');
  const noTruth = (object) => !/"(?:worldId|seed|trueWorldState|primaryAffectedCorridorId|actorProfileId|actorInternalState|hiddenProvenance|actorDelayImpactByCorridor|cognitive|loadings|endStateId)"/.test(JSON.stringify(object));
  const propsAudit = [];
  const auditProps = async (stage) => {
    const props = await evaluate(`(() => {
      const root = document.querySelector('.s5-root');
      const fiberKey = Object.keys(root).find((key) => key.startsWith('__reactFiber'));
      let fiber = root[fiberKey];
      while (fiber.return && fiber.type?.name !== 'ScenarioFiveSimulation') fiber = fiber.return;
      const allowed = ['ScenarioFiveMap', 'ScenarioFiveInformationPicture', 'ScenarioFiveOutcomePanel', 'ScenarioFiveBeliefPanel', 'ScenarioFiveReasonPanel', 'ScenarioFiveGlossary'];
      const result = [];
      const visit = (node) => { if (!node) return; const name = node.type?.name; if (allowed.includes(name)) result.push({ name, props: JSON.parse(JSON.stringify(node.memoizedProps)) }); visit(node.child); visit(node.sibling); };
      visit(fiber.child); return result;
    })()`);
    assert(props.length > 0 && noTruth(props), 'PLAYER_INFORMATION_FIREWALL failed');
    propsAudit.push({ stage, props });
  };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://127.0.0.1:5186' });
  await delay(1500);
  await send('Page.addScriptToEvaluateOnNewDocument', { source: 'Date.now = () => 1793448000000;' });
  await evaluate(`localStorage.setItem('space-war.profiles.v1', JSON.stringify({ profiles: [{id:'test-player', name:'بازیکن تست', role:'player', scenarioCatalog:'released', progress:6}], activeProfileId:'test-player' }))`);
  await send('Page.reload'); await delay(1800);
  await setViewport(1440,900);
  await click('.menu-buttons button', 0);
  await click('.scenario-card:last-child .scenario-actions button:last-child');
  assert(await evaluate(`document.querySelector('.intro-modal').innerText.includes('سناریو ۲ — امواج خاموش')`), 'Wrong intro numbering');
  await snap('01-scenario2-intro-1440x900.png',1440,900,'intro');
  await click('.intro-modal .primary');
  await snap('02-briefing-1440x900.png',1440,900,'briefing');
  await auditProps('briefing');
  await click('.s5-briefing .s5-primary-button');
  await snap('03-r1-decision-1440x900.png',1440,900,'R1-decision');
  await auditProps('R1-decision');
  // Glossary changes no cognitive/event telemetry; explicit close returns focus.
  const telemetryBefore = await evaluate(`localStorage.getItem('space-war.analytics.events')`);
  await click('.s5-glossary-control');
  assert(await evaluate(`document.querySelector('.s5-glossary-dialog').open`), 'Glossary does not open');
  await click('.s5-glossary-dialog .s5-secondary-button');
  assert(await evaluate(`!document.querySelector('.s5-glossary-dialog').open`), 'Glossary does not close');
  assert(telemetryBefore === await evaluate(`localStorage.getItem('space-war.analytics.events')`), 'Glossary emitted events');
  await chooseAction(0); await click('.s5-decision-actions .s5-primary-button');
  assert(await evaluate(`document.querySelectorAll('.s5-outcome-modal .s5-information-summary').length > 0`), 'R1 outcome omitted actual evidence');
  await evaluate(`document.querySelector('.s5-outcome-modal .s5-control-scroll').scrollTop=65`);
  await snap('04-r1-outcome-1440x900.png',1440,900,'R1-outcome');
  await auditProps('R1-outcome');
  await outcomeContinue();
  await delay(200);
  const pre = await snap('05-prebelief-1440x900.png',1440,900,'A2-prebelief');
  await auditProps('A2-prebelief');
  assert(pre.corridorCards===4 && pre.rangeSliders===3 && pre.submitDisabled && pre.sliderInitialization.every((s)=>s.state==='ثبت نشده' && s.untouched), 'Belief no-default gate failed');
  assert(pre.evidenceSummaries>0 && !pre.hasNumericBeliefInput, 'Prebelief evidence/range controls missing');
  const beliefTelemetryBefore=await evaluate(`localStorage.getItem('space-war.analytics.events')`);
  await fillBelief(false);
  assert(beliefTelemetryBefore===await evaluate(`localStorage.getItem('space-war.analytics.events')`),'Slider/card editing emitted telemetry');
  assert(await evaluate(`JSON.stringify([...document.querySelectorAll('.s5-belief-range')].map((node)=>node.value))==='["51","100","0"]'`), 'Keyboard slider boundary values were not retained');
  const entered = await snap('06-prebelief-entered-1440x900.png',1440,900,'A2-prebelief-entered');
  assert(!entered.submitDisabled, 'Four responses did not enable submit');
  await click('.s5-form-panel .s5-primary-button');
  await chooseAction(0);
  const targetBeforeEvidence=await evaluate(`document.querySelector('.s5-target-picker select').value`);
  await click('.s5-evidence-access');
  await click('.s5-evidence-card .s5-secondary-button',0);
  await snap('07-r2-evidence-decision-1440x900.png',1440,900,'R2-evidence');
  await click('.s5-back-to-decision');
  assert(await evaluate(`document.querySelectorAll('.s5-action-card[aria-pressed="true"]').length===1`), 'Local evidence view lost selected action');
  assert(targetBeforeEvidence===await evaluate(`document.querySelector('.s5-target-picker select').value`), 'Local evidence view lost selected target');
  await click('.s5-decision-actions .s5-primary-button'); await outcomeContinue();
  const post = await snap('08-postbelief-1440x900.png',1440,900,'A2-postbelief');
  await auditProps('A2-postbelief');
  assert(post.sliderInitialization.every((s)=>s.state==='ثبت نشده'), 'Postbelief did not reset null state');
  assert(await evaluate(`document.body.innerText.includes('شواهد تازه از بررسی اخیر') && document.body.innerText.includes('شواهد قبلی')`), 'Postbelief grouping missing');
  await fillBelief();
  await chooseAction(0); await click('.s5-decision-actions .s5-primary-button'); await outcomeContinue();
  await chooseAction(0); await click('.s5-decision-actions .s5-primary-button');
  assert(await evaluate(`Boolean(document.querySelector('#s5-reason-title')) && !document.querySelector('.s5-outcome-dialog')`), 'Reason must precede outcome');
  await setViewport(1366,768);
  const before = await evaluate(`({map:document.querySelector('.s5-map-pane').getBoundingClientRect().toJSON(),header:document.querySelector('.s5-command-bar').getBoundingClientRect().toJSON()})`);
  const scroll = await evaluate(`(() => {const pane=document.querySelector('.s5-control-pane .s5-control-scroll'); const initial=pane.scrollTop;pane.scrollTop=pane.scrollHeight;return {initial,after:pane.scrollTop,scrollHeight:pane.scrollHeight,clientHeight:pane.clientHeight};})()`);
  assert(scroll.scrollHeight>scroll.clientHeight && scroll.after>scroll.initial,'Left pane did not internally scroll');
  const after = await evaluate(`({map:document.querySelector('.s5-map-pane').getBoundingClientRect().toJSON(),header:document.querySelector('.s5-command-bar').getBoundingClientRect().toJSON()})`);
  assert(JSON.stringify(before)===JSON.stringify(after),'Map/header moved while left pane scrolled');
  const reason = await snap('09-left-pane-scroll-1366x768.png',1366,768,'reason-scroll');
  assert(reason.stickyFooter.bottom<=768 && reason.footerPosition==='sticky','Sticky submit is unreachable');
  await auditProps('reason');
  await snap('10-map-evidence-cues-1440x900.png',1440,900,'map-evidence-cues');
  const layoutChecks=[];
  for(const [width,height] of [[1280,720],[1366,768],[1440,900]]) {
    await setViewport(width,height);
    layoutChecks.push(await evaluate(`({width:innerWidth,height:innerHeight,scrollHeight:document.documentElement.scrollHeight,scrollWidth:document.documentElement.scrollWidth})`));
  }
  assert(layoutChecks.every((m)=>m.scrollHeight<=m.height && m.scrollWidth<=m.width),'Desktop document scroll regression');
  // Read-only belief/reason summaries create no evidence-open audit events.
  const events=await evaluate(`JSON.parse(localStorage.getItem('space-war.analytics.events') ?? '[]')`);
  const opens=events.filter((event)=>event.type==='s5_v3_evidence_opened');
  assert(opens.length===1,'Read-only summaries introduced evidence opens');
  assert(propsAudit.flatMap((a)=>a.props).some((p)=>p.name==='ScenarioFiveReasonPanel'),'Reason props were not audited');
  const supplemental = [];
  supplemental.push(await capture('11-reason-mobile-390x844.png',390,844,'reason-mobile'));
  assert(supplemental[0].document.scrollWidth<=390, 'Mobile horizontal overflow');
  await setViewport(1440,900);
  // Finish the real run using the same public controls through C/D beliefs and reasons.
  for (let step=0;step<28;step++) {
    if(await evaluate(`Boolean(document.querySelector('.s5-aar'))`)) break;
    if(await evaluate(`Boolean(document.querySelector('.s5-outcome-dialog'))`)) await outcomeContinue();
    else if(await evaluate(`Boolean(document.querySelector('#s5-reason-title'))`)) {
      await click('.s5-reason-options input',6); await click('.s5-form-panel .s5-primary-button');
    } else if(await evaluate(`Boolean(document.querySelector('#s5-belief-title'))`)) await fillBelief();
    else { await chooseAction(0); await click('.s5-decision-actions .s5-primary-button'); }
  }
  assert(await evaluate(`Boolean(document.querySelector('.s5-aar'))`), 'Browser run did not reach completion');
  supplemental.push(await capture('12-aar-mobile-390x844.png',390,844,'aar-mobile'));
  assert(supplemental[1].document.scrollWidth<=390,'Mobile AAR horizontal overflow');
  const completionEvents=await evaluate(`JSON.parse(localStorage.getItem('space-war.analytics.events') ?? '[]').filter((event)=>event.type==='s5_v3_run_completed').length`);
  assert(completionEvents===1,'Run completion logged more than once');
  const inspection={browser:path.basename(chromePath),capturedAt:new Date().toISOString(),snapshots,supplemental,layoutChecks,scrollTest:{before,after,scroll},propsAudit,explicitEvidenceOpenEvents:opens.length,glossaryTelemetryUnchanged:true,beliefEntryTelemetryUnchanged:true,playerInformationFirewall:'PASS',realRunCompleted:true,completionEvents};
  fs.writeFileSync(`${outputDir}/inspection.json`,JSON.stringify(inspection,null,2));
  assert(snapshots.filter((s)=>s.stage!=='intro').every((s)=>s.noPageScroll && !s.hiddenTruthInDom),'Scroll/truth DOM hard gate failed');
  console.log(JSON.stringify({result:'PASS',screenshots:snapshots.length,outputDir,layoutChecks},null,2));
} finally {
  try { socket?.close(); } catch { /* no-op */ }
  chrome.kill(); vite.kill();
}
