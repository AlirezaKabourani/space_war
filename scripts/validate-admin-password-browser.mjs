import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

// All writes, imports and resets run in disposable browser profiles.
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "space-war-admin-password-qa-"));
const downloadDir = path.join(workDir, "downloads");
fs.mkdirSync(downloadDir);
const chromePath = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find((file) => file && fs.existsSync(file));
if (!chromePath) throw new Error("Set CHROME_PATH to a Chromium browser executable.");
const url = "http://127.0.0.1:5189";
const delay = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));
const waitFor = async (check, label) => {
  for (let index = 0; index < 150; index += 1) {
    try { const result = await check(); if (result) return result; } catch { /* page or server is loading */ }
    await delay();
  }
  throw new Error(`Timed out: ${label}`);
};
const vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5189", "--strictPort"], { stdio: "ignore", windowsHide: true });
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
  const page = await openBrowser(9239, "password");
  await page.send("Page.enable");
  assert.equal(await page.evaluate("!!document.querySelector('.admin-password-form')"), false, "Player cannot change the admin password");
  await page.login();
  await page.management();
  assert.equal(await page.evaluate("document.querySelector('#admin-current-password').type === 'password' && document.querySelector('#admin-new-password').type === 'password'"), true);
  assert.equal(await page.evaluate("document.querySelector('.admin-password-form button[type=submit]').disabled"), true);
  const newPassword = "Browser-new-رمز-۱۲۳";
  await page.input("#admin-current-password", "incorrect-current");
  await page.input("#admin-new-password", newPassword);
  await page.click("ذخیره رمز جدید");
  await waitFor(() => page.evaluate("document.querySelector('.admin-password-form [role=alert]')?.textContent.includes('رمز فعلی')"), "invalid current password error");
  assert.equal(await page.evaluate("localStorage.getItem('space-war.admin-password.v1')"), null);
  await page.input("#admin-current-password", "۸۸۸۸");
  await page.input("#admin-new-password", "8888");
  await page.click("ذخیره رمز جدید");
  await waitFor(() => page.evaluate("document.querySelector('.admin-password-form [role=alert]')?.textContent.includes('متفاوت')"), "same password error");
  await page.input("#admin-new-password", newPassword);
  // A failed persistent write must not announce success or replace the old password.
  await page.evaluate("window.originalStorageWrite = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key === 'space-war.admin-password.v1') throw new DOMException('Quota exceeded', 'QuotaExceededError'); return window.originalStorageWrite.call(this, key, value); }");
  await page.click("ذخیره رمز جدید");
  await waitFor(() => page.evaluate("document.querySelector('.admin-password-form [role=alert]')?.textContent.includes('ذخیره نشد')"), "storage failure error");
  assert.equal(await page.evaluate("localStorage.getItem('space-war.admin-password.v1')"), null);
  assert.equal(await page.evaluate("!!document.querySelector('.admin-password-form [role=status]')"), false);
  await page.evaluate("Storage.prototype.setItem = window.originalStorageWrite");
  await page.click("ذخیره رمز جدید");
  await waitFor(() => page.evaluate("document.querySelector('.admin-password-form [role=status]')?.textContent.includes('موفقیت')"), "password saved");
  assert.equal(await page.evaluate("document.querySelector('#admin-current-password').value === '' && document.querySelector('#admin-new-password').value === ''"), true);
  assert.equal(await page.evaluate(`localStorage.getItem('space-war.admin-password.v1').includes(${JSON.stringify(newPassword)})`), false);
  const audit = await page.evaluate("JSON.parse(localStorage.getItem('space-war.system.events')).filter(entry => entry.type === 'admin_password_changed')");
  assert.equal(audit.length, 1);
  assert.ok(!JSON.stringify(audit).includes(newPassword));
  assert.equal(audit[0].detail, undefined, "Audit does not include password data");
  await page.send("Page.reload");
  await page.ready();
  assert.equal(await page.evaluate("document.body.innerText.includes('مدیریت سامانه')"), false, "Reload still requires an admin login");
  await page.click("ساخت / انتخاب پروفایل");
  await page.evaluate("[...document.querySelectorAll('.profile-item')].find(item => item.querySelector('.profile-name').textContent === 'ادمین').click()");
  await page.input("#admin-password", "8888");
  await page.click("ورود به ادمین");
  await waitFor(() => page.evaluate("document.querySelector('#admin-password-error')?.textContent.includes('نادرست')"), "old password denied after reload");
  await page.input("#admin-password", "Browser-new-رمز-123");
  await page.click("ورود به ادمین");
  await page.ready();
  await page.management();
  for (const width of [1440, 390]) {
    await page.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width === 390 });
    assert.equal(await page.evaluate("document.documentElement.scrollWidth <= innerWidth"), true, `Password form fits ${width}px`);
  }
  // A second change confirms that subsequent updates verify the newly saved password.
  await page.input("#admin-current-password", "8888");
  await page.input("#admin-new-password", "second-password");
  await page.click("ذخیره رمز جدید");
  await waitFor(() => page.evaluate("document.querySelector('.admin-password-form [role=alert]')?.textContent.includes('فعلی')"), "old current password denied");
  await page.input("#admin-current-password", "Browser-new-رمز-123");
  await page.click("ذخیره رمز جدید");
  await waitFor(() => page.evaluate("document.querySelector('.admin-password-form [role=status]')?.textContent.includes('موفقیت')"), "second password saved");
  assert.equal(await page.evaluate("(async () => { const { verifyAdminPassword } = await import('/src/services/storage/adminPasswordStorage.ts'); return await verifyAdminPassword('second-password') && !await verifyAdminPassword('Browser-new-رمز-123'); })()"), true);
  console.log("Browser admin password form: masked inputs, current password validation, failed storage, success, secret-free auditing, persistent new-password login, old-password denial, repeated changes and mobile layout passed.");
} finally {
  for (const socket of sockets) socket.close();
  for (const browser of browsers) browser.kill();
  vite.kill();
}
