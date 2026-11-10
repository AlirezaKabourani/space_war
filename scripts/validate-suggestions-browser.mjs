import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

// All writes, imports and resets run in disposable browser profiles.
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "space-war-suggestions-qa-"));
const downloadDir = path.join(workDir, "downloads");
fs.mkdirSync(downloadDir);
const chromePath = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find((file) => file && fs.existsSync(file));
if (!chromePath) throw new Error("Set CHROME_PATH to a Chromium browser executable.");
const url = "http://127.0.0.1:5188";
const delay = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));
const waitFor = async (check, label) => {
  for (let index = 0; index < 150; index += 1) {
    try { const result = await check(); if (result) return result; } catch { /* page or server is loading */ }
    await delay();
  }
  throw new Error(`Timed out: ${label}`);
};
const vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5188", "--strictPort"], { stdio: "ignore", windowsHide: true });
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
    await evaluate(`(() => { const input = document.querySelector(${JSON.stringify(selector)}); if (!input) throw new Error('Missing input'); Object.getOwnPropertyDescriptor(input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : input instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event(input instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true })); })()`);
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
  const page = await openBrowser(9238, "suggestions");
  await page.send("Page.enable");
  await page.evaluate("window.alert = () => { throw new Error('Unexpected placeholder alert'); }");
  assert.equal(await page.evaluate("document.body.innerText.includes('مدیریت سامانه')"), false);
  await page.click("پیشنهاد سناریو");
  assert.equal(await page.evaluate("!!document.querySelector('.suggestion-card textarea')"), true);
  assert.equal(await page.evaluate("document.querySelector('button[type=submit]').disabled"), true);
  await page.input("#suggestion-text", "  \n  ");
  assert.equal(await page.evaluate("document.querySelector('button[type=submit]').disabled"), true);
  const scenarioText = "ایده سناریوی بازیکن تست\nخط دوم ایده";
  await page.input("#suggestion-text", scenarioText);
  await page.click("ثبت پیشنهاد");
  assert.equal(await page.evaluate("document.querySelector('[role=status]').textContent"), "پیشنهاد شما با موفقیت ثبت شد.");
  assert.equal(await page.evaluate("document.querySelector('#suggestion-text').value"), "");
  assert.equal(await page.evaluate("!!document.querySelector('.suggestion-entry')"), false, "Players cannot see the admin inbox");
  await page.click("بازگشت به منوی اصلی");
  await page.click("پیشنهادات");
  const generalText = "پیشنهاد عمومی <img src=x onerror=alert(1)>\nمتن کاربر";
  await page.input("#suggestion-text", generalText);
  await page.click("ثبت پیشنهاد");
  await page.send("Page.reload");
  await page.ready();
  assert.equal(await page.evaluate("JSON.parse(localStorage.getItem('space-war.suggestions.v1')).length"), 2);
  await page.click("ساخت / انتخاب پروفایل");
  await page.evaluate("[...document.querySelectorAll('.profile-item')].find(item => item.querySelector('.profile-name').textContent === 'تست سناریو').click()");
  await page.ready();
  await page.click("پیشنهادات");
  await page.input("#suggestion-text", "پیشنهاد کاربر دوم");
  await page.click("ثبت پیشنهاد");
  // Simulate unavailable storage; keep the draft and do not falsely report success.
  await page.input("#suggestion-text", "متن حفظ‌شده هنگام خطا");
  await page.evaluate("window.originalStorageWrite = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key === 'space-war.suggestions.v1') throw new DOMException('Quota exceeded', 'QuotaExceededError'); return window.originalStorageWrite.call(this, key, value); }");
  await page.click("ثبت پیشنهاد");
  assert.equal(await page.evaluate("document.querySelector('#suggestion-text').value"), "متن حفظ‌شده هنگام خطا");
  assert.equal(await page.evaluate("!!document.querySelector('[role=alert]') && !document.querySelector('[role=status]')"), true);
  await page.evaluate("Storage.prototype.setItem = window.originalStorageWrite");
  await page.click("بازگشت به منوی اصلی");
  await page.login();
  await page.click("پیشنهاد سناریو");
  await page.input("#suggestion-text", "ایده ادمین");
  await page.click("ثبت پیشنهاد");
  await page.click("بازگشت به منوی اصلی");
  await page.management();
  const texts = () => page.evaluate("[...document.querySelectorAll('.suggestion-entry-text')].map(item => item.textContent)");
  assert.equal((await texts()).length, 0, "Management stays compact with suggestions saved");
  assert.equal(await page.evaluate("!!document.querySelector('#suggestion-user-filter')"), false);
  await page.click("مشاهده پیشنهادات");
  assert.equal(await page.evaluate("document.querySelector('.screen-title').textContent"), "پیشنهادهای کاربران");
  assert.equal((await texts()).length, 4, "Admin sees every user's suggestions");
  assert.ok((await texts()).includes(generalText));
  assert.equal(await page.evaluate("!!document.querySelector('.suggestion-entry-text img')"), false, "Suggestion markup remains plain text");
  await page.input("#suggestion-kind-filter", "scenario");
  assert.equal((await texts()).length, 2);
  await page.input("#suggestion-user-filter", "test-player");
  assert.deepEqual(await texts(), [scenarioText], "User and type filters compose");
  await page.input("#suggestion-kind-filter", "general");
  assert.deepEqual(await texts(), [generalText]);
  await page.input("#suggestion-user-filter", "scenario-tester");
  assert.deepEqual(await texts(), ["پیشنهاد کاربر دوم"]);
  await page.input("#suggestion-kind-filter", "scenario");
  assert.equal((await texts()).length, 0);
  assert.equal(await page.evaluate("document.body.innerText.includes('پیشنهادی با این فیلترها پیدا نشد.')"), true);
  await page.input("#suggestion-kind-filter", "all");
  await page.input("#suggestion-user-filter", "all");
  for (const width of [1440, 390]) {
    await page.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width === 390 });
    assert.equal(await page.evaluate("document.documentElement.scrollWidth <= innerWidth"), true, `Admin inbox fits ${width}px`);
  }
  await page.click("بازگشت به مدیریت سامانه");
  assert.equal(await page.evaluate("document.querySelector('.screen-title').textContent"), "مدیریت سامانه");
  assert.equal((await texts()).length, 0, "Returning hides the inbox and filters");
  await page.click("بازگشت به منوی اصلی");
  await page.click("ساخت / انتخاب پروفایل");
  await page.evaluate("[...document.querySelectorAll('.profile-item')].find(item => item.querySelector('.profile-name').textContent === 'بازیکن تست').click()");
  await page.ready();
  assert.equal(await page.evaluate("document.body.innerText.includes('مدیریت سامانه')"), false);
  assert.equal(await page.evaluate("!!document.querySelector('.suggestions-management')"), false);
  await page.click("پیشنهادات");
  assert.equal(await page.evaluate("document.documentElement.scrollWidth <= innerWidth"), true, "Player form fits mobile");
  await page.send("Page.reload");
  await page.ready();
  await page.login();
  await page.management();
  await page.click("مشاهده پیشنهادات");
  assert.equal((await texts()).length, 4, "Persisted inbox survives reload, logout and login");
  console.log("Browser suggestion forms, whitespace validation, success/error states, multiple profiles, admin-only inbox, combined filters, plain-text rendering, reload persistence and mobile layouts passed.");
} finally {
  for (const socket of sockets) socket.close();
  for (const browser of browsers) browser.kill();
  vite.kill();
  // The disposable browser profile contains no user data and is kept in the OS temp directory.
}
