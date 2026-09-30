import type { FinalEndState, Move3ImpactSeverity, ResourceEvent, TrueIncidentAttribution } from "../model/types";
import { getResourceLabel } from "../model/resourceEngineV2.ts";
import {
  ACTOR_REACTION_COPY_FA,
  END_STATE_NARRATIVES_FA,
  INJECT_NARRATIVES_FA,
  INTRO_NARRATIVE_SCREENS_FA,
  MOVE1_NARRATIVE_COPY_FA,
  MOVE2_NARRATIVE_COPY_FA,
  MOVE3_NARRATIVE_COPY_FA,
  MOVE3_OPTION_COPY_FA,
} from "./narrativeCatalogFa.ts";
import type {
  EndStateNarrative,
  AarRunSummary,
  AarTurningPoint,
  FinalReportNarrative,
  InjectNarrativeDefinition,
  IntroNarrativeScreen,
  NarrativeActor,
  NarrativeSection,
  Move3EvidenceNarrativeCard,
  Scenario4NarrativeContext,
} from "./narrativeTypes.ts";

const trace = (
  narrativeId: string,
  sourceType: NarrativeSection["source"],
  sourceIds: string[],
  move?: 1 | 2 | 3
) => ({ narrativeId, sourceType, sourceIds, move });

const section = (
  id: string,
  title: string,
  body: string,
  source: NarrativeSection["source"],
  sourceIds: string[],
  move?: 1 | 2 | 3,
  severity?: NarrativeSection["severity"]
): NarrativeSection => ({ id, title, body, source, severity, trace: trace(id, source, sourceIds, move) });

export const getIntroScreen = (id: IntroNarrativeScreen["id"]): IntroNarrativeScreen =>
  INTRO_NARRATIVE_SCREENS_FA[id];

export const getMove1OpeningNarrative = (ctx: Scenario4NarrativeContext): NarrativeSection[] => [{
  ...section(
    "move1.opening",
    MOVE1_NARRATIVE_COPY_FA.opening.title,
    MOVE1_NARRATIVE_COPY_FA.opening.body,
    "state",
    ["initial_visible_state"],
    ctx.move ?? 1,
    "info"
  ),
  kicker: MOVE1_NARRATIVE_COPY_FA.opening.situationLabel,
  closingLine: MOVE1_NARRATIVE_COPY_FA.opening.closingPrompt,
}];

export const getMove1ProtectionContext = (ctx: Scenario4NarrativeContext) => {
  const choice = ctx.iran.decisions.m1_information as keyof typeof MOVE1_NARRATIVE_COPY_FA.informationContextByChoice | undefined;
  const consequence = choice ? MOVE1_NARRATIVE_COPY_FA.informationContextByChoice[choice] : undefined;
  return [MOVE1_NARRATIVE_COPY_FA.decisions.protection.baseContext, consequence].filter(Boolean).join(" ");
};

export const getMove1CommunicationContext = (ctx: Scenario4NarrativeContext) => {
  const choice = ctx.iran.decisions.m1_protection as keyof typeof MOVE1_NARRATIVE_COPY_FA.protectionContextByChoice | undefined;
  const consequence = choice ? MOVE1_NARRATIVE_COPY_FA.protectionContextByChoice[choice] : undefined;
  return [MOVE1_NARRATIVE_COPY_FA.decisions.communication.baseContext, consequence].filter(Boolean).join(" ");
};

export const getMove1ResourceConsequence = (events: readonly ResourceEvent[] | undefined) => {
  const costs = (events ?? []).filter((event) => event.delta < 0);
  if (!costs.length) return MOVE1_NARRATIVE_COPY_FA.resource.noDirectCost;
  return `${MOVE1_NARRATIVE_COPY_FA.resource.registeredCost} ${costs
    .map((event) => `${getResourceLabel(event.resource)} −${Math.abs(event.delta)}`)
    .join("، ")}`;
};

export const getMove2ResourceConsequence = (events: readonly ResourceEvent[] | undefined) => {
  const costs = (events ?? []).filter((event) => event.delta < 0);
  if (!costs.length) return MOVE2_NARRATIVE_COPY_FA.resource.noDirectCost;
  return `${MOVE2_NARRATIVE_COPY_FA.resource.registeredCost} ${costs
    .map((event) => `${getResourceLabel(event.resource)} −${Math.abs(event.delta)}`)
    .join("، ")}`;
};

export const getMove3ResourceConsequence = (events: readonly ResourceEvent[] | undefined) => {
  const costs = (events ?? []).filter((event) => event.delta < 0);
  if (!costs.length) return MOVE3_NARRATIVE_COPY_FA.resource.noDirectCost;
  return `${MOVE3_NARRATIVE_COPY_FA.resource.registeredCost} ${costs
    .map((event) => `${getResourceLabel(event.resource)} −${Math.abs(event.delta)}`)
    .join("، ")}`;
};

export const formatAttributionEvolution = (before: number, after: number) => {
  if (after > before) return `برآورد شما از ${before}٪ به ${after}٪ افزایش یافت.`;
  if (after < before) return `برآورد شما از ${before}٪ به ${after}٪ کاهش یافت.`;
  return `برآورد شما بدون تغییر در ${before}٪ باقی ماند.`;
};

export const formatAttributionPath = (pre: number, post: number, final: number) => {
  if (pre === post && post === final) {
    return `برآورد شما در هر سه نقطه روی ${pre}٪ باقی ماند.`;
  }
  return `مسیر برآورد شما: ${pre}٪ ← ${post}٪ ← ${final}٪. ${formatAttributionEvolution(pre, post)} ${formatAttributionEvolution(post, final)}`;
};

