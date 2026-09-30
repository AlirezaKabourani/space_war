import fs from "node:fs";

const targets = await (await fetch("http://127.0.0.1:9225/json")).json();
const target = targets.find((item) => item.type === "page" && item.url.startsWith("http://127.0.0.1:5173"));
if (!target) throw new Error("Scenario 4 QA page was not found.");

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});
let requestId = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++requestId;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};

await send("Runtime.enable");
const clickText = async (text) => evaluate(`(() => {
  const candidates = [...document.querySelectorAll('button,[role="button"]')];
  const target = candidates.find((item) => item.textContent.trim() === ${JSON.stringify(text)})
    ?? candidates.find((item) => item.textContent.includes(${JSON.stringify(text)}));
  if (!target) return false;
  target.click();
  return true;
})()`);
const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
const clickRequired = async (text) => {
  if (!await clickText(text)) throw new Error(`Button not found: ${text}`);
  await delay();
};
const clickSelector = async (selector, index = 0) => {
  const clicked = await evaluate(`(() => {
    const target = document.querySelectorAll(${JSON.stringify(selector)})[${index}];
    if (!target) return false;
    target.click();
    return true;
  })()`);
  if (!clicked) throw new Error(`Selector not found: ${selector}[${index}]`);
  await delay();
};
const outputDir = "docs/screenshots/scenario4-phase5";
fs.mkdirSync(outputDir, { recursive: true });
const metrics = [];
const capture = async (name, scrollHeading) => {
  if (scrollHeading) await evaluate(`(() => {
    const item = [...document.querySelectorAll('h2,h3')].find((node) => node.textContent.includes(${JSON.stringify(scrollHeading)}));
    item?.scrollIntoView({ block: 'start' });
  })()`);
  else await evaluate("scrollTo(0, 0)");
  await delay(120);
  for (const [width, height] of [[1440, 900], [1366, 768]]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
    await delay(120);
    const layout = await evaluate("({ innerWidth, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight, debugPanel: document.body.innerText.includes('پنل اشکال‌زدایی مدیر'), hiddenLeak: /Intent مخفی|Seed:|Red action:|Checkpointها:/.test(document.body.innerText) })");
    const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, fromSurface: true });
    fs.writeFileSync(`${outputDir}/${width}x${height}-${name}.png`, Buffer.from(shot.data, "base64"));
    metrics.push({ name, width, height, horizontalOverflow: layout.scrollWidth > layout.innerWidth, debugPanel: layout.debugPanel, hiddenLeak: layout.hiddenLeak, scrollHeight: layout.scrollHeight });
  }
};

await evaluate("location.reload()");
await delay(700);
await clickText("ساخت / انتخاب پروفایل");
await delay(300);
await clickText("ادمین");
await delay(200);
await clickText("بازگشت به منوی اصلی");
await delay(200);
await clickText("شروع");
await delay(400);
await evaluate(`(() => {
  const card = [...document.querySelectorAll('.scenario-card')].find((item) => item.textContent.includes('حریم خاکستری مدار'));
  const button = card?.querySelector('.scenario-actions button:last-child');
  if (!button) return false;
  button.click();
  return true;
})()`);
await delay(500);

// Keep Scenario 4 open, then switch the active profile to player mode through React's own state dispatcher.
const switchedToPlayer = await evaluate(`(() => {
  const root = document.getElementById('root');
  const key = Object.keys(root).find((item) => item.startsWith('__reactContainer$'));
  let found;
  const visit = (fiber) => {
    if (!fiber || found) return;
    if (fiber.type?.name === 'App') { found = fiber; return; }
    visit(fiber.child); visit(fiber.sibling);
  };
  visit(root[key]);
  const activeProfileHook = found?.memoizedState?.next;
  if (!activeProfileHook?.queue?.dispatch) return false;
  activeProfileHook.queue.dispatch('test-player');
  return true;
})()`);
if (!switchedToPlayer) throw new Error("Could not switch the QA run to player mode.");
await delay(300);

for (let index = 0; index < 6; index += 1) await clickSelector(".s4-intro-shell button.primary");
if (await clickText("متوجه شدم")) await delay();
await clickRequired("مشاهده بسته اطلاعاتی");
await clickRequired("شروع تصمیم‌ها");
if (await clickText("متوجه شدم")) await delay();
await clickSelector(".s4-option-card > button:first-child", 0); await clickRequired("ثبت تصمیم");
await clickSelector(".s4-option-card > button:first-child", 1); await clickRequired("ثبت تصمیم");
await clickSelector(".s4-option-card > button:first-child", 1); await clickRequired("ثبت تصمیم");
await clickSelector(".s4-option-card > button:first-child", 0); await clickRequired("ثبت تصمیم");
await clickSelector(".s4-move1-action-bar button");

await clickSelector(".s4-main .primary");
await clickSelector(".s4-main .primary");
await clickSelector(".s4-option-card > button:first-child", 2); await clickRequired("ثبت تصمیم");
await clickSelector(".s4-main .primary");
await clickSelector(".s4-option-card > button:first-child", 1); await clickRequired("ثبت تصمیم");
await clickSelector(".s4-option-card > button:first-child", 5); await clickRequired("ثبت تصمیم");
await clickSelector(".s4-option-card > button:first-child", 0); await clickRequired("ثبت تصمیم");
await clickSelector(".s4-move1-action-bar button");

await capture("opening");
await clickSelector(".s4-main .primary");
await capture("evidence");
await clickSelector(".s4-main .primary");
await capture("final-attribution");
await clickSelector(".s4-main .primary");
await capture("decision-1");
await clickSelector(".s4-option-card > button:first-child", 1); await clickRequired("ثبت تصمیم");
await capture("decision-2");
await clickSelector(".s4-option-card > button:first-child", 3); await clickRequired("ثبت تصمیم");
await capture("decision-3");
await clickSelector(".s4-option-card > button:first-child", 1); await clickRequired("ثبت تصمیم");
await capture("offramp");
await clickSelector(".s4-option-card > button:first-child", 0); await clickRequired("ثبت تصمیم");
await capture("reason");
await clickSelector(".s4-option-card > button:first-child", 0); await clickRequired("ثبت تصمیم");
await delay(600);
await capture("summary");
await clickSelector(".s4-move1-action-bar button");
await capture("final-report");
await clickSelector(".s4-main .primary");
await capture("aar-top");
await capture("aar-attribution", "امتیاز Brier این رخداد");
await capture("aar-israel-saw", "اسرائیل چه چیزی دید؟");

fs.writeFileSync(`${outputDir}/qa-metrics.json`, JSON.stringify({ captures: metrics, horizontalOverflowCount: metrics.filter((item) => item.horizontalOverflow).length, debugPanelCount: metrics.filter((item) => item.debugPanel).length, hiddenLeakCount: metrics.filter((item) => item.hiddenLeak).length }, null, 2));
if (metrics.some((item) => item.horizontalOverflow || item.debugPanel || item.hiddenLeak)) throw new Error("Phase 5 visual QA detected overflow or player-mode leakage.");
console.log(JSON.stringify({ captures: metrics.length, outputDir, result: "passed" }, null, 2));
socket.close();
