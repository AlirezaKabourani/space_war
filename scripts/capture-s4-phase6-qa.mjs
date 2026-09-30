import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { MOVE3_NARRATIVE_COPY_FA } from "../src/ui/components/scenario/scenario-four/narrative/narrativeCatalogFa.ts";

const outputDir = "docs/screenshots/scenario4-phase6";
fs.mkdirSync(outputDir, { recursive: true });
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "s4-phase6-chrome-"));
const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
].filter(Boolean);
const chromePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));
if (!chromePath) throw new Error("Chrome/Edge executable was not found. Set CHROME_PATH.");

const vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5173"], { stdio: "ignore", windowsHide: true });
const chrome = spawn(chromePath, ["--headless=new", "--remote-debugging-port=9226", `--user-data-dir=${profileDir}`, "--disable-gpu", "--no-first-run", "--no-default-browser-check", "http://127.0.0.1:5173"], { stdio: "ignore", windowsHide: true });
const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
const waitFor = async (url, attempts = 80) => {
  for (let index = 0; index < attempts; index += 1) {
    try { const response = await fetch(url); if (response.ok) return response; } catch { /* wait */ }
    await delay(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
};

let socket;
try {
  await waitFor("http://127.0.0.1:5173");
  await waitFor("http://127.0.0.1:9226/json");
  const targets = await (await fetch("http://127.0.0.1:9226/json")).json();
  const target = targets.find((item) => item.type === "page" && item.url.startsWith("http://127.0.0.1:5173"));
  if (!target) throw new Error("Scenario 4 QA page was not found.");
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
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++requestId; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expression) => { const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.text); return result.result.value; };
  await send("Runtime.enable");

  const clickText = async (label) => evaluate(`(() => { const nodes = [...document.querySelectorAll('button,[role="button"]')]; const node = nodes.find((item) => item.textContent.trim() === ${JSON.stringify(label)}) ?? nodes.find((item) => item.textContent.includes(${JSON.stringify(label)})); if (!node) return false; node.click(); return true; })()`);
  const clickRequired = async (label) => { if (!await clickText(label)) throw new Error(`Button not found: ${label}`); await delay(); };
  const clickSelector = async (selector, index = 0) => { const clicked = await evaluate(`(() => { const node = document.querySelectorAll(${JSON.stringify(selector)})[${index}]; if (!node) return false; node.click(); return true; })()`); if (!clicked) throw new Error(`Selector not found: ${selector}[${index}]`); await delay(); };
  const pressKey = async (key) => {
    const keyCode = key === "Enter" ? 13 : key === " " ? 32 : 0;
    const code = key === " " ? "Space" : key;
    await send("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode });
    await delay();
  };
  const switchProfile = async (profileId) => evaluate(`(() => { const root = document.getElementById('root'); const key = Object.keys(root).find((item) => item.startsWith('__reactContainer$')); let found; const visit = (fiber) => { if (!fiber || found) return; if (fiber.type?.name === 'App') { found = fiber; return; } visit(fiber.child); visit(fiber.sibling); }; visit(root[key]); const profilesHook = found?.memoizedState; const activeHook = profilesHook?.next; if (!activeHook?.queue?.dispatch) return false; if (${JSON.stringify(profileId)} === 'test-player' && profilesHook?.queue?.dispatch) profilesHook.queue.dispatch((items) => items.map((item) => item.id === 'test-player' ? { ...item, progress: 6 } : item)); activeHook.queue.dispatch(${JSON.stringify(profileId === "test-admin" ? "admin" : profileId)}); return true; })()`);
  const setScenarioResources = async (overrides) => evaluate(`(() => {
    const root = document.getElementById('root');
    const key = Object.keys(root).find((item) => item.startsWith('__reactContainer$'));
    let found;
    const visit = (fiber) => {
      if (!fiber || found) return;
      if (fiber.type?.name === 'ScenarioFourRedesignedScenarioOne') { found = fiber; return; }
      visit(fiber.child); visit(fiber.sibling);
    };
    visit(root[key]);
    let hook = found?.memoizedState;
    while (hook) {
      if (hook.queue?.dispatch && hook.memoizedState?.resources) {
        const before = { ...hook.memoizedState.resources };
        const overrides = ${JSON.stringify(overrides)};
        hook.queue.dispatch((current) => ({ ...current, resources: { ...current.resources, ...overrides } }));
        return before;
      }
      hook = hook.next;
    }
    return null;
  })()`);

  const viewports = [[1920, 1080], [1600, 900], [1440, 900], [1366, 768], [1280, 720]];
  const metrics = [];
  const capture = async (screen, allowHiddenTruth = false, scrollHeading = "") => {
    if (scrollHeading) await evaluate(`(() => { const node = [...document.querySelectorAll('h1,h2,h3')].find((item) => item.textContent.includes(${JSON.stringify(scrollHeading)})); node?.scrollIntoView({ block: 'start' }); })()`);
    else await evaluate("scrollTo(0, 0)");
    for (const [width, height] of viewports) {
      await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
      await delay(80);
      const layout = await evaluate(`(() => {
        const text = document.body.innerText;
        const doc = document.documentElement;
        const offenders = [...document.querySelectorAll('.s4-shell,.s4-main,.s4-sidebar,.card,.s4-option-grid,.s4-sidebar-panels')]
          .filter((node) => node.scrollWidth > node.clientWidth + 2)
          .map((node) => ({ tag: node.tagName, cls: node.className, client: node.clientWidth, scroll: node.scrollWidth })).slice(0, 10);
        const primary = [...document.querySelectorAll('button.primary')].some((node) => { const rect = node.getBoundingClientRect(); return rect.bottom > 0 && rect.top < innerHeight && rect.width > 0; });
        return {
          innerWidth, scrollWidth: doc.scrollWidth, scrollHeight: doc.scrollHeight,
          horizontalOverflow: doc.scrollWidth > innerWidth + 2,
          nestedOverflow: offenders,
          adminPanel: text.includes('پنل اشکال‌زدایی مدیر'),
          internalLeak: /(?:m[123]_[a-z0-9_]+|Seed:|Checkpoint|Red action:|utility)/i.test(text),
          hiddenTruthLeak: /نیت واقعی اسرائیل در این اجرا|علت واقعی رخداد مرحله دوم|انتساب واقعی/.test(text),
          visiblePrimaryCta: primary,
          heading: document.querySelector('h1,h2')?.textContent?.trim() ?? ''
        };
      })()`);
      const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, fromSurface: true });
      fs.writeFileSync(`${outputDir}/${width}x${height}-${screen}.png`, Buffer.from(shot.data, "base64"));
      metrics.push({ screen, width, height, allowHiddenTruth, ...layout });
    }
  };

  await evaluate("location.reload()"); await delay(700);
  await clickText("ساخت / انتخاب پروفایل"); await delay();
  await clickText("ادمین"); await delay();
  await clickText("بازگشت به منوی اصلی"); await delay();
  await clickText("شروع"); await delay(400);
  const scenarioListVisible = await evaluate("Boolean(document.querySelector('.scenario-card'))");
  if (!scenarioListVisible) { await clickText("شروع"); await delay(400); }
  const opened = await evaluate(`(() => { const card = [...document.querySelectorAll('.scenario-card')].find((item) => item.textContent.includes('حریم خاکستری مدار')); const button = card?.querySelector('.scenario-actions button:last-child'); if (!button) return false; button.click(); return true; })()`);
  if (!opened) throw new Error(`Scenario 4 entry was not found. Page: ${(await evaluate("document.body.innerText.slice(0, 1200)"))}`);
  await delay(500);
  if (!await switchProfile("test-player")) throw new Error("Could not switch to Player profile.");
  await delay(700);
  if (!await evaluate("Boolean(document.querySelector('.s4-intro-shell'))")) {
    if (!await evaluate(`Boolean([...document.querySelectorAll('.scenario-card')].find((item) => item.textContent.includes('حریم خاکستری مدار')))`)) {
      await clickText("شروع");
      await delay(500);
    }
    const reopened = await evaluate(`(() => { const card = [...document.querySelectorAll('.scenario-card')].find((item) => item.textContent.includes('حریم خاکستری مدار')); const button = card?.querySelector('.scenario-actions button:last-child'); if (!button) return false; button.click(); return true; })()`);
    if (!reopened) throw new Error(`Scenario 4 could not be reopened for Player QA. Page: ${(await evaluate("document.body.innerText.slice(0, 1200)"))}`);
    await delay(500);
  }

  await capture("intro");
  for (let index = 0; index < 6; index += 1) await clickSelector(".s4-intro-shell button.primary");
  if (await clickText("متوجه شدم")) await delay();
  await clickRequired("مشاهده بسته اطلاعاتی");
  await clickRequired("شروع تصمیم‌ها");
  if (await clickText("متوجه شدم")) await delay();
  await capture("move1-decision");
  await capture("resource-label-85");
  await clickSelector(".s4-option-card > button:first-child", 0); await clickRequired("ثبت تصمیم");
  await clickSelector(".s4-option-card > button:first-child", 1); await clickRequired("ثبت تصمیم");
  await clickSelector(".s4-option-card > button:first-child", 1); await clickRequired("ثبت تصمیم");
  await clickSelector(".s4-option-card > button:first-child", 0); await clickRequired("ثبت تصمیم");
  await capture("move1-summary");
  await clickSelector(".s4-move1-action-bar button");

  await clickSelector(".s4-main .primary");
  await capture("move2-attribution");
  await clickSelector(".s4-main .primary");
  await capture("move2-decision");
  await clickSelector(".s4-option-card > button:first-child", 2); await clickRequired("ثبت تصمیم");
  await clickSelector(".s4-main .primary");
  await clickSelector(".s4-option-card > button:first-child", 1); await clickRequired("ثبت تصمیم");
  await clickSelector(".s4-option-card > button:first-child", 5); await clickRequired("ثبت تصمیم");
  await clickSelector(".s4-option-card > button:first-child", 0); await clickRequired("ثبت تصمیم");
  await capture("move2-summary");
  await clickSelector(".s4-move1-action-bar button");

  await clickSelector(".s4-main .primary");
  await capture("move3-opening");
  await clickSelector(".s4-main .primary");
  await clickSelector(".s4-main .primary");
  await clickSelector(".s4-main .primary");
  await capture("move3-decision");
  await clickSelector(".s4-option-card > button:first-child", 1); await clickRequired("ثبت تصمیم");
  await clickSelector(".s4-option-card > button:first-child", 3);
  await capture("move3-resource-projection");
  const originalResources = await setScenarioResources({ politicalCapital: 35 });
  if (!originalResources) throw new Error("Could not set Scenario 4 resource fixture.");
  await delay();
  await capture("resource-critical-warning");
  await setScenarioResources(originalResources);
  await delay();
  await clickSelector(".s4-option-card > button:first-child", 1);
  const hardBlockResources = await setScenarioResources({ protectiveCapacity: 5 });
  await delay();
  await evaluate("document.querySelector('.s4-option-card.selected')?.scrollIntoView({ block: 'center' })");
  await capture("resource-insufficient-hard-block");
  await setScenarioResources(hardBlockResources);
  await delay();
  await clickSelector(".s4-option-card > button:first-child", 3);
  await clickRequired("ثبت تصمیم");
  await clickSelector(".s4-option-card > button:first-child", 1); await clickRequired("ثبت تصمیم");
  await clickSelector(".s4-option-card > button:first-child", 0); await clickRequired("ثبت تصمیم");
  await clickSelector(".s4-option-card > button:first-child", 0); await clickRequired("ثبت تصمیم");
  await delay(500);
  await capture("move3-summary");
  await clickSelector(".s4-move1-action-bar button");
  await capture("final-report");
  await clickSelector(".s4-main .primary");
  await capture("aar", true, "ارزیابی برآورد انتساب");
  const detailsFocused = await evaluate(`(() => { const summary = document.querySelector('.s4-aar-statistics summary'); if (!summary) return false; summary.focus(); return document.activeElement === summary; })()`);
  await pressKey(" ");
  const detailsKeyboard = detailsFocused && await evaluate("Boolean(document.querySelector('.s4-aar-statistics[open]'))");
  await capture("aar-statistics", true, "جزئیات آماری");
  await clickRequired(MOVE3_NARRATIVE_COPY_FA?.aar?.dashboardCta ?? "مشاهده داشبورد شناختی").catch(async () => clickRequired("مشاهده داشبورد شناختی"));
  await capture("dashboard", true);
  await capture("dashboard-resources", true, "مسیر منابع");

  if (!await switchProfile("test-admin")) throw new Error("Could not switch to Admin profile.");
  await delay();
  const adminState = await evaluate(`({ adminPanel: document.body.innerText.includes('پنل اشکال‌زدایی مدیر'), debugToggle: [...document.querySelectorAll('button')].some((node) => node.textContent.includes('فراداده روایت')) })`);

  const playerMetrics = metrics.filter((item) => !item.screen.startsWith("admin"));
  const summary = {
    captures: metrics.length,
    screens: [...new Set(metrics.map((item) => item.screen))],
    viewports: viewports.map(([width, height]) => `${width}x${height}`),
    horizontalOverflowCount: playerMetrics.filter((item) => item.horizontalOverflow).length,
    nestedOverflowCount: playerMetrics.filter((item) => item.nestedOverflow.length).length,
    internalLeakCount: playerMetrics.filter((item) => item.internalLeak).length,
    prematureHiddenTruthCount: playerMetrics.filter((item) => !item.allowHiddenTruth && item.hiddenTruthLeak).length,
    playerAdminPanelCount: playerMetrics.filter((item) => item.adminPanel).length,
    detailsFocused,
    detailsKeyboard,
    adminState,
    metrics,
  };
  fs.writeFileSync(`${outputDir}/qa-metrics.json`, JSON.stringify(summary, null, 2));
  if (summary.horizontalOverflowCount || summary.internalLeakCount || summary.prematureHiddenTruthCount || summary.playerAdminPanelCount || !detailsKeyboard || !adminState.adminPanel || !adminState.debugToggle) throw new Error("Phase 6 browser QA failed. Inspect qa-metrics.json.");
  console.log(JSON.stringify({ captures: summary.captures, screens: summary.screens.length, viewports: summary.viewports, horizontalOverflowCount: 0, internalLeakCount: 0, prematureHiddenTruthCount: 0, detailsKeyboard: "passed", adminGate: "passed", outputDir, result: "passed" }, null, 2));
} finally {
  try { socket?.close(); } catch { /* no-op */ }
  chrome.kill(); vite.kill();
  await delay(300);
  fs.rmSync(profileDir, { recursive: true, force: true });
}