export const attributionQualitativeLabel = (value: number) => {
  if (value <= 20) return "بسیار بعید";
  if (value <= 40) return "بعید";
  if (value <= 55) return "نامطمئن";
  if (value <= 75) return "محتمل";
  return "بسیار محتمل";
};

export const formatAttributionTrajectory = (pre: number, post: number, final: number) => {
  if (pre === post && post === final) {
    return `برآورد شما در هر سه نقطه بدون تغییر روی ${pre}٪ باقی ماند؛ یعنی در طول این اجرا همچنان عدم قطعیت بالایی درباره نقش اسرائیل حفظ شد.`;
  }
  if (post !== pre && Math.abs(final - pre) <= 5) {
    return "برآورد شما در طول بحران تغییر کرد، اما در پایان به سطحی نزدیک به برآورد اولیه بازگشت.";
  }
  if (post >= pre && final >= post && final > pre) {
    return "برآورد شما با ورود شواهد جدید افزایش یافت.";
  }
  if (post <= pre && final <= post && final < pre) {
    return "برآورد شما با ورود شواهد جدید کاهش یافت.";
  }
  return `برآورد شما در طول بحران از ${pre}٪ به ${post}٪ و سپس به ${final}٪ تغییر کرد.`;
};

export const getTruthExplanation = (truth: TrueIncidentAttribution) => {
  if (truth === "mixed") {
    return "بررسی پس از اقدام نشان می‌دهد اسرائیل در بخشی از زنجیره علت رخداد نقش داشته است، اما علت رخداد صرفاً به اسرائیل محدود نبوده است.";
  }
  if (truth === "red") return "بررسی پس از اقدام نشان می‌دهد نقش اسرائیل در علت رخداد تأیید شده است.";
  return "بررسی پس از اقدام نشان می‌دهد نقش مستقیم اسرائیل در علت اصلی رخداد تأیید نشده است.";
};

export const getBrierPlainLanguageInterpretation = (brier: number) => {
  if (Math.abs(brier - 0.25) < 1e-9) return "این برآورد در این رخداد معادل مبنای خنثی 50/50 بود.";
  if (brier < 0.25) return "این برآورد در این رخداد از مبنای خنثی 50/50 به نتیجه واقعی نزدیک‌تر بود.";
  return "این برآورد در این رخداد از مبنای خنثی 50/50 فاصله بیشتری از نتیجه واقعی داشت.";
};

export const getBssPlainLanguageInterpretation = (bss: number) => {
  if (Math.abs(bss) < 1e-9) return "برابر با مبنای 50/50 در همین رخداد";
  if (bss > 0) return "بهتر از مبنای 50/50 در همین رخداد";
  return "ضعیف‌تر از مبنای 50/50 در همین رخداد";
};

export const getFinalEstimateExplanation = (estimate: number, brier: number) => {
  const baseline = getBrierPlainLanguageInterpretation(brier);
  if (estimate === 50) {
    return `برآورد 50٪ یعنی شما در پایان بحران همچنان بین وجود و نبود نقش اسرائیل موضع احتمالی خنثی داشتید. پس از آشکار شدن حقیقت، این برآورد از نظر امتیاز Brier دقیقاً معادل مبنای خنثی 50/50 است؛ نه نزدیک‌تر و نه دورتر از آن.`;
  }
  const direction = estimate > 50
    ? "به وجود نقش اسرائیل گرایش داشت"
    : "به نبود نقش اسرائیل گرایش داشت";
  return `برآورد ${estimate}٪ یعنی ارزیابی نهایی شما ${direction}. ${baseline}`;
};

export const getAarResultMeaning = (estimate: number, truth: TrueIncidentAttribution) => {
  const truthText = truth === "mixed"
    ? "حقیقت پنهان نشان داد اسرائیل در بخشی از زنجیره علت نقش داشته و رخداد چندعاملی بوده است"
    : truth === "red"
      ? "حقیقت پنهان نقش اسرائیل در علت رخداد را تأیید کرد"
      : "حقیقت پنهان نقش مستقیم اسرائیل در علت اصلی رخداد را تأیید نکرد";
  const estimateText = estimate === 50
    ? "جهت مشخصی فراتر از فرض خنثی 50/50 ایجاد نکرد"
    : estimate > 50
      ? "به وجود نقش اسرائیل گرایش داشت"
      : "به نبود نقش اسرائیل گرایش داشت";
  return `شما در پایان بحران احتمال نقش اسرائیل را ${estimate}٪ برآورد کردید. ${truthText}. بنابراین برآورد نهایی شما ${estimateText}.`;
};

const thresholdWhy: Record<string, string> = {
  m3_t_insufficient: "سطح شواهد برای انتساب راهبردی کافی تلقی نشد و تصمیم نهایی بر حفظ گزینه‌های برگشت‌پذیر تکیه داشت.",
  m3_t_sufficient_limited: "میان نبود قطعیت کامل و نیاز به اقدام، آستانه اقدام محدود و برگشت‌پذیر انتخاب شد.",
  m3_t_sufficient_strong: "سطح شواهد برای اقدامی با دامنه بیشتر کافی تلقی شد، با وجود آنکه هزینه خطای انتساب همچنان مطرح بود.",
};

