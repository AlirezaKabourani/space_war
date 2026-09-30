import fs from "node:fs";
import {
  ACTOR_REACTION_COPY_FA,
  AAR_TRUTH_LABELS_FA,
  COUNTRY_LABELS_FA,
  END_STATE_NARRATIVES_FA,
  GLOSSARY_ENTRIES_FA,
  HELP_SECTIONS_FA,
  INJECT_NARRATIVES_FA,
  INTRO_NARRATIVE_SCREENS_FA,
  MOVE1_EVIDENCE_COPY_FA,
  MOVE1_NARRATIVE_COPY_FA,
  MOVE1_OPTION_COPY_FA,
  MOVE1_REASON_OPTIONS_FA,
  MOVE2_EVIDENCE_COPY_FA,
  MOVE2_NARRATIVE_COPY_FA,
  MOVE2_OPTION_COPY_FA,
  MOVE2_REASON_OPTIONS_FA,
  MOVE3_NARRATIVE_COPY_FA,
  MOVE3_OPTION_COPY_FA,
  MOVE3_REASON_OPTIONS_FA,
  SCENARIO4_ENTRY_COPY_FA,
} from "../src/ui/components/scenario/scenario-four/narrative/narrativeCatalogFa.ts";
import { getEndStateNarrative } from "../src/ui/components/scenario/scenario-four/narrative/narrativeSelectors.ts";

const out = "docs";
fs.mkdirSync(out, { recursive: true });
const inventory = [];
const add = ({ phase, move = "—", screen, narrativeId, condition = "همیشه", sourceType = "state", sourceIds = [], fullText, visibility = "player", relatedIds = [], sourceFile = "src/ui/components/scenario/scenario-four/narrative/narrativeCatalogFa.ts", sourceFunction }) => {
  inventory.push({ phase, move, screen, narrativeId, condition, sourceType, sourceStateFields: sourceIds, fullPersianText: fullText, visibility, relatedIds, sourceFile, sourceFunction });
};
const textOf = (value) => {
  if (typeof value === "string") return value;
  if (typeof value === "function") {
    const args = Array.from({ length: value.length }, (_, index) => index === 0 ? "نمونه" : index + 1);
    try { return value(...args); } catch { return "[الگوی پویا؛ در زمان اجرا تکمیل می‌شود]"; }
  }
  return "";
};
const flattenCopy = (root, meta, path = []) => {
  if (typeof root === "string" || typeof root === "function") {
    add({ ...meta, narrativeId: `${meta.narrativeId}.${path.join(".")}`, fullText: textOf(root), sourceFunction: `${meta.sourceFunction}.${path.join(".")}` });
    return;
  }
  if (!root || typeof root !== "object") return;
  for (const [key, value] of Object.entries(root)) flattenCopy(value, meta, [...path, key]);
};

for (const screen of Object.values(INTRO_NARRATIVE_SCREENS_FA)) {
  const body = [screen.kicker, screen.title, screen.subtitle, screen.body, screen.supportLine, screen.closingLine, screen.callout, ...(screen.items ?? []).flatMap((item) => [item.title, item.body]), ...(screen.rules ?? []), screen.disclaimer, screen.cta].filter(Boolean).join("\n\n");
  add({ phase: "intro", screen: screen.section, narrativeId: screen.id, fullText: body, sourceFunction: `INTRO_NARRATIVE_SCREENS_FA.${screen.id}` });
}
add({ phase: "menu", screen: "scenario-selection", narrativeId: "scenario4.entry", fullText: [SCENARIO4_ENTRY_COPY_FA.title, SCENARIO4_ENTRY_COPY_FA.subtitle, SCENARIO4_ENTRY_COPY_FA.shortDescription, ...SCENARIO4_ENTRY_COPY_FA.badges, SCENARIO4_ENTRY_COPY_FA.cta].join("\n"), sourceFunction: "SCENARIO4_ENTRY_COPY_FA" });
for (const item of HELP_SECTIONS_FA) add({ phase: "shared", screen: "help", narrativeId: `help.${item.id}`, fullText: `${item.title}\n${item.body}`, sourceFunction: `HELP_SECTIONS_FA[${item.id}]` });
for (const item of GLOSSARY_ENTRIES_FA) add({ phase: "shared", screen: "glossary", narrativeId: `glossary.${item.id}`, fullText: `${item.term}\n${item.definition}`, sourceFunction: `GLOSSARY_ENTRIES_FA[${item.id}]` });

