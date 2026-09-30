import assert from "node:assert/strict";
import fs from "node:fs";
import {
  GLOSSARY_ENTRIES_FA,
  HELP_SECTIONS_FA,
  INTRO_NARRATIVE_SCREENS_FA,
  SCENARIO4_ENTRY_COPY_FA,
} from "../src/ui/components/scenario/scenario-four/narrative/narrativeCatalogFa.ts";
import { SCENARIO_FICTION_DISCLAIMER_FA } from "../src/ui/components/scenario/scenario-four/model/displayLabelsFa.ts";

const expectedScreenOrder = [
  "intro_title",
  "intro_narrative",
  "intro_role",
  "intro_objectives",
  "intro_how_to",
  "intro_rules",
];
assert.deepEqual(Object.keys(INTRO_NARRATIVE_SCREENS_FA), expectedScreenOrder, "All six Intro screens must exist in order");

const expectedCtas = [
  "ادامه",
  "نقش من چیست؟",
  "اهداف مأموریت",
  "چگونه بازی می‌کنم؟",
  "قواعد سناریو",
  "آغاز مرحله اول: نزدیک‌شدن",
];
assert.deepEqual(expectedScreenOrder.map((id) => INTRO_NARRATIVE_SCREENS_FA[id].cta), expectedCtas, "Intro CTA order changed");
assert.equal(INTRO_NARRATIVE_SCREENS_FA.intro_objectives.items?.length, 6, "Objectives must render six compact cards");
assert.equal(INTRO_NARRATIVE_SCREENS_FA.intro_how_to.items?.length, 5, "How-to-play must render five cards");
assert.equal(INTRO_NARRATIVE_SCREENS_FA.intro_rules.rules?.length, 5, "Rules screen must render five expectations");
assert.equal(INTRO_NARRATIVE_SCREENS_FA.intro_rules.disclaimer, SCENARIO_FICTION_DISCLAIMER_FA, "Intro disclaimer missing");
assert.equal(HELP_SECTIONS_FA.filter((item) => item.id === "disclaimer")[0]?.body, SCENARIO_FICTION_DISCLAIMER_FA, "Help disclaimer missing");

assert.deepEqual(SCENARIO4_ENTRY_COPY_FA, {
  title: "۴ — حریم خاکستری مدار",
  subtitle: "یک رفتار مداری مبهم، یک دارایی حساس و تصمیم‌هایی که می‌توانند بحران را مهار یا پیچیده‌تر کنند.",
  shortDescription: "در نقش مسئول یک سلول تصمیم‌گیری فضایی ایران، باید نزدیک‌شدن یک ماهواره اسرائیلی، افت احتمالی سرویس، شواهد متناقض و مسئله انتساب را مدیریت کنید. هر تصمیم روی مأموریت، منابع، رفتار اسرائیل، همراهی متحدان و مسیر بحران اثر می‌گذارد.",
  badges: ["عملیاتی–راهبردی", "۳ مرحله", "اطلاعات ناقص", "حریف واکنش‌پذیر"],
  cta: "ورود به سناریو",
});

assert.equal(HELP_SECTIONS_FA.length, 6, "Expected five help sections plus one disclaimer section");
assert.equal(GLOSSARY_ENTRIES_FA.length, 8, "Expected eight basic glossary entries");
for (const requiredId of ["a17", "r31", "ssa", "attribution", "dual_use", "risk_reduction", "offramp", "reversibility"]) {
  assert.ok(GLOSSARY_ENTRIES_FA.some((entry) => entry.id === requiredId), `Glossary entry ${requiredId} missing`);
}

const playerFacing = JSON.stringify({
  entry: SCENARIO4_ENTRY_COPY_FA,
  intro: INTRO_NARRATIVE_SCREENS_FA,
  help: HELP_SECTIONS_FA,
  glossary: GLOSSARY_ENTRIES_FA,
});
assert.ok(!/\b(?:Blue|Red)\b/.test(playerFacing), "Player-facing Phase 2 copy contains Blue/Red");
assert.ok(!/(?:trueRedIntent|trueIncidentAttribution|non_red|alliance_fracture|benign_ambiguous)/.test(playerFacing), "Hidden-truth identifier leaked into Phase 2 copy");
assert.ok(!/(?:اسرائیل|R-31)[^.؟]*(?:حمله کرده|حمله را انجام داده|اقدام خصمانه انجام داده)/.test(playerFacing), "Intro claims an attack before evidence exists");
assert.ok(INTRO_NARRATIVE_SCREENS_FA.intro_narrative.body?.includes("هیچ اقدام خصمانه‌ای نیز تأیید نشده است"), "Crisis narrative lost its uncertainty statement");

const mainSource = fs.readFileSync("src/ui/components/scenario/ScenarioFourRedesignedScenarioOne.tsx", "utf8");
assert.ok(mainSource.includes("getIntroScreen(phase)"), "Intro does not use the Phase 1 selector");
assert.ok(mainSource.includes("HELP_SECTIONS_FA.map"), "Help sections do not render from the narrative catalog");
assert.ok(mainSource.includes("GLOSSARY_ENTRIES_FA.map"), "Glossary entries do not render from the narrative catalog");
for (const proseFragment of [
  "در فضا، هر نزدیک‌شدن غیرعادی",
  "آیا اسرائیل همیشه اقدام خصمانه انجام می‌دهد؟",
  "دارایی فضایی اصلی ایران در این سناریو",
]) {
  assert.ok(!mainSource.includes(proseFragment), `Narrative prose moved back into JSX: ${proseFragment}`);
}
const phaseOrderLiteral = '["intro_title", "intro_narrative", "intro_role", "intro_objectives", "intro_how_to", "intro_rules", "brief"]';
assert.ok(mainSource.includes(phaseOrderLiteral), "Six-screen Intro navigation order is not wired correctly");
for (const eventName of ["s4_intro_screen_view", "s4_intro_complete", "s4_help_open", "s4_glossary_open"]) {
  assert.equal(mainSource.split(eventName).length - 1, 1, `${eventName} should not be duplicated`);
}

const wordCount = (values) => values.filter(Boolean).join(" ").trim().split(/\s+/).length;
const introWords = wordCount(Object.values(INTRO_NARRATIVE_SCREENS_FA).flatMap((screen) => [
  screen.kicker,
  screen.title,
  screen.subtitle,
  screen.supportLine,
  screen.body,
  screen.closingLine,
  screen.callout,
  ...(screen.items ?? []).flatMap((item) => [item.title, item.body]),
  ...(screen.rules ?? []),
  screen.disclaimer,
  screen.cta,
]));

console.log(JSON.stringify({
  phase: "scenario4-narrative-phase2",
  introScreens: Object.keys(INTRO_NARRATIVE_SCREENS_FA).length,
  introWords,
  helpSections: HELP_SECTIONS_FA.length,
  glossaryEntries: GLOSSARY_ENTRIES_FA.length,
  result: "passed",
}, null, 2));