const actionWhy: Record<string, string> = {
  m3_coa_contain_understand: "تمرکز بر حفظ مأموریت و شناخت بیشتر باقی ماند و دامنه اقدامات برگشت‌ناپذیر محدود شد.",
  m3_coa_controlled_deterrence: "این انتخاب سیگنال عزم را افزایش داد، اما دامنه اقدام را کنترل‌شده و محدود نگه داشت.",
  m3_coa_coordinated_response: "اقدام نهایی به همراهی متحدان و حفظ وزن ائتلافی وابسته شد.",
  m3_coa_negotiated_deescalation: "مسیر فاصله‌گذاری و کاهش چرخه واکنش متقابل به اقدام اصلی تبدیل شد.",
  m3_coa_unilateral_strong: "آزادی عمل و سرعت اقدام افزایش یافت، اما هزینه سیاسی و خطر تشدید نیز بیشتر شد.",
};

export const buildAarTurningPoints = ({
  pre,
  post,
  final,
  thresholdId,
  thresholdLabel,
  actionId,
  actionLabel,
  israelActionBody,
  intentLabel,
}: {
  pre: number;
  post: number;
  final: number;
  thresholdId: string;
  thresholdLabel: string;
  actionId: string;
  actionLabel: string;
  israelActionBody: string;
  intentLabel: string;
}): AarTurningPoint[] => {
  const trajectoryTitle = pre === post && post === final
    ? "برآورد انتساب بدون تغییر ماند"
    : final > pre
      ? "برآورد انتساب افزایش یافت"
      : final < pre
        ? "برآورد انتساب کاهش یافت"
        : "برآورد انتساب در طول بحران تغییر کرد";
  const trajectoryWhy = pre === post && post === final
    ? "در پایان بحران همچنان عدم قطعیت بالا باقی مانده بود و تصمیم نهایی بر پایه یک انتساب قطعی گرفته نشد."
    : "تغییر برآورد نشان می‌دهد شواهد تازه در ارزیابی احتمال نقش اسرائیل وارد شده‌اند.";
  return [
    { id: "attribution", title: trajectoryTitle, body: formatAttributionPath(pre, post, final), why: trajectoryWhy },
    { id: "threshold", title: "آستانه اقدام", body: `«${thresholdLabel}»`, why: thresholdWhy[thresholdId] ?? "آستانه اقدام، میزان کفایت شواهد برای دامنه تصمیم نهایی را ثبت کرد." },
    { id: "action", title: "مسیر اقدام", body: `«${actionLabel}»`, why: actionWhy[actionId] ?? "این انتخاب دامنه و جهت اقدام نهایی ایران را شکل داد." },
    { id: "israel", title: "واکنش نهایی اسرائیل", body: israelActionBody, why: `نیت پنهان اسرائیل در این اجرا «${intentLabel}» بود و واکنش نهایی آن در برابر تصمیم ایران در همین زمینه شکل گرفت.` },
  ];
};

export const buildAarRunSummary = ({
  finalEstimate,
  visibleConfidence,
  thresholdLabel,
  intentLabel,
  causeLabel,
  truth,
}: {
  finalEstimate: number;
  visibleConfidence: number;
  thresholdLabel: string;
  intentLabel: string;
  causeLabel: string;
  truth: TrueIncidentAttribution;
}): AarRunSummary => {
  const truthShort = truth === "mixed"
    ? "اسرائیل در بخشی از زنجیره علت نقش داشت و رخداد چندعاملی بود"
    : truth === "red"
      ? "نقش اسرائیل در علت رخداد تأیید شد"
      : "نقش مستقیم اسرائیل در علت اصلی رخداد تأیید نشد";
  const difference = truth === "mixed"
    ? "مهم‌ترین فاصله میان برداشت زمان تصمیم و حقیقت نهایی این بود که نقش اسرائیل وجود داشت، اما ماهیت رخداد چندعاملی بود و نه یک اقدام تک‌علتی و کاملاً منتسب."
    : truth === "red"
      ? `در زمان تصمیم، احتمال نقش اسرائیل ${finalEstimate}٪ برآورد شد؛ بعداً نقش آن در علت رخداد تأیید شد.`
      : `در زمان تصمیم، احتمال نقش اسرائیل ${finalEstimate}٪ برآورد شد؛ بعداً نقش مستقیم آن در علت اصلی تأیید نشد.`;
  return {
    known: `هنگام تصمیم نهایی، برآورد شما از نقش اسرائیل ${finalEstimate}٪ بود و اطمینان سامانه از شواهد ${Math.round(visibleConfidence)}٪ بود. با وجود باقی‌ماندن عدم‌قطعیت، شما آستانه «${thresholdLabel}» را انتخاب کردید.`,
    revealed: `در AAR مشخص شد نیت واقعی اسرائیل «${intentLabel}» و علت رخداد مرحله دوم «${causeLabel}» بوده است؛ ${truthShort}.`,
    difference,
  };
};

export const getMove1SceneCaption = (actionId?: string) => {
  const captions = MOVE1_NARRATIVE_COPY_FA.sceneCaptions;
  if (!actionId || !(actionId in captions)) return captions.unresolved;
  return captions[actionId as Exclude<keyof typeof captions, "unresolved">];
};

export const getMove2SceneCaption = (actionId?: string) => {
  const captions = MOVE2_NARRATIVE_COPY_FA.sceneCaptions;
  if (!actionId || !(actionId in captions)) return captions.unresolved;
  return captions[actionId as Exclude<keyof typeof captions, "unresolved">];
};

export const getMove3SceneCaption = (actionId?: string) => {
  const captions = MOVE3_NARRATIVE_COPY_FA.sceneCaptions;
  if (!actionId || !(actionId in captions)) return captions.unresolved;
  return captions[actionId as Exclude<keyof typeof captions, "unresolved">];
};