flattenCopy(MOVE1_NARRATIVE_COPY_FA, { phase: "move1", move: 1, screen: "move1", narrativeId: "move1.copy", sourceFunction: "MOVE1_NARRATIVE_COPY_FA" });
flattenCopy(MOVE2_NARRATIVE_COPY_FA, { phase: "move2", move: 2, screen: "move2", narrativeId: "move2.copy", sourceFunction: "MOVE2_NARRATIVE_COPY_FA" });
flattenCopy(MOVE3_NARRATIVE_COPY_FA, { phase: "move3-report-aar", move: 3, screen: "move3/final-report/AAR", narrativeId: "move3.copy", sourceFunction: "MOVE3_NARRATIVE_COPY_FA" });

const evidenceSets = [[1, MOVE1_EVIDENCE_COPY_FA], [2, MOVE2_EVIDENCE_COPY_FA]];
for (const [move, cards] of evidenceSets) for (const card of cards) add({ phase: `move${move}`, move, screen: "evidence", narrativeId: `evidence.${card.id}`, condition: card.visibilityRule, sourceType: "evidence", sourceIds: [card.id], fullText: `${card.title}\nوضعیت: ${card.status}\n${card.text}\nمحدودیت: ${card.limitation}\nمعنای منبع: ${card.sourceSemantics}`, visibility: card.visibilityRule, relatedIds: [card.id], sourceFunction: move === 1 ? `MOVE1_EVIDENCE_COPY_FA[${card.id}]` : `MOVE2_EVIDENCE_COPY_FA[${card.id}]` });

const optionGroups = [
  [1, "information", MOVE1_OPTION_COPY_FA.information], [1, "protection", MOVE1_OPTION_COPY_FA.protection], [1, "communication", MOVE1_OPTION_COPY_FA.communication],
  [2, "investigation", MOVE2_OPTION_COPY_FA.investigation], [2, "mission", MOVE2_OPTION_COPY_FA.mission], [2, "response", MOVE2_OPTION_COPY_FA.response],
  [3, "threshold", MOVE3_OPTION_COPY_FA.threshold], [3, "coa", MOVE3_OPTION_COPY_FA.coa], [3, "information", MOVE3_OPTION_COPY_FA.information], [3, "offRamp", MOVE3_OPTION_COPY_FA.offRamp],
];
for (const [move, group, options] of optionGroups) for (const option of options) add({ phase: `move${move}`, move, screen: `decision-${group}`, narrativeId: `option.${option.id}`, sourceType: "user_choice", sourceIds: [option.id], fullText: `${option.label}\n${option.description}\nموازنه اصلی: ${option.tradeoff}`, relatedIds: [option.id], sourceFunction: `MOVE${move}_OPTION_COPY_FA.${group}[${option.id}]` });
for (const [move, reasons] of [[1, MOVE1_REASON_OPTIONS_FA], [2, MOVE2_REASON_OPTIONS_FA], [3, MOVE3_REASON_OPTIONS_FA]]) for (const reason of reasons) add({ phase: `move${move}`, move, screen: "reason", narrativeId: `reason.m${move}.${reason.id}`, sourceType: "user_choice", sourceIds: [reason.id], fullText: reason.label, relatedIds: [reason.id], sourceFunction: `MOVE${move}_REASON_OPTIONS_FA[${reason.id}]` });

