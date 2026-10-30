import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

// Scenario 0 interaction tests use a disposable browser profile.
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "space-war-s0-qa-"));
const downloadDir = path.join(workDir, "downloads");
fs.mkdirSync(downloadDir);
const chromePath = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find((file) => file && fs.existsSync(file));
if (!chromePath) throw new Error("Set CHROME_PATH to a Chromium browser executable.");
const url = "http://127.0.0.1:5187";
const delay = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));
const waitFor = async (check, label) => {
  for (let index = 0; index < 150; index += 1) {
    try { const result = await check(); if (result) return result; } catch { /* page or server is loading */ }
    await delay();
  }
  throw new Error(`Timed out: ${label}`);
};
const vite = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5187", "--strictPort"], { stdio: "ignore", windowsHide: true });
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
    await waitFor(() => evaluate(`(() => { const button = [...document.querySelectorAll('button')].find((item) => item.textContent.replace(/←$/, '').trim() === ${JSON.stringify(text)} && !item.disabled); if (!button) return false; button.click(); return true; })()`), `button ${text}`);
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
  const page = await openBrowser(9238, "learning");
  const screenshotDir = "docs/screenshots/scenario0-learning";
  fs.mkdirSync(screenshotDir, { recursive: true });
  const screenshot = async (filename, width = 1440, height = 1050) => {
    await page.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 500 });
    await page.evaluate("scrollTo(0,0)");
    await delay(150);
    assert.equal(await page.evaluate("document.documentElement.scrollWidth <= innerWidth"), true, `No horizontal overflow at ${width}px`);
    const image = await page.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(screenshotDir, filename), Buffer.from(image.data, "base64"));
  };
  await page.click("شروع");
  await page.evaluate("document.querySelector('.scenario-card .scenario-actions button:not(.secondary)').click()");
  await waitFor(() => page.evaluate("!!document.querySelector('.s0-learning')"), "guided learning");
  assert.equal(await page.evaluate("!!document.querySelector('.s0-introduction[open]')"), true, "Introduction opens before the lesson");
  assert.equal(await page.evaluate("!!document.querySelector('.s0-experiment')"), false, "No exercise before introduction");
  assert.equal(await page.evaluate("document.querySelector('.s0-learning').dataset.nodeId"), "gameTheoryIntro");
  await screenshot("00-introduction-desktop.png");
  await screenshot("00-introduction-mobile.png", 390, 844);
  await page.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape" });
  await page.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape" });
  assert.equal(await page.evaluate("!!document.querySelector('.s0-introduction[open]')"), true, "Escape cannot bypass required introduction");
  await page.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab" });
  await page.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab" });
  assert.equal(await page.evaluate("document.querySelector('.s0-introduction').contains(document.activeElement)"), true, "Keyboard focus stays inside introduction");
  const readingRecords = [];
  const readAllSections = async (kind) => {
    const texts = [];
    for (let index = 0; index < 80; index += 1) {
      if (!await page.evaluate(`!!document.querySelector('[data-reading-kind="${kind}"]')`)) return texts.join("\n\n");
      assert.equal(await page.evaluate("!!document.querySelector('.s0-experiment, .s0-explorer, .s0-concept-grid, .s0-quiz-options')"), false, "Examples and selections stay unavailable throughout required reading");
      texts.push(await page.evaluate("document.querySelector('.s0-reading-page p').textContent"));
      readingRecords.push({ kind, nodeId: await page.evaluate("document.querySelector('.s0-learning').dataset.nodeId"), title: await page.evaluate("document.querySelector('.s0-reading-page h3').textContent") });
      await page.evaluate("document.querySelector('.s0-reading-next').click()");
      await delay(70);
    }
    throw new Error("Reading did not complete");
  };
  const introduction = await readAllSections("introduction");
  assert.ok(introduction.includes("به سناریو 0 خوش آمدید"));
  assert.ok(introduction.includes("چگونه بجنگید"), "The original introduction is retained to its last line");
  assert.equal(await page.evaluate("!!document.querySelector('.s0-introduction[open]')"), false);
  assert.equal(await page.evaluate("!!document.querySelector('[data-reading-kind=\"lesson\"]')"), true);
  await screenshot("08-required-reading-desktop.png");
  await screenshot("08-required-reading-mobile.png", 390, 844);
  await page.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1050, deviceScaleFactor: 1, mobile: false });
  await page.evaluate("(async () => { window.__s0definition = (await import('/src/scenarios/s0_gateway_space_wargaming/tree.ts')).S0_GatewayToSpaceWargaming; })()");
  const visited = [];
  let quizCount = 0;
  let referenceCount = 0;
  const prisonersProblem = await page.evaluate("(async () => (await import('/src/ui/components/scenario/scenario-zero/learningContent.ts')).prisonersProblem)()");
  for (let iteration = 0; iteration < 30; iteration += 1) {
    const nodeId = await page.evaluate("document.querySelector('.s0-learning').dataset.nodeId");
    const node = await page.evaluate(`window.__s0definition.nodes[${JSON.stringify(nodeId)}]`);
    visited.push(nodeId);
    if (node.type === "info") {
      if (nodeId === "warGameTypesIntro") {
        assert.equal(await page.evaluate("document.querySelector('.s0-lesson-heading h2').textContent"), "آشنایی با انواع بازی جنگ");
        assert.ok((await page.evaluate("document.querySelector('.s0-reading-page p').textContent")).startsWith("بازی‌های جنگ به انواع مختلف تقسیم می‌شوند"), "The complete introduction is presented before examples");
        assert.equal(await page.evaluate("!!document.querySelector('.s0-explorer')"), false);
        await screenshot("10-types-explanation.png");
      }
      const original = await readAllSections("lesson");
      assert.equal(original.replace(/\s/g, ""), (nodeId === "gameTheoryExample" ? prisonersProblem : node.text).replace(/\s/g, ""), `Required teaching content preserved for ${nodeId}`);
      assert.equal(await page.evaluate("document.querySelector('.s0-practice-heading h3').textContent"), "بررسی مثال");
      if (nodeId === "gameTheoryIntro") {
        await page.evaluate("document.querySelector('.s0-experiment button').click()");
        assert.ok((await page.evaluate("document.querySelector('.s0-insight').innerText")).includes("پاسخ صحیح"));
        await screenshot("01-intro-desktop.png");
        const layout = await page.evaluate("(() => { const sidebar = document.querySelector('.s0-course-panel').getBoundingClientRect(); const content = document.querySelector('.s0-content').getBoundingClientRect(); return { right: sidebar.left > content.right, position: getComputedStyle(document.querySelector('.s0-course-panel')).position }; })()");
        assert.equal(layout.right, true, "Progress panel is to the right of content");
        assert.equal(layout.position, "sticky");
        await page.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 760, deviceScaleFactor: 1, mobile: false });
        await page.evaluate("scrollTo(0,250)");
        assert.ok(await page.evaluate("document.querySelector('.s0-course-panel').getBoundingClientRect().top >= 20"), "Progress panel stays visible on scroll");
        await screenshot("02-intro-mobile.png", 390, 844);
        assert.equal(await page.evaluate("getComputedStyle(document.querySelector('.s0-progress-body')).display"), "none", "Mobile progress does not take over the reading area");
        await page.evaluate("document.querySelector('.s0-progress-toggle').click()");
        await delay();
        assert.equal(await page.evaluate("getComputedStyle(document.querySelector('.s0-progress-body')).display"), "block");
        await page.evaluate("document.querySelector('.s0-progress-toggle').click()");
        await page.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1050, deviceScaleFactor: 1, mobile: false });
      }
      if (nodeId === "gameTheoryExample") {
        const explanation = await page.evaluate("[...document.querySelectorAll('.s0-prisoner-explanation p')].map((item) => item.textContent).join(' ')");
        assert.equal(explanation.replace(/\s/g, ""), node.text.replace(/\s/g, ""), "Complete prisoner explanation appears openly after the example");
        assert.equal(await page.evaluate("!!(document.querySelector('.s0-experiment').compareDocumentPosition(document.querySelector('.s0-prisoner-explanation')) & Node.DOCUMENT_POSITION_FOLLOWING)"), true);
        for (const [first, second, expected] of [["سکوت", "سکوت", ["۱", "۱"]], ["اعتراف", "سکوت", ["۰", "۱۰"]], ["سکوت", "اعتراف", ["۱۰", "۰"]], ["اعتراف", "اعتراف", ["۵", "۵"]]]) {
          await page.evaluate(`document.querySelector('[aria-label="نفر اول: ${first}"]').click(); document.querySelector('[aria-label="نفر دوم: ${second}"]').click()`);
          await delay(60);
          assert.deepEqual(await page.evaluate("[...document.querySelectorAll('.s0-prison-term strong')].map((item) => item.textContent)"), expected);
        }
        await screenshot("03-prisoners-dilemma.png");
        await page.click("→ بازگشت به گام قبل");
        assert.equal(await page.evaluate("document.querySelector('.s0-learning').dataset.nodeId"), "gameTheoryIntro");
        assert.equal(await page.evaluate("!!document.querySelector('.s0-reading')"), false, "Returning to an acknowledged lesson does not force repeated reading");
        await page.click("ادامه با یک مثال");
      }
      const tabs = await page.evaluate("document.querySelectorAll('.s0-tabs button').length");
      if (tabs) {
        await page.evaluate("document.querySelector('.s0-tabs button').focus()");
        await page.send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowLeft" });
        await page.send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowLeft" });
        assert.equal(await page.evaluate("document.querySelectorAll('.s0-tabs button')[1].getAttribute('aria-selected')"), "true");
        await page.evaluate("document.querySelectorAll('.s0-tabs button')[2].click()");
        assert.equal(await page.evaluate("document.querySelectorAll('.s0-tabs button')[2].getAttribute('aria-selected')"), "true");
        if (["warGameExample", "warGameTypesIntro", "warGameTypesExample", "spaceWarGameIntro", "spaceWarGameExample"].includes(nodeId)) {
          for (let index = 0; index < 3; index += 1) {
            await page.evaluate(`document.querySelectorAll('.s0-tabs button')[${index}].click()`);
            await delay(60);
            assert.ok((await page.evaluate("document.querySelector('.s0-real-example p').textContent")).length > 100, "Each category has a short real-world example");
            assert.ok((await page.evaluate("document.querySelector('.s0-real-example a').href")).startsWith("https://"));
          }
          await screenshot(`${nodeId}-real-examples.png`);
        }
        if (nodeId === "warGameExample") {
          const pages = readingRecords.filter((record) => record.kind === "lesson" && record.nodeId === nodeId);
          assert.equal(pages.length, 3, "Classical, cyber and nuclear examples each occupy a complete page");
          assert.ok(pages.every(({ title }) => !title.includes("ادامه")));
        }
        if (nodeId === "spaceWarGameIntro") await screenshot("04-space-connections.png");
      }
      if (nodeId === "warGameTypesIntro") {
        assert.equal(await page.evaluate("document.querySelector('.s0-lesson-heading h2').textContent"), "رابطهٔ منافع و نقش ابهام");
        await page.click("بازگشت به توضیحات اولیه");
        assert.equal(await page.evaluate("document.querySelector('.s0-lesson-heading h2').textContent"), "آشنایی با انواع بازی جنگ");
        assert.equal(await page.evaluate("!!document.querySelector('.s0-explorer')"), false, "Revisiting the presentation restores explanation pages before examples");
        const reviewed = await readAllSections("lesson");
        assert.equal(reviewed.replace(/\s/g, ""), node.text.replace(/\s/g, ""));
        assert.ok((await page.evaluate("document.querySelector('.s0-original > div').textContent")).includes("اتحاد"), "Supplementary explanations remain available in the first page");
      }
      const nextIsQuiz = await page.evaluate(`window.__s0definition.nodes[${JSON.stringify(node.next)}]?.type === 'quiz'`);
      await page.click(nextIsQuiz ? "پاسخ به پرسش‌های این بخش" : "ادامه با یک مثال");
      if (nodeId === "warGameTypesIntro") assert.equal(await page.evaluate("document.querySelector('.s0-learning').dataset.nodeId"), "warGameTypesQuiz1", "The merged chapter proceeds directly to its questions");
      const contentPosition = await page.evaluate("({ top: document.querySelector('.s0-lesson h2').getBoundingClientRect().top, scrollY, stage: document.querySelector('.s0-learning').dataset.nodeId })");
      assert.ok(contentPosition.top < 150, `Navigation starts at lesson content: ${JSON.stringify(contentPosition)}`);
    } else if (node.type === "quiz") {
      const wrong = node.options.findIndex((option) => !option.isCorrect);
      await page.evaluate(`document.querySelectorAll('.s0-quiz-options button')[${quizCount === 0 ? wrong : node.options.findIndex((option) => option.isCorrect)}].click()`);
      const references = await page.evaluate("document.querySelectorAll('.s0-reference-link').length");
      if (references) {
        referenceCount += 1;
        assert.equal(await page.evaluate("document.querySelectorAll('.s0-quiz details').length"), 0, "No redundant example block below the question");
        await page.evaluate("document.querySelector('.s0-reference-link').focus(); document.querySelector('.s0-reference-link').click()");
        await delay();
        assert.equal(await page.evaluate("!!document.querySelector('.s0-reference-dialog[open]')"), true);
        assert.ok((await page.evaluate("document.querySelector('.s0-reference-body').textContent")).length > 40);
        if (nodeId === "spaceWarGameQuiz3") await screenshot("09-question-reference.png");
        await page.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
        await page.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
        await delay();
        assert.equal(await page.evaluate("!!document.querySelector('.s0-reference-dialog')"), false);
        assert.equal(await page.evaluate("document.activeElement.classList.contains('s0-reference-link')"), true, "Closing returns keyboard focus to the inline reference");
        assert.equal(await page.evaluate("document.querySelectorAll('.s0-quiz-options button[aria-pressed=\"true\"]').length"), 1, "Opening a reference preserves the selected answer");
      }
      await page.click("بررسی پاسخ");
      assert.ok((await page.evaluate("document.querySelector('.s0-quiz-feedback').innerText")).length > 50, "Every question has explanatory feedback");
      assert.equal(await page.evaluate("document.querySelectorAll('.s0-quiz-options .is-correct').length"), 1);
      if (quizCount === 0) await screenshot("05-quiz-feedback.png");
      quizCount += 1;
      await page.click("ادامهٔ مسیر");
    } else if (node.type === "minigame") {
      await page.click("شروع آزمایش");
      for (let card = 0; card < 6; card += 1) {
        await page.evaluate("document.querySelector('.s0-lab-options button').click()");
        if (card === 0) {
          await page.click("مشاهدهٔ راهنمای تکمیلی");
          assert.equal(await page.evaluate("document.querySelector('[aria-expanded=\"true\"]').innerText"), "بستن راهنما");
        }
        await page.click("دیدن نتیجهٔ انتخاب");
        assert.equal(await page.evaluate("!!document.querySelector('.s0-lab-feedback')"), true, "Feedback remains visible until the learner chooses to continue");
        assert.equal(await page.evaluate("[...document.querySelectorAll('h3')].some((item) => item.textContent.includes('آیا از پاسخ خود اطمینان'))"), false);
        if (card === 3) {
          assert.equal(await page.evaluate("!!document.querySelector('.s0-lab-reaction')"), true, "Opponent reaction is shown");
          assert.equal(await page.evaluate("document.querySelectorAll('.s0-lab-effects > span').length"), 3);
          await screenshot("06-lab-reaction.png");
        }
        await page.click(card === 5 ? "دیدن جمع‌بندی تمرین" : "موقعیت بعدی");
      }
      assert.equal(await page.evaluate("!!document.querySelector('.s0-lab--summary')"), true);
      await page.click("ادامه به مرحله بعد");
    } else if (node.type === "end") {
      await screenshot("07-completion-mobile.png", 390, 844);
      await page.click("پایان آموزش و انتخاب سناریو");
      break;
    } else throw new Error(`Unexpected node ${node.type}`);
  }
  assert.equal(quizCount, 14, "All original questions remain accessible");
  assert.equal(referenceCount, 9, "All explicit example, definition and introduction references are linked inline");
  assert.equal(visited.length, 23, "The teaching path excludes the duplicate page");
  assert.equal(new Set(visited).size, 23);
  assert.ok(!visited.includes("warGameTypesExample"));
  const state = await page.evaluate("JSON.parse(localStorage.getItem('space-war.profiles.v1'))");
  assert.equal(state.profiles.find(({ id }) => id === "test-player").progress, 1, "Completing learning unlocks the next released scenario");
  const events = await page.evaluate("JSON.parse(localStorage.getItem('space-war.analytics.events'))");
  assert.ok(events.some(({ type }) => type === "s0_learning_interaction"));
  assert.equal(events.filter(({ detail }) => detail?.miniGameId === "scenario0_concept_lab" && detail.cardId).length, 6, "One result per lab card, without duplicate submission");
  assert.equal(events.filter(({ type }) => type === "mini_game_summary").length, 1);
  assert.ok(events.some(({ type }) => type === "scenario_end"));
  assert.equal(events.filter(({ type, detail }) => type === "s0_reading_acknowledged" && detail.kind === "lesson").length, 8, "All seven lessons and the explicit review are acknowledged");
  assert.equal(events.filter(({ type, detail }) => type === "s0_reading_acknowledged" && detail.kind === "introduction").length, 1);
  await page.evaluate("document.querySelector('[aria-label=\"منوی سریع\"]').click()");
  await page.click("منوی اصلی");
  await page.login();
  await page.click("شروع");
  await page.evaluate("document.querySelector('.scenario-card .scenario-actions button:not(.secondary)').click()");
  await readAllSections("introduction");
  await page.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1050, deviceScaleFactor: 1, mobile: false });
  await page.click("عبور ادمین به مینی‌گیم");
  assert.equal(await page.evaluate("document.querySelector('.s0-learning').dataset.nodeId"), "conceptLab", "Admin review shortcut is retained");
  console.log(`Scenario 0 browser checks passed: required introduction dialog, all 7 lessons read before examples, merged chapter proceeds directly to questions, ${visited.length} stages, ${quizCount} quizzes, keyboard controls, lab feedback, telemetry, unlock, admin review and responsive layouts. Screenshots: ${screenshotDir}`);
} finally {
  for (const socket of sockets) socket.close();
  for (const browser of browsers) browser.kill();
  vite.kill();
}