export const canRenderNarrativeTrace = (isAdmin: boolean, debugEnabled: boolean) =>
  isAdmin && debugEnabled;

export const canRenderAdminDebugPanel = (isAdmin: boolean) => isAdmin;

export const hasObservedSecondAsset = (ctx: Scenario4NarrativeContext) =>
  ctx.israel.currentAction === "introduce_second_asset" || Boolean(ctx.flags.m2SecondAssetObserved);

export const getMove2OpeningNarrative = (ctx: Scenario4NarrativeContext): NarrativeSection[] => {
  const copy = MOVE2_NARRATIVE_COPY_FA.opening;
  const secondAsset = hasObservedSecondAsset(ctx)
    ? `\n\n${copy.secondAsset}`
    : "";
  const body = `${copy.base}${secondAsset}\n\n${copy.hypotheses}`;
  const sections: NarrativeSection[] = [
    {
      ...section(
      "move2.opening",
      copy.title,
      body,
      "state",
      hasObservedSecondAsset(ctx) ? ["mission.status", "m2SecondAssetObserved"] : ["mission.status"],
      2,
      "warning"
      ),
      kicker: copy.situationLabel,
      closingLine: copy.closingPrompt,
    },
  ];
  if (ctx.israel.previousActions.includes("break_off")) {
    sections.push(section("move2.prior_breakoff", "زمینه مرحله قبل", copy.priorBreakOff, "actor", ["break_off"], 2, "info"));
  } else if (ctx.israel.previousActions.includes("continue_approach")) {
    sections.push(section("move2.prior_approach", "زمینه مرحله قبل", copy.priorApproach, "actor", ["continue_approach"], 2, "warning"));
  }
  if (ctx.flags.mediaInjectTriggered) {
    sections.push(section("move2.prior_media", "زمینه عمومی", copy.priorMedia, "inject", ["m1_inject_1c_media"], 2, "warning"));
  }
  return sections;
};

const inferVisibleSeverity = (ctx: Scenario4NarrativeContext): Move3ImpactSeverity => {
  if (ctx.mission.serviceImpactSeverity) return ctx.mission.serviceImpactSeverity;
  if (ctx.mission.status < 55) return "severe";
  if (ctx.mission.status < 75) return "significant";
  return "limited";
};

export const getMove3OpeningNarrative = (ctx: Scenario4NarrativeContext): NarrativeSection[] => {
  const severity = inferVisibleSeverity(ctx);
  const copy = MOVE3_NARRATIVE_COPY_FA.opening;
  const dynamic = [
    copy.impact[severity],
    ctx.flags.m2FallbackActivated ? copy.fallback : undefined,
    ctx.flags.m2CoalitionFriction ? copy.coalitionFriction : undefined,
    (ctx.flags.m2OffRampOfferedByRed || ctx.flags.m2OffRampOfferedByBlue) ? copy.offRampOpen : undefined,
    (ctx.israel.previousActions.includes("reduce_proximity") || ctx.israel.previousActions.includes("break_off"))
      ? copy.israelReducedProximity
      : undefined,
  ].filter(Boolean);
  return [{
    ...section(
      "move3.opening",
      copy.title,
      `${copy.base}\n\n${dynamic.join(" ")}`,
      "state",
      ["mission.serviceImpactSeverity", "evidence.visibleConfidence", ...ctx.israel.previousActions],
      3,
      severity === "severe" ? "critical" : "warning"
    ),
    kicker: copy.situationLabel,
    closingLine: copy.closing,
  }];
};

export const getMove3EvidencePackage = (ctx: Scenario4NarrativeContext): Move3EvidenceNarrativeCard[] => {
  const copy = MOVE3_NARRATIVE_COPY_FA.evidence;
  const ids = ctx.evidence.availableIds;
  const technicalId = ["E_M2_TECH_STRONG", "E_M2_TECH_MIXED", "E_M2_TECH_INCONCLUSIVE", "E_M2_02"]
    .find((id) => ids.includes(id)) ?? "E_M2_02";
  const technicalBody = technicalId === "E_M2_TECH_STRONG"
    ? copy.technicalBodyStrong
    : technicalId === "E_M2_TECH_MIXED"
      ? copy.technicalBodyMixed
      : technicalId === "E_M2_TECH_INCONCLUSIVE"
        ? copy.technicalBodyInconclusive
        : copy.technicalBodyBaseline;
  const reduced = ctx.israel.previousActions.some((action) => action === "reduce_proximity" || action === "break_off");
  const cards: Move3EvidenceNarrativeCard[] = [
    { id: technicalId, title: copy.technicalTitle, status: technicalId === "E_M2_TECH_INCONCLUSIVE" ? "ناکامل" : "تحلیلی", text: technicalBody, limitation: copy.technicalLimitation, source: "technical", sourceSemantics: "جمع‌بندی فنی از شواهدی که در همین اجرا فراهم شده است؛ نتیجه علت قطعی نیست.", visibilityRule: "در بسته نهایی مرحله سوم نمایش داده می‌شود و فقط نتیجه فنی واقعاً فراهم‌شده را بازتاب می‌دهد." },
    { id: "E_M2_03", title: copy.orbitalTitle, status: "تحلیلی", text: reduced ? copy.orbitalBodyReduced : copy.orbitalBodyActive, limitation: copy.orbitalLimitation, source: "orbital", sourceSemantics: "ترکیب زمینه زمانی و رفتار مداری مشاهده‌شده؛ هم‌بستگی بدون ادعای علیت.", visibilityRule: "در بسته نهایی مرحله سوم بر پایه رفتار مشاهده‌شده R-31 نمایش داده می‌شود." },
  ];
  if (ids.includes("E_M2_ALLY_01")) cards.push({ id: "E_M2_ALLY_01", title: copy.allyTitle, status: "تحلیلی", text: copy.allyBody, limitation: copy.allyLimitation, source: "ally", sourceSemantics: "ارزیابی مستقل متحد؛ مکمل شواهد فنی و نه جایگزین آن.", visibilityRule: "تنها اگر داده متحد در اجرای واقعی فراهم شده باشد در بسته نهایی نمایش داده می‌شود." });
  if (ids.includes("E_M2_COMM_01")) cards.push({ id: "E_M2_COMM_01", title: copy.commercialTitle, status: "ناکامل", text: copy.commercialBody, limitation: copy.commercialLimitation, source: "commercial", sourceSemantics: "مشاهده غیرنظامی مستقل با محدودیت پوشش و انتشار.", visibilityRule: "تنها اگر داده تجاری در اجرای واقعی فراهم شده باشد در بسته نهایی نمایش داده می‌شود." });
  if (ids.includes("E_COMM_CONFLICT_01")) cards.push({ id: "E_COMM_CONFLICT_01", title: copy.conflictingTitle, status: "متناقض", text: copy.conflictingBody, limitation: copy.conflictingLimitation, source: "commercial", sourceSemantics: "شاهد تجاری متناقض؛ اختلاف منبع بدون حل مصنوعی حفظ می‌شود.", visibilityRule: "تنها اگر داده متناقض در اجرای واقعی فراهم شده باشد در بسته نهایی نمایش داده می‌شود." });
  return cards;
};