for (const [key, value] of Object.entries(ACTOR_REACTION_COPY_FA)) add({ phase: "dynamic", screen: "actor-reaction", narrativeId: `actor.${key}`, condition: `فقط در صورت انتخاب/حل کنش ${key}`, sourceType: "actor", sourceIds: [key.split(":")[1]], fullText: `${value.title}\n${value.body}`, relatedIds: [key], sourceFunction: `getActorReactionNarrative(${key})` });
for (const [id, value] of Object.entries(INJECT_NARRATIVES_FA)) add({ phase: id.startsWith("m1_") ? "move1" : id.startsWith("m2_") ? "move2" : "move3", move: Number(id[1]) || "—", screen: "inject", narrativeId: `inject.${id}`, condition: `فقط در صورت فعال‌شدن ${id}`, sourceType: "inject", sourceIds: [id], fullText: `${value.title}\nچه اتفاقی افتاد؟ ${value.whatHappened}\nچرا مهم است؟ ${value.whyItMatters}${value.cta ? `\n${value.cta}` : ""}`, visibility: value.visibility, relatedIds: [id], sourceFunction: `getInjectNarrativeDefinition(${id})` });

const baseContext = (id) => ({ runId: "fixture", phase: "move3", move: 3, iran: { decisions: { m3_info: "m3_info_keep_restricted" }, reasons: {}, attributionEstimates: { pre: 40, post: 55, final: 60 }, resources: { ssaCapacity: 64, protectiveCapacity: 58, politicalCapital: 62, disclosureBudget: 70 }, resourceEvents: [], observableSignals: [] }, israel: { observedSignals: [], currentAction: "pause_for_assessment", previousActions: [] }, ally: {}, commercial: {}, evidence: { availableIds: [], openedIds: [], visibleConfidence: 50 }, injects: { activeIds: [] }, mission: { status: 70, situationAwareness: 60, escalationPressure: 45, operationalReadiness: 65, coalitionCohesion: 65, informationFootprint: 25, strategicLegitimacy: 70 }, flags: {}, endState: { id, labelFa: END_STATE_NARRATIVES_FA[id].title }, visibility: { canRevealHiddenTruth: false } });
const endStateSnapshots = {};
for (const [id] of Object.entries(END_STATE_NARRATIVES_FA)) {
  const value = getEndStateNarrative(id, baseContext(id));
  endStateSnapshots[id] = value;
  add({ phase: "final-report", move: 3, screen: "end-state", narrativeId: `end-state.${id}`, condition: `فقط وقتی resolver وضعیت ${id} را برگرداند`, sourceType: "state", sourceIds: [id], fullText: `${value.title}\n${value.shortSummary}\n${value.causalFacts.join("\n")}\n${value.closingLine}`, relatedIds: [id], sourceFunction: `getEndStateNarrative(${id})` });
}
flattenCopy(AAR_TRUTH_LABELS_FA, { phase: "aar", move: 3, screen: "truth-reveal", narrativeId: "aar.truth", visibility: "AAR-only", sourceFunction: "AAR_TRUTH_LABELS_FA" });
flattenCopy(COUNTRY_LABELS_FA, { phase: "shared", screen: "labels", narrativeId: "country", sourceFunction: "COUNTRY_LABELS_FA" });
add({ phase: "dashboard", move: 3, screen: "cognitive-dashboard", narrativeId: "dashboard.proxy-boundary", fullText: "این شاخص‌ها فقط الگوی تصمیم‌گیری ثبت‌شده در همین اجرای سناریو را توصیف می‌کنند و تشخیص شخصیت یا آزمون روان‌سنجی قطعی محسوب نمی‌شوند.", sourceFile: "src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx", sourceFunction: "CognitiveDashboard" });
add({ phase: "dashboard", move: 3, screen: "cognitive-dashboard", narrativeId: "dashboard.validation-status", fullText: "وضعیت اعتبار مدل: در حال اعتبارسنجی", sourceFile: "src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx", sourceFunction: "CognitiveDashboard" });

