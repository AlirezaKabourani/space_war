import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

// All writes, imports and resets run in disposable browser profiles.
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "space-war-system-qa-"));
const downloadDir = path.join(workDir, "downloads");
fs.mkdirSync(downloadDir);
const chromePath = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find((file) => file && fs.existsSync(file));
if (!chromePath) throw new Error("Set CHROME_PATH to a Chromium browser executable.");
const url = "http://127.0.0.1:5186";
const delay = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));
const waitFor = async (check, label) => {
  for (let index = 0; index < 150; index += 1) {
    try { const result = await check(); if (result) return result; } catch { /* page or server is loading */ }
    await delay();
  }
  throw new Error(`Timed out: ${label}`);
};
const vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5186", "--strictPort"], { stdio: "ignore", windowsHide: true });
const browsers = [];
const sockets = [];

const openBrowser = async (port, name) => {
  const process = spawn(chromePath, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${path.join(workDir, name)}`, "--disable-gpu", "--no-first-run", "--no-default-browser-check", url], { stdio: "ignore", windowsHide: true });
  browsers.push(process);
  const targets = await waitFor(async () => { const response = await fetch(`http://127.0.0.1:${port}/json`); return response.ok && response.json(); }, "browser debugger");
  const target = targets.find((item) => item.type === "page");
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  sockets.push(socket);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  let requestId = 0;
  const pending = new Map();
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message)); else request.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++requestId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  };
  const ready = () => waitFor(() => evaluate("!!document.querySelector('.main-menu-card')"), "main menu");
  const click = async (text) => {
    await waitFor(() => evaluate(`(() => { const button = [...document.querySelectorAll('button')].find((item) => item.textContent.trim() === ${JSON.stringify(text)} && !item.disabled); if (!button) return false; button.click(); return true; })()`), `button ${text}`);
    await delay(100);
  };
  const input = async (selector, value) => {
    await evaluate(`(() => { const input = document.querySelector(${JSON.stringify(selector)}); if (!input) throw new Error('Missing input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await delay();
  };
  const login = async () => {
    await click("ساخت / انتخاب پروفایل");
    await evaluate("[...document.querySelectorAll('.profile-item')].find((item) => item.querySelector('.profile-name').textContent === 'ادمین').click()");
    await delay();
    await input("#admin-password", "8888");
    await click("ورود به ادمین");
    await ready();
  };
  const management = async () => { await click("مدیریت سامانه"); await waitFor(() => evaluate("!!document.querySelector('.system-management-card')"), "management panel"); };
  await ready();
  return { send, evaluate, click, input, ready, login, management };
};

try {
  await waitFor(async () => (await fetch(url)).ok, "Vite server");
  const source = await openBrowser(9236, "source");
  assert.equal(await source.evaluate("document.body.innerText.includes('مدیریت سامانه')"), false, "Players do not see management tools");
  // Build realistic source data with a completed player and current nested telemetry.
  await source.evaluate(`(() => {
    const state = JSON.parse(localStorage.getItem('space-war.profiles.v1'));
    state.profiles = state.profiles.filter((profile) => profile.id !== 'test-player');
    state.profiles.push({ id: 'player-transfer-browser', name: 'بازیکن انتقال', firstName: 'بازیکن', lastName: 'انتقال', nationalId: '0012345678', phoneNumber: '09121234567', role: 'player', scenarioCatalog: 'released', progress: 2 });
    state.activeProfileId = 'player-transfer-browser';
    localStorage.setItem('space-war.profiles.v1', JSON.stringify(state));
    localStorage.setItem('unrelated-site-state', 'source unrelated');
    location.reload();
  })()`);
  await source.ready();
  await source.login();
  await source.management();
  await source.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloadDir });
  await source.click("توقف لاگ‌برداری رفتاری");
  assert.equal(await source.evaluate("localStorage.getItem('space-war.analytics.enabled')"), "false");
  await source.click("بازگشت به منوی اصلی");
  await source.click("شروع");
  await source.evaluate("document.querySelectorAll('.scenario-card')[2].querySelector('.scenario-actions button:not(.secondary)').click()");
  await delay(200);
  if (await source.evaluate("!!document.querySelector('.intro-modal button')")) await source.evaluate("document.querySelector('.intro-modal button').click()");
  await source.click("آغاز مأموریت");
  assert.equal(await source.evaluate("JSON.parse(localStorage.getItem('space-war.analytics.events') ?? '[]').length"), 0, "Stop applies to actual modern scenario interactions");
  await source.evaluate("document.querySelector('[aria-label=\"منوی سریع\"]').click()");
  assert.equal(await source.evaluate("document.body.innerText.includes('دانلود لاگ رفتاری')"), false, "Quick menu no longer offers a log download");
  await source.management();
  await source.click("شروع لاگ‌برداری رفتاری");
  await source.click("بازگشت به منوی اصلی");
  await source.click("شروع");
  await source.evaluate("document.querySelectorAll('.scenario-card')[2].querySelector('.scenario-actions button:not(.secondary)').click()");
  await delay(200);
  if (await source.evaluate("!!document.querySelector('.intro-modal button')")) await source.evaluate("document.querySelector('.intro-modal button').click()");
  await source.click("آغاز مأموریت");
  assert.equal(await source.evaluate("JSON.parse(localStorage.getItem('space-war.analytics.events')).some((event) => event.type === 's5_v3_run_started' && event.detail.runtimeModelVersion)"), true, "Actual scenario 5 emits its current versioned payload");
  await source.evaluate("document.querySelector('[aria-label=\"منوی سریع\"]').click()");
  await source.management();
  await source.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  assert.equal(await source.evaluate("document.documentElement.scrollWidth <= innerWidth"), true);
  await source.click("دانلود لاگ رفتاری (CSV)");
  const csvPath = await waitFor(() => fs.readdirSync(downloadDir).find((filename) => filename.endsWith(".csv")), "CSV download");
  assert.ok(fs.readFileSync(path.join(downloadDir, csvPath), "utf8").includes("detail.runtimeModelVersion"));
  await source.click("دانلود پشتیبان کامل سامانه");
  const backupFile = await waitFor(() => fs.readdirSync(downloadDir).find((filename) => filename.startsWith("space-war-full-backup-") && filename.endsWith(".json")), "complete backup download");
  const backupPath = path.join(downloadDir, backupFile);
  const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));
  assert.ok(backup.entries["space-war.profiles.v1"]);
  assert.ok(!backup.entries["unrelated-site-state"]);
  await source.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.equal(await source.evaluate("document.documentElement.scrollWidth <= innerWidth"), true, "Management panel fits a phone viewport");

  const destination = await openBrowser(9237, "destination");
  await destination.evaluate("localStorage.setItem('unrelated-site-state', 'destination unrelated')");
  await destination.login();
  await destination.management();
  const upload = async (filename) => {
    const { root } = await destination.send("DOM.getDocument");
    const { nodeId } = await destination.send("DOM.querySelector", { nodeId: root.nodeId, selector: 'input[type="file"]' });
    await destination.send("DOM.setFileInputFiles", { nodeId, files: [filename] });
    await delay(250);
  };
  const invalidPath = path.join(workDir, "invalid-backup.json");
  fs.writeFileSync(invalidPath, '{"format":"something-else"}');
  const destinationProfilesBefore = await destination.evaluate("localStorage.getItem('space-war.profiles.v1')");
  await upload(invalidPath);
  assert.equal(await destination.evaluate("!!document.querySelector('.system-management-error')"), true);
  assert.equal(await destination.evaluate("localStorage.getItem('space-war.profiles.v1')"), destinationProfilesBefore);
  await upload(backupPath);
  assert.equal(await destination.evaluate("document.body.innerText.includes('پیش‌نمایش فایل:')"), true);
  assert.equal(await destination.evaluate("localStorage.getItem('space-war.profiles.v1')"), destinationProfilesBefore, "Upload does not replace data before confirmation");
  await destination.click("تأیید جایگزینی و بازیابی اطلاعات");
  await destination.ready();
  const destinationState = await destination.evaluate("JSON.parse(localStorage.getItem('space-war.profiles.v1'))");
  assert.equal(destinationState.activeProfileId, "scenario-tester", "Imported admin session is locked");
  assert.equal(destinationState.profiles.find(({ id }) => id === "player-transfer-browser").progress, 2);
  assert.equal(destinationState.profiles.some(({ id }) => id === "test-player"), false);
  assert.deepEqual(await destination.evaluate("JSON.parse(localStorage.getItem('space-war.analytics.events'))"), JSON.parse(backup.entries["space-war.analytics.events"]));
  assert.equal(await destination.evaluate("localStorage.getItem('unrelated-site-state')"), "destination unrelated");
  await destination.login();
  await destination.management();
  await destination.click("ریست سامانه");
  assert.equal(await destination.evaluate("[...document.querySelectorAll('button')].find((button) => button.textContent === 'تأیید ریست و پاکسازی کامل').disabled"), true);
  await destination.input("#reset-confirmation", "ریست");
  await destination.click("تأیید ریست و پاکسازی کامل");
  await destination.ready();
  const initialState = await destination.evaluate("JSON.parse(localStorage.getItem('space-war.profiles.v1'))");
  assert.deepEqual(initialState.profiles.map(({ id }) => id), ["admin", "test-player", "scenario-tester"]);
  assert.equal(initialState.activeProfileId, "test-player");
  assert.equal(await destination.evaluate("localStorage.getItem('space-war.analytics.events')"), null);
  assert.equal(await destination.evaluate("localStorage.getItem('space-war.system.events')"), null);
  assert.equal(await destination.evaluate("localStorage.getItem('unrelated-site-state')"), "destination unrelated");
  console.log("Browser checks passed: admin access, live scenario 5 recording/stop/start, modern CSV, complete download, isolated second-browser import/preview/validation, locked restored admin, scoped reset and mobile layout.");
} finally {
  for (const socket of sockets) socket.close();
  for (const browser of browsers) browser.kill();
  vite.kill();
}