export const getActorReactionNarrative = (
  actor: NarrativeActor,
  actionId: string,
  _ctx: Scenario4NarrativeContext
): NarrativeSection => {
  const key = `${actor}:${actionId}`;
  const copy = ACTOR_REACTION_COPY_FA[key];
  if (!copy) {
    const message = `Unmapped Scenario 4 actor action: ${key}`;
    console.error(message);
    throw new Error(message);
  }
  return section(`actor.${key}`, copy.title, copy.body, "actor", [actionId], _ctx.move);
};

export const getInjectNarrativeDefinition = (injectId: string): InjectNarrativeDefinition => {
  const definition = INJECT_NARRATIVES_FA[injectId];
  if (!definition) throw new Error(`Unmapped Scenario 4 inject: ${injectId}`);
  return definition;
};

export const getInjectNarrative = (
  injectId: string,
  move?: 1 | 2 | 3
): NarrativeSection | null => {
  const definition = getInjectNarrativeDefinition(injectId);
  if (definition.visibility === "hidden") return null;
  return section(
    `inject.${injectId}`,
    definition.title,
    `${definition.whatHappened} ${definition.whyItMatters}`,
    "inject",
    [injectId],
    move,
    "warning"
  );
};

const resourceFact = (ctx: Scenario4NarrativeContext) => {
  const values = Object.values(ctx.iran.resources);
  const lowest = Math.min(...values);
  return lowest < 25
    ? "حداقل یکی از منابع اصلی در سطح محدود باقی مانده است."
    : lowest < 50
      ? "بخشی از منابع اصلی تحت فشار قرار گرفته است."
      : "منابع اصلی هنوز امکان ادامه گزینه‌های بعدی را حفظ کرده‌اند.";
};

const getMove1SituationUpdate = (ctx: Scenario4NarrativeContext): NarrativeSection[] => {
  const copy = MOVE1_NARRATIVE_COPY_FA.update;
  const updates: NarrativeSection[] = [];
  if (ctx.israel.currentAction) {
    const reaction = getActorReactionNarrative("israel", ctx.israel.currentAction, ctx);
    updates.push(section("move1.update.r31", copy.r31Title, reaction.body, "actor", [ctx.israel.currentAction], 1));
  }

  const protectionChoice = ctx.iran.decisions.m1_protection;
  const protectionDetail = protectionChoice
    ? MOVE1_NARRATIVE_COPY_FA.protectionContextByChoice[
        protectionChoice as keyof typeof MOVE1_NARRATIVE_COPY_FA.protectionContextByChoice
      ]
    : undefined;
  const missionBody = ctx.mission.status >= 80 ? copy.a17Stable : copy.a17Pressured;
  updates.push(section(
    "move1.update.a17",
    copy.a17Title,
    [missionBody, protectionDetail].filter(Boolean).join(" "),
    "state",
    ["mission.status", protectionChoice].filter((value): value is string => Boolean(value)),
    1
  ));

  const informationChoice = ctx.iran.decisions.m1_information;
  const informationDetail = informationChoice
    ? MOVE1_NARRATIVE_COPY_FA.informationContextByChoice[
        informationChoice as keyof typeof MOVE1_NARRATIVE_COPY_FA.informationContextByChoice
      ]
    : undefined;
  const informationSummary = (ctx.evidence.visibleConfidence ?? 0) >= 50
    ? copy.informationClearer
    : copy.informationLimited;
  updates.push(section(
    "move1.update.information",
    copy.informationTitle,
    [informationDetail, informationSummary].filter(Boolean).join(" "),
    "evidence",
    [informationChoice, "evidence.visibleConfidence", ...ctx.evidence.openedIds]
      .filter((value): value is string => Boolean(value)),
    1
  ));

  const environmentParts: string[] = [];
  const environmentSources: string[] = [];
  if (ctx.ally.currentAction && ctx.ally.currentAction !== "no_action") {
    environmentParts.push(getActorReactionNarrative("ally", ctx.ally.currentAction, ctx).body);
    environmentSources.push(ctx.ally.currentAction);
  }
  if (ctx.commercial.currentAction && ctx.commercial.currentAction !== "no_new_data") {
    environmentParts.push(getActorReactionNarrative("commercial", ctx.commercial.currentAction, ctx).body);
    environmentSources.push(ctx.commercial.currentAction);
  }
  for (const injectId of ctx.injects.activeIds) {
    if (injectId === "m1_inject_1a_conflicting_data") continue;
    const definition = getInjectNarrativeDefinition(injectId);
    if (definition.visibility === "immediate") {
      environmentParts.push(`«${definition.title}»: ${definition.whatHappened} ${definition.whyItMatters}`);
      environmentSources.push(injectId);
    }
  }
  if (environmentParts.length) {
    updates.push(section(
      "move1.update.environment",
      copy.environmentTitle,
      environmentParts.join(" "),
      "actor",
      environmentSources,
      1
    ));
  }

  updates.push(section(
    "move1.update.resources",
    copy.resourcesTitle,
    `${resourceFact(ctx)} ${copy.closingLine}`,
    "state",
    ["iran.resources"],
    1,
    "info"
  ));
  return updates;
};