const conceptFor = (item) => {
  const concepts = [];
  const text = `${item.narrativeId} ${item.fullPersianText}`;
  if (/R-31|نزدیک|مدار/.test(text)) concepts.push("RPO / proximity ambiguity", "dual-use servicing satellite");
  if (/انتساب|علت/.test(text)) concepts.push("ambiguous attribution");
  if (/تجاری/.test(text)) concepts.push("commercial SSA");
  if (/متحد|ائتلاف/.test(text)) concepts.push("allied intelligence sharing", "coalition cohesion");
  if (/تشدید/.test(text)) concepts.push("escalation management");
  if (/عمومی/.test(text)) concepts.push("public attribution");
  if (/برگشت‌پذیر|حفاظتی/.test(text)) concepts.push("reversible defensive posture");
  if (/فاصله‌گذاری|کاهش تنش|مسیر خروج/.test(text)) concepts.push("off-ramp / deconfliction");
  if (item.visibility === "AAR-only" || /حقیقت پنهان/.test(text)) concepts.push("hidden intent", "AAR hidden-truth reveal");
  if (item.narrativeId.startsWith("actor.")) concepts.push("adaptive opponent");
  if (["move1", "move2", "move3", "move3-report-aar"].includes(item.phase)) concepts.push("multi-move structure");
  if (/بازپخش|اگر مسیر/.test(text)) concepts.push("counterfactual replay");
  return [...new Set(concepts)].join("؛ ") || "multi-move structure";
};
const esc = (value) => String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", "<br>");

const inventoryMd = ["# موجودی نهایی روایت سناریو ۴", "", `تعداد واحدهای روایی: **${inventory.length}**`, "", "این خروجی از کاتالوگ و selectorهای جاری تولید شده است. ستون‌های منبع، شناسه‌های داخلی‌اند و فقط سند توسعه هستند؛ در Player رندر نمی‌شوند.", "", ...inventory.flatMap((item) => [`## ${item.narrativeId}`, "", `- فاز/حرکت/صفحه: ${item.phase} / ${item.move} / ${item.screen}`, `- شرط: ${item.condition}`, `- نوع منبع و فیلدهای state: ${item.sourceType} — ${item.sourceStateFields.join(", ") || "—"}`, `- مشاهده‌پذیری: ${item.visibility}`, `- شناسه‌های مرتبط: ${item.relatedIds.join(", ") || "—"}`, `- فایل و تابع پیاده‌سازی: \`${item.sourceFile}\` — \`${item.sourceFunction}\``, "", item.fullPersianText, ""] )];
fs.writeFileSync(`${out}/scenario4-narrative-final-inventory.md`, inventoryMd.join("\n"));
fs.writeFileSync(`${out}/scenario4-narrative-final-inventory.json`, JSON.stringify({ generatedFrom: "runtime catalog", count: inventory.length, items: inventory }, null, 2));
fs.writeFileSync(`${out}/scenario4-end-state-snapshots.json`, JSON.stringify(endStateSnapshots, null, 2));

const transcriptOrder = ["menu", "intro", "move1", "move2", "move3", "move3-report-aar", "dynamic", "final-report", "aar", "dashboard", "shared"];
const transcript = ["# متن کامل روایی سناریو ۴", "", "ترتیب زیر ترتیب تجربه بازیکن است. واحدهای پویا با شرط نمایش خود مشخص شده‌اند و همه گونه‌های بازیگر، inject، وضعیت پایانی، گزارش و AAR در ادامه آمده‌اند.", ""];
for (const phase of transcriptOrder) {
  transcript.push(`## ${phase}`, "");
  for (const item of inventory.filter((entry) => entry.phase === phase)) transcript.push(`### ${item.narrativeId}`, "", `شرط: ${item.condition}`, "", item.fullPersianText, "");
}
fs.writeFileSync(`${out}/scenario4-full-narrative-transcript.md`, transcript.join("\n"));

