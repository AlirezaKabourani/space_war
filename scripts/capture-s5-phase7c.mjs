import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const outputDir = "docs/scenario5-phase7d-screenshots";
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

const vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5174"], { stdio: "ignore", windowsHide: true });
const chrome = spawn(chromePath, ["--headless=new", "--remote-debugging-port=9227", `--user-data-dir=${profileDir}`, "--disable-gpu", "--no-first-run", "--no-default-browser-check", "http://127.0.0.1:5174"], { stdio: "ignore", windowsHide: true });
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
  await waitFor("http://127.0.0.1:5174");
  await waitFor("http://127.0.0.1:9227/json");
  const targets = await (await fetch("http://127.0.0.1:9227/json")).json();
  const target = targets.find((item) => item.type === "page" && item.url.startsWith("http://127.0.0.1:5174"));
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
      const map = document.querySelector('.s5-map-pane')?.getBoundingClientRect();
      const controls = document.querySelector('.s5-control-pane')?.getBoundingClientRect();
      const cards = [...document.querySelectorAll('.s5-action-card')].map((node) => {
        const rect = node.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, visible: rect.top >= 0 && rect.bottom <= innerHeight };
      });
      const confirm = document.querySelector('.s5-decision-actions .s5-primary-button')?.getBoundingClientRect();
      const markers = [...document.querySelectorAll('.s5-convoy-marker')].map((node) => {
        const rect = node.getBoundingClientRect();
        const coordinates = node.style.transform.match(/[-0-9.]+/g)?.map(Number);
        return {
          convoyId: node.dataset.convoyId,
          visualProgress: Number(node.dataset.visualProgress),
          transform: node.style.transform,
          svgCenter: coordinates?.length === 2 ? { x: coordinates[0], y: coordinates[1] } : null,
          screenCenter: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
          visible: rect.width > 0 && rect.height > 0 && rect.left < innerWidth && rect.right > 0 && rect.top < innerHeight && rect.bottom > 0,
        };
      });
      return {
        stage: ${JSON.stringify(stage)}, width: innerWidth, height: innerHeight,
        scrollHeight: doc.scrollHeight, scrollWidth: doc.scrollWidth,
        noPageScroll: doc.scrollHeight <= innerHeight && doc.scrollWidth <= innerWidth,
        noHorizontalOverflow: doc.scrollWidth <= innerWidth,
        mapLeft: map?.left ?? null, controlLeft: controls?.left ?? null,
        mapRightOfControls: Boolean(map && controls && map.left > controls.left),
        actionCardCount: cards.length,
        allActionCardsVisible: cards.length === 0 ? null : cards.every((item) => item.visible),
        confirmVisible: confirm ? confirm.top >= 0 && confirm.bottom <= innerHeight : null,
        markerTransforms: markers.map((marker) => marker.transform),
        markers,
      };
    })()`);
    const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, fromSurface: true });
    fs.writeFileSync(`${outputDir}/${filename}`, Buffer.from(shot.data, "base64"));
    return metrics;
  };
  const chooseAction = async (index) => {
    await click(".s5-action-card", index);
    const targetRequired = await evaluate("Boolean(document.querySelector('.s5-target-picker select'))");
    if (targetRequired) {
      await evaluate(`(() => { const node = document.querySelector('.s5-target-picker select'); const option = [...node.options].find((item) => item.value); const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; setter.call(node, option.value); node.dispatchEvent(new Event('change', { bubbles: true })); return node.value; })()`);
      await delay(180);
    }
  };
  const confirmAndContinue = async () => {
    await click(".s5-decision-actions .s5-primary-button");
    await click(".s5-outcome-modal .s5-primary-button");
  };
  const fillBelief = async () => {
    await evaluate(`(() => {
      const select = document.querySelector('.s5-belief-select');
      const option = [...select.options].find((item) => item.value);
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, option.value);
      select.dispatchEvent(new Event('change', { bubbles: true }));
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      for (const input of document.querySelectorAll('.s5-belief-number')) {
        setter.call(input, '50');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`);
    await delay(180);
    await click(".s5-form-panel .s5-primary-button");
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await setViewport(1440, 900);
  await delay(1800);
  await click(".menu-buttons button", 1);
  await click(".profile-item", 0);
  await click(".menu-buttons button", 0);
  await click(".scenario-card:last-child .scenario-actions button:last-child");
  await click(".intro-modal .primary");
  await click(".s5-briefing .s5-primary-button");

  const initial = await capture("01-initial-1440x900.png", 1440, 900, "decision-initial");
  await chooseAction(0);
  await confirmAndContinue();
  await delay(1000);
  const postAction = await capture("02-after-action-1440x900.png", 1440, 900, "belief-after-action");

  const initialById = Object.fromEntries(initial.markers.map((marker) => [marker.convoyId, marker]));
  const postById = Object.fromEntries(postAction.markers.map((marker) => [marker.convoyId, marker]));
  const visibleIds = initial.markers.filter((marker) => marker.visible).map((marker) => marker.convoyId).sort();
  const initialAlphaDeltaSvgSeparation = Math.abs(initialById.alpha.svgCenter.y - initialById.delta.svgCenter.y);
  const initialAlphaDeltaScreenSeparation = Math.hypot(
    initialById.alpha.screenCenter.x - initialById.delta.screenCenter.x,
    initialById.alpha.screenCenter.y - initialById.delta.screenCenter.y,
  );
  const routes = {
    alpha: { from: { x: 428, y: 200 }, to: { x: 612, y: 175 } },
    delta: { from: { x: 428, y: 200 }, to: { x: 244, y: 246 } },
  };
  const postOriginOffsetsGone = ["alpha", "delta"].every((convoyId) => {
    const marker = postById[convoyId];
    const route = routes[convoyId];
    const expected = {
      x: route.from.x + (route.to.x - route.from.x) * marker.visualProgress,
      y: route.from.y + (route.to.y - route.from.y) * marker.visualProgress,
    };
    return marker.visualProgress >= 0.08
      && Math.abs(marker.svgCenter.x - expected.x) < 0.01
      && Math.abs(marker.svgCenter.y - expected.y) < 0.01;
  });

  const result = {
    browser: path.basename(chromePath),
    capturedAt: new Date().toISOString(),
    initial,
    postAction,
    initialVisibleConvoyIds: visibleIds,
    initialVisibleConvoyCount: visibleIds.length,
    initialDistinctTransforms: new Set(initial.markerTransforms).size,
    initialAlphaDeltaSvgSeparation,
    initialAlphaDeltaScreenSeparation,
    convoyMovementVerified: initial.markerTransforms.some((value, index) => value !== postAction.markerTransforms[index]),
    postVisibleConvoyCount: postAction.markers.filter((marker) => marker.visible).length,
    postOriginOffsetsGone,
  };
  fs.writeFileSync(`${outputDir}/inspection.json`, JSON.stringify(result, null, 2));
  if (!result.convoyMovementVerified) throw new Error("Convoy marker transform did not change after the committed decision.");
  if (result.initialVisibleConvoyCount !== 4 || result.initialDistinctTransforms !== 4) throw new Error("All four initial convoy markers are not independently visible.");
  if (result.initialAlphaDeltaSvgSeparation !== 24 || result.initialAlphaDeltaScreenSeparation <= 0) throw new Error("Initial alpha/delta marker deconfliction is incorrect.");
  if (result.postVisibleConvoyCount !== 4 || !result.postOriginOffsetsGone) throw new Error("Post-action convoy visibility or offset fade verification failed.");
  if (![initial, postAction].every((item) => item.noPageScroll && item.noHorizontalOverflow && item.mapRightOfControls)) throw new Error("Phase 07D browser layout verification failed. Inspect inspection.json.");
  console.log(JSON.stringify({ result: "passed", screenshots: 2, initialVisibleConvoyCount: 4, initialAlphaDeltaSvgSeparation: 24, convoyMovementVerified: true, postOriginOffsetsGone: true, outputDir }, null, 2));
} finally {
  try { socket?.close(); } catch { /* no-op */ }
  chrome.kill();
  vite.kill();
}