export const getMoveSituationUpdate = (ctx: Scenario4NarrativeContext): NarrativeSection[] => {
  const move = ctx.move ?? 1;
  if (move === 1) return getMove1SituationUpdate(ctx);

  if (move === 2) {
    const copy = MOVE2_NARRATIVE_COPY_FA.update;
    const missionChoice = ctx.iran.decisions.m2_mission as keyof typeof copy.missionByChoice | undefined;
    const investigationChoice = ctx.iran.decisions.m2_investigation as keyof typeof copy.evidenceByChoice | undefined;
    const pre = ctx.iran.attributionEstimates.pre;
    const post = ctx.iran.attributionEstimates.post;
    const updates: NarrativeSection[] = [
      section(
        "move2.update.mission",
        copy.missionTitle,
        missionChoice && copy.missionByChoice[missionChoice]
          ? copy.missionByChoice[missionChoice]
          : ctx.mission.status >= 75 ? copy.missionStable : copy.missionPressured,
        "state",
        ["mission.status", missionChoice].filter((value): value is string => Boolean(value)),
        2
      ),
      section(
        "move2.update.evidence",
        copy.evidenceTitle,
        investigationChoice && copy.evidenceByChoice[investigationChoice]
          ? copy.evidenceByChoice[investigationChoice]
          : copy.evidenceFallback,
        "evidence",
        [investigationChoice, ...ctx.evidence.openedIds].filter((value): value is string => Boolean(value)),
        2
      ),
    ];

    if (typeof pre === "number" && typeof post === "number") {
      updates.push(section(
        "move2.update.attribution",
        copy.attributionTitle,
        formatAttributionEvolution(pre, post),
        "user_choice",
        ["attribution.pre", "attribution.post"],
        2
      ));
    }

    if (ctx.israel.currentAction) {
      updates.push(getActorReactionNarrative("israel", ctx.israel.currentAction, ctx));
    }

    const environmentParts: string[] = [];
    const environmentSources: string[] = [];
    if (ctx.ally.currentAction && ctx.ally.currentAction !== "no_action") {
      environmentParts.push(getActorReactionNarrative("ally", ctx.ally.currentAction, ctx).body);
      environmentSources.push(ctx.ally.currentAction);
    }
    if (ctx.commercial.currentAction && ctx.commercial.currentAction !== "no_new_data") {
      environmentParts.push(getActorReactionNarrative("commercial", ctx.commercial.currentAction, ctx).body);
      environmentSources.push(ctx.commercial.currentAction);
    }
    for (const injectId of ctx.injects.activeIds) {
      const definition = getInjectNarrativeDefinition(injectId);
      if (definition.visibility === "immediate") {
        environmentParts.push(`${definition.whatHappened} ${definition.whyItMatters}`);
        environmentSources.push(injectId);
      }
    }
    if (environmentParts.length) {
      updates.push(section(
        "move2.update.environment",
        copy.environmentTitle,
        environmentParts.join(" "),
        "actor",
        environmentSources,
        2
      ));
    }

    updates.push(section(
      "move2.update.resources",
      copy.resourcesTitle,
      `${resourceFact(ctx)} ${copy.transition}`,
      "state",
      ["iran.resources"],
      2,
      "info"
    ));
    return updates.slice(0, 6);
  }

  const copy = MOVE3_NARRATIVE_COPY_FA.update;
  const missionBody = ctx.mission.status >= 75
    ? "مأموریت اصلی ادامه دارد و سطح تداوم آن پایدار مانده است."
    : "مأموریت ادامه دارد، اما کیفیت یا ظرفیت آن همچنان تحت فشار است.";
  const finalEstimate = ctx.iran.attributionEstimates.final;
  const { pre, post } = ctx.iran.attributionEstimates;
  const actionLabel = move3OptionLabel("coa", ctx.iran.decisions.m3_coa);
  const infoLabel = move3OptionLabel("information", ctx.iran.decisions.m3_info);
  const actorParts = [
    ctx.israel.currentAction ? getActorReactionNarrative("israel", ctx.israel.currentAction, ctx).body : undefined,
    ctx.ally.currentAction ? getActorReactionNarrative("ally", ctx.ally.currentAction, ctx).body : undefined,
  ].filter((value): value is string => Boolean(value));
  const updates: NarrativeSection[] = [
    section("move3.update.mission", copy.missionTitle, missionBody, "state", ["mission.status"], 3),
    section("move3.update.attribution", copy.attributionTitle, typeof pre === "number" && typeof post === "number" && typeof finalEstimate === "number" ? formatAttributionPath(pre, post, finalEstimate) : "برآورد نهایی بر اساس شواهد قابل مشاهده ثبت شد.", "user_choice", ["attribution.pre", "attribution.post", "attribution.final"], 3),
    section("move3.update.action", copy.actionTitle, actionLabel ? `مسیر «${actionLabel}» به‌عنوان اقدام اصلی ایران ثبت شد.` : "مسیر اقدام نهایی ایران ثبت شد.", "user_choice", [ctx.iran.decisions.m3_coa].filter((value): value is string => Boolean(value)), 3),
    section("move3.update.information", copy.informationTitle, infoLabel ? `سیاست «${infoLabel}» برای مدیریت شواهد و انتساب انتخاب شد.` : "سیاست اطلاعاتی نهایی ثبت شد.", "user_choice", [ctx.iran.decisions.m3_info].filter((value): value is string => Boolean(value)), 3),
  ];
  if (actorParts.length) updates.push(section("move3.update.actors", copy.actorsTitle, actorParts.join(" "), "actor", [ctx.israel.currentAction, ctx.ally.currentAction].filter((value): value is string => Boolean(value)), 3));
  if (ctx.iran.decisions.m3_offramp || ctx.flags.m3NegotiatedOffRamp || ctx.mission.escalationPressure >= 65) {
    const offRampLabel = move3OptionLabel("offRamp", ctx.iran.decisions.m3_offramp);
    const body = offRampLabel
      ? `در مسیر کاهش تنش، تصمیم «${offRampLabel}» ثبت شد؛ نتیجه نهایی آن به واکنش متقابل وابسته است.`
      : ctx.mission.escalationPressure >= 65
        ? "فشار تشدید در سطح بالا باقی مانده و مهار چرخه واکنش متقابل به اقدام بعدی نیاز دارد."
        : "یک مسیر کاهش تنش در روند بحران باز مانده است.";
    updates.push(section("move3.update.exit", copy.exitTitle, body, "state", [ctx.iran.decisions.m3_offramp, "mission.escalationPressure"].filter((value): value is string => Boolean(value)), 3));
  }
  return updates.slice(0, 6);
};