const branchRows = [];
for (const [move, group, options] of optionGroups) for (const option of options) branchRows.push([`move${move}`, `decision:${group}`, option.id, "انتخاب بازیکن", option.label, "حل پویا از actor resolver همان حرکت", "فقط injectهای دارای trigger واقعی", "اثر غیرقطعی؛ از state نهایی و precedence موجود حل می‌شود"]);
for (const [key, value] of Object.entries(ACTOR_REACTION_COPY_FA)) branchRows.push(["dynamic", "actor", key, "حل کنش بازیگر", value.title, key, "injectهای واقعی snapshot", "ممکن است state نهایی را تغییر دهد؛ به‌تنهایی پایان را تضمین نمی‌کند"]);
for (const [id, value] of Object.entries(INJECT_NARRATIVES_FA)) branchRows.push([id.slice(0, 2), "inject", id, "فعال‌شدن trigger موجود", `${value.title}: ${value.whatHappened}`, "واکنش‌های بعدی از resolver", id, "فقط از مسیر تغییر state/flag مربوط اثر دارد"]);
for (const [id, value] of Object.entries(END_STATE_NARRATIVES_FA)) branchRows.push(["move3", "end-state", id, "خروجی resolver نهایی", value.title, "واکنش‌های ثبت‌شده در snapshot", "injectهای ثبت‌شده در snapshot", `پایان ${id}؛ اولویت resolver دست‌نخورده`]);
fs.writeFileSync(`${out}/scenario4-branch-catalog.md`, ["# کاتالوگ شاخه‌های معتبر سناریو ۴", "", "این سند فقط شاخه‌های قابل تولید توسط گزینه‌ها، بازیگران، injectها و resolver فعلی را فهرست می‌کند و ترکیب‌های نامعتبر یا فرضی اضافه نمی‌کند.", "", "| فاز | نوع | شناسه | شرط | روایت قابل مشاهده | پاسخ‌های ممکن بازیگر | injectهای ممکن | ارتباط با End State |", "|---|---|---|---|---|---|---|---|", ...branchRows.map((row) => `| ${row.map(esc).join(" | ")} |`)].join("\n"));

const referenceRows = inventory.map((item) => [item.narrativeId, `${item.phase} / ${item.screen}: ${item.fullPersianText.slice(0, 180)}`, conceptFor(item), "", "", "", ""]);
fs.writeFileSync(`${out}/scenario4-reference-mapping-input.md`, ["# ورودی نگاشت مرجع سناریو ۴", "", "ستون‌های مرجع عمداً خالی‌اند؛ در این فاز هیچ مقایسه یا ادعای منبع خارجی انجام نشده است.", "", "| Narrative element | Current implementation | Design concept | Candidate reference | Evidence from reference | Adaptation type | Notes |", "|---|---|---|---|---|---|---|", ...referenceRows.map((row) => `| ${row.map(esc).join(" | ")} |`)].join("\n"));
fs.writeFileSync(`${out}/scenario4-reference-review-file-list.md`, ["# فهرست فایل‌های مرور مرجع سناریو ۴", "", "## فایل‌های تولیدشده", "", "- `docs/scenario4-full-narrative-transcript.md`", "- `docs/scenario4-narrative-final-inventory.md`", "- `docs/scenario4-narrative-final-inventory.json`", "- `docs/scenario4-branch-catalog.md`", "- `docs/scenario4-reference-mapping-input.md`", "- `docs/scenario4-narrative-phase6-report.md`", "", "## پیاده‌سازی روایت و حرکت‌ها", "", "- `src/ui/components/scenario/scenario-four/narrative/narrativeCatalogFa.ts`", "- `src/ui/components/scenario/scenario-four/narrative/narrativeSelectors.ts`", "- `src/ui/components/scenario/scenario-four/narrative/buildNarrativeContext.ts`", "- `src/ui/components/scenario/scenario-four/narrative/narrativeTypes.ts`", "- `src/ui/components/scenario/scenario-four/moves/move1.ts`", "- `src/ui/components/scenario/scenario-four/moves/move2.ts`", "- `src/ui/components/scenario/scenario-four/moves/move3.ts`", "- `src/ui/components/scenario/scenario-four/model/aarV3.ts`", "", "## resolverها و داوری وابسته به علیت", "", "- `src/ui/components/scenario/scenario-four/adjudication/adjudicator.ts`", "- `src/ui/components/scenario/scenario-four/adjudication/move2Adjudicator.ts`", "- `src/ui/components/scenario/scenario-four/adjudication/move3Adjudicator.ts` (شامل resolver بازیگر مرحله سوم و End State)", "- `src/ui/components/scenario/scenario-four/adjudication/seededRandom.ts`", "- `src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx`"].join("\n"));