export const getEndStateNarrative = (
  endStateId: FinalEndState,
  ctx: Scenario4NarrativeContext
): EndStateNarrative => {
  const base = END_STATE_NARRATIVES_FA[endStateId];
  const facts: string[] = [
    `تداوم مأموریت در سطح ${Math.round(ctx.mission.status)} و فشار تشدید در سطح ${Math.round(ctx.mission.escalationPressure)} پایان یافت.`,
    `انسجام ائتلافی در سطح ${Math.round(ctx.mission.coalitionCohesion)} قرار گرفت.`,
  ];
  if (ctx.israel.currentAction) {
    facts.push(getActorReactionNarrative("israel", ctx.israel.currentAction, ctx).body);
  }
  const informationPolicy = ctx.iran.decisions.m3_info;
  if (informationPolicy) {
    const label = MOVE3_OPTION_COPY_FA.information.find((option) => option.id === informationPolicy)?.label;
    facts.push(label ? `سیاست اطلاعاتی ثبت‌شده در تصمیم نهایی «${label}» بود.` : "سیاست اطلاعاتی تصمیم نهایی در مسیر بحران ثبت شد.");
  }
  const offRamp = ctx.iran.decisions.m3_offramp;
  if (facts.length < 4 && (offRamp || ctx.flags.m3NegotiatedOffRamp || ctx.flags.m2OffRampOfferedByRed)) {
    facts.push("یک مسیر کاهش تنش در روند واقعی تصمیم‌ها یا واکنش بازیگران وجود داشت.");
  }
  if (facts.length < 3) facts.push(resourceFact(ctx));
  return { ...base, causalFacts: facts.slice(0, 4) };
};

const move3OptionLabel = (group: keyof typeof MOVE3_OPTION_COPY_FA, id?: string) => {
  if (!id) return undefined;
  const options = MOVE3_OPTION_COPY_FA[group] as readonly { id: string; label: string }[];
  return options.find((option) => option.id === id)?.label;
};

const biggestUserCosts = (events: readonly ResourceEvent[]) => {
  const totals = new Map<ResourceEvent["resource"], number>();
  for (const event of events) {
    if (event.kind !== "user_cost" || event.delta >= 0) continue;
    totals.set(event.resource, (totals.get(event.resource) ?? 0) + Math.abs(event.delta));
  }
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([resource, amount]) => `${getResourceLabel(resource)} −${amount}`);
};