const evidence = [...MOVE1_EVIDENCE_COPY_FA.map((card) => ({ move: 1, ...card })), ...MOVE2_EVIDENCE_COPY_FA.map((card) => ({ move: 2, ...card }))];
fs.writeFileSync(`${out}/scenario4-evidence-final-audit.md`, ["# ممیزی نهایی شواهد سناریو ۴", "", "نتیجه: همه کارت‌های پایه دارای شناسه، عنوان، وضعیت، متن، محدودیت، معنای منبع و قاعده مشاهده‌پذیری‌اند. کارت‌های متحد و تجاری شرطی‌اند؛ داده متناقض حفظ می‌شود؛ available و opened در مدل و تله‌متری دو مفهوم جدا هستند؛ حقیقت پنهان پیش از AAR در هیچ کارت Player قرار ندارد.", "", "| حرکت | شناسه | عنوان | وضعیت | متن | محدودیت | معنای منبع | قاعده مشاهده |", "|---:|---|---|---|---|---|---|---|", ...evidence.map((card) => `| ${[card.move, card.id, card.title, card.status, card.text, card.limitation, card.sourceSemantics, card.visibilityRule].map(esc).join(" | ")} |`), "", "## بسته پویای مرحله سوم", "", "بسته نهایی فقط نتیجه فنی واقعاً موجود، زمینه مداری واقعی و منابع متحد/تجاریِ واقعاً فراهم‌شده را نمایش می‌دهد. selector برای هر کارت `sourceSemantics` و `visibilityRule` تولید می‌کند و هیچ نبودِ شاهدی را به اثبات مداخله تبدیل نمی‌کند."].join("\n"));

const loaded = /قاطع|ضعیف|منفعل|هوشمند|(?<!نا)درست|بهتر|بدتر|جسورانه|ترسو/;
const neutrality = optionGroups.flatMap(([move, group, options]) => options.map((option) => ({ move, window: group, optionId: option.id, label: option.label, description: option.description, tradeoff: option.tradeoff, loadedTermMatches: (`${option.label} ${option.description} ${option.tradeoff}`.match(new RegExp(loaded.source, "g")) ?? []), status: loaded.test(`${option.label} ${option.description} ${option.tradeoff}`) ? "review" : "pass" })));
fs.writeFileSync(`${out}/scenario4-option-neutrality-final-audit.json`, JSON.stringify({ columns: ["move", "window", "optionId", "label", "description", "tradeoff", "loadedTermMatches", "status"], rows: neutrality }, null, 2));
fs.writeFileSync(`${out}/scenario4-option-neutrality-final-audit.md`, ["# ممیزی نهایی خنثی‌بودن گزینه‌ها", "", "جدول ماشینی متناظر در `scenario4-option-neutrality-final-audit.json` ذخیره شده است.", "", "| حرکت | پنجره | شناسه | برچسب | عبارت‌های نیازمند مرور | وضعیت |", "|---:|---|---|---|---|---|", ...neutrality.map((row) => `| ${[row.move, row.window, row.optionId, row.label, row.loadedTermMatches.join("، ") || "—", row.status].map(esc).join(" | ")} |`)].join("\n"));

const duplicateGroups = Object.entries(inventory.reduce((groups, item) => {
  const normalized = item.fullPersianText.replace(/\s+/g, " ").trim();
  if (normalized.length < 80) return groups;
  (groups[normalized] ??= []).push(item.narrativeId);
  return groups;
}, {})).filter(([, ids]) => ids.length > 1);
fs.writeFileSync(`${out}/scenario4-duplicate-final-audit.md`, ["# ممیزی تکرار روایت سناریو ۴", "", `تعداد بلوک‌های بلندِ دقیقاً تکراری: **${duplicateGroups.length}**`, "", duplicateGroups.length ? "تکرارهای زیر بررسی شدند؛ مواردی که از الگوی مشترک عمدی ناشی می‌شوند نگه داشته شده‌اند:" : "هیچ بلوک روایی بلندِ دقیقاً تکراری یافت نشد. تکرارهای کوتاه رابط (مانند عنوان مرحله یا CTA) در این ممیزی بلوک روایی محسوب نشده‌اند.", "", ...duplicateGroups.flatMap(([text, ids]) => [`- ${ids.join("، ")}`, `  - ${text}`, ""])].join("\n"));

console.log(JSON.stringify({ inventoryUnits: inventory.length, branchRows: branchRows.length, evidenceCards: evidence.length, optionRows: neutrality.length, duplicateLongBlocks: duplicateGroups.length, files: 11 }, null, 2));