export const getFinalReport = (ctx: Scenario4NarrativeContext): FinalReportNarrative => {
  if (!ctx.endState) throw new Error("Final report requires a resolved end state.");
  const endStateNarrative = getEndStateNarrative(ctx.endState.id, ctx);
  const estimates = ctx.iran.attributionEstimates;
  const estimateParts = [estimates.pre, estimates.post, estimates.final].filter((value): value is number => typeof value === "number");
  const actorParts: string[] = [];
  if (ctx.israel.currentAction) actorParts.push(getActorReactionNarrative("israel", ctx.israel.currentAction, ctx).body);
  if (ctx.ally.currentAction) actorParts.push(getActorReactionNarrative("ally", ctx.ally.currentAction, ctx).body);
  if (ctx.commercial.currentAction) actorParts.push(getActorReactionNarrative("commercial", ctx.commercial.currentAction, ctx).body);
  const threshold = move3OptionLabel("threshold", ctx.iran.decisions.m3_threshold);
  const coa = move3OptionLabel("coa", ctx.iran.decisions.m3_coa);
  const information = move3OptionLabel("information", ctx.iran.decisions.m3_info);
  const offRamp = move3OptionLabel("offRamp", ctx.iran.decisions.m3_offramp);
  const decisionParts = [
    threshold ? `آستانه اقدام: «${threshold}».` : undefined,
    coa ? `مسیر اقدام: «${coa}».` : undefined,
    information ? `سیاست اطلاعاتی: «${information}».` : undefined,
    offRamp ? `مسیر کاهش تنش: «${offRamp}».` : undefined,
  ].filter((value): value is string => Boolean(value));
  const costs = biggestUserCosts(ctx.iran.resourceEvents);
  const resourceValues = ctx.iran.resources;
  const pathParts = [
    ctx.flags.m2FallbackActivated ? "ظرفیت پشتیبان برای جذب بخشی از فشار مأموریتی فعال شد." : undefined,
    ctx.flags.m2CoalitionFriction ? "اختلاف ائتلافی درباره قدرت شواهد وارد تصمیم نهایی شد." : undefined,
    (ctx.flags.m2OffRampOfferedByRed || ctx.flags.m2OffRampOfferedByBlue) ? "یک پیشنهاد فاصله‌گذاری تا مرحله نهایی باز ماند." : undefined,
  ].filter((value): value is string => Boolean(value));
  return {
    crisisPath: section("report.crisis_path", "مسیر بحران", ["بحران از رفتار مداری مبهم آغاز شد، در مرحله دوم به افت سرویس با انتساب نامطمئن رسید و در مرحله سوم به تصمیم درباره آستانه اقدام تبدیل شد.", ...pathParts].join(" "), "state", ["move1", "move2", "move3"], 3),
    missionOutcome: section(
      "report.mission",
      "وضعیت مأموریت",
      ctx.mission.status >= 70
        ? "مأموریت اصلی حفظ شده و تاب‌آوری قابل قبول باقی مانده است."
        : "مأموریت ادامه دارد، اما بخشی از کیفیت یا ظرفیت آن تحت فشار است.",
      "state",
      ["mission.status", "mission.operationalReadiness"],
      3
    ),
    attributionEvolution: section(
      "report.attribution",
      "تحول برآورد انتساب",
      estimateParts.length === 3
        ? formatAttributionPath(estimateParts[0], estimateParts[1], estimateParts[2])
        : "برآورد انتساب بر اساس شواهد قابل مشاهده همین اجرا ثبت شده است.",
      "evidence",
      ["attribution.pre", "attribution.post", "attribution.final"],
      3
    ),
    finalDecision: section(
      "report.final_decision",
      "تصمیم نهایی ایران",
      decisionParts.join(" ") || "تصمیم‌های نهایی ایران در مسیر اجرا ثبت شد.",
      "user_choice",
      [ctx.iran.decisions.m3_threshold, ctx.iran.decisions.m3_coa, ctx.iran.decisions.m3_info, ctx.iran.decisions.m3_offramp].filter((value): value is string => Boolean(value)),
      3
    ),
    actorOutcome: section(
      "report.actors",
      "واکنش بازیگران",
      actorParts.join(" "),
      "actor",
      [ctx.israel.currentAction, ctx.ally.currentAction, ctx.commercial.currentAction].filter((value): value is string => Boolean(value)),
      3
    ),
    resources: section(
      "report.resources",
      "وضعیت منابع",
      `ظرفیت SSA: ${resourceValues.ssaCapacity}؛ ظرفیت حفاظتی: ${resourceValues.protectiveCapacity}؛ سرمایه سیاسی: ${resourceValues.politicalCapital}؛ ظرفیت افشای امن: ${resourceValues.disclosureBudget}.${costs.length ? ` بزرگ‌ترین هزینه‌های ناشی از انتخاب‌های شما: ${costs.join("، ")}.` : " هزینه مستقیمی از انتخاب‌های کاربر ثبت نشد."}`,
      "state",
      ["iran.resources", ...ctx.iran.resourceEvents.filter((event) => event.kind === "user_cost").map((event) => event.id)],
      3
    ),
    endStateNarrative,
  };
};

export const finalReportToSections = (report: FinalReportNarrative): Array<{ title: string; text: string }> => [
  { title: report.crisisPath.title, text: report.crisisPath.body },
  { title: report.missionOutcome.title, text: report.missionOutcome.body },
  { title: report.attributionEvolution.title, text: report.attributionEvolution.body },
  { title: report.finalDecision.title, text: report.finalDecision.body },
  { title: report.actorOutcome.title, text: report.actorOutcome.body },
  { title: report.resources.title, text: report.resources.body },
  {
    title: MOVE3_NARRATIVE_COPY_FA.finalReport.endStateTitle,
    text: `${report.endStateNarrative.shortSummary} ${report.endStateNarrative.causalFacts.join(" ")} ${report.endStateNarrative.closingLine}`,
  },
];

export const getNarrativeTraces = (sections: readonly NarrativeSection[]) =>
  sections.flatMap((item) => item.trace ? [item.trace] : []);
