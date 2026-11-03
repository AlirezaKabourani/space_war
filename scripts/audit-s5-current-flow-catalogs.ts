import ts from "typescript";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import * as content from "../src/ui/components/scenario/scenario-five/ui/uiContentFa.ts";

const read = (p: string) => readFileSync(p, "utf8");
const write = (p: string, s: string) => writeFileSync(`docs/${p}`, s, "utf8");
const csv = (p: string, rows: Record<string, unknown>[]) => {
  const cols = Object.keys(rows[0]!); const cell = (v: unknown) => `"${String(v ?? "").replaceAll('"','""')}"`;
  write(p, `${cols.map(cell).join(",")}\n${rows.map(r => cols.map(c => cell(r[c])).join(",")).join("\n")}\n`);
};
const root = "src/ui/components/scenario/";
const ui = `${root}scenario-five/ui/`;
const componentFiles = ["ScenarioFiveSimulation.tsx","ScenarioFiveMap.tsx","ScenarioFiveActionCard.tsx","ScenarioFiveResourcePanel.tsx","ScenarioFiveSummary.tsx"].map(p=>root+p)
  .concat(readdirSync(ui).filter(p=>p.endsWith(".tsx")).map(p=>ui+p));
const files = [...componentFiles, `${ui}uiContentFa.ts`, `${root}scenario-five/model/evidenceModel.ts`, `${root}scenario-five/ui/presentation.ts`, "src/App.tsx", "src/ui/components/scenario/ScenarioRunner.tsx", "src/scenarios/s5_silent_waves_redesign/tree.ts", "src/ui/components/common/BackgroundMusic.tsx"];
const program = ts.createProgram(files, { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, strictNullChecks: true, allowImportingTsExtensions:true, skipLibCheck:true, noEmit:true });
const checker = program.getTypeChecker();
const copyRows: any[] = [];
const numericRows: any[] = [];
const persian = /[\u0600-\u06ff]/;
const symbols = (node: ts.Node, sf: ts.SourceFile) => {
  const names: string[] = [];
  for (let p: ts.Node | undefined = node; p; p = p.parent) {
    if (ts.isPropertyAssignment(p)) names.unshift(p.name.getText(sf));
    else if ((ts.isVariableDeclaration(p)||ts.isFunctionDeclaration(p)) && p.name) names.unshift(p.name.getText(sf));
  }
  return names.join(".") || "JSX";
};
const surface = (path: string, symbol: string) => path.endsWith("App.tsx") ? "outer card/intro/host" : path.endsWith("tree.ts") || path.endsWith("ScenarioRunner.tsx") ? "post-AAR end screen" : path.includes("evidenceModel") ? "expanded evidence/AAR" : /BRIEFING/.test(symbol) ? "briefing" : /GLOSSARY/.test(symbol) ? "glossary" : /ACTION_COPY/.test(symbol) ? "decision action card/AAR" : /BELIEF/.test(symbol) ? "belief" : /Summary|CONSTRUCT|END_STATE|METHOD_LIMIT|ACTOR_LABEL|PROVENANCE/.test(path+symbol) ? "AAR" : path.includes("Map") ? "map" : path.includes("Resource") ? "live header" : "live player UI";
const technical = (text: string) => [...new Set(text.match(/PNT|GNSS|ISR|ETA|\bD\b|NAV|OSI|IQR|HHI|\bSD\b|Actor|fallback|corroborated|Orientation|Construct|CP|ms|T\+/g)??[])].join("|");
function appendCopy(text: string, node: ts.Node, sf: ts.SourceFile, kind: string, context = "") {
  if (!text.trim()) return;
  const symbol = symbols(node,sf);
  copyRows.push({copyId:`copy-${String(copyRows.length+1).padStart(4,"0")}`, surface:surface(sf.fileName,symbol),runtimeStageOrContext:context || (/A2_prebelief|A2_postbelief|C_belief_checkpoint|D_final_belief/.exec(symbol)?.[0]??"conditional/multiple; see source"),sourceFile:sf.fileName,sourceSymbol:`${symbol}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1}`,exactPersianText:text,containsEnglishAcronym:/\b[A-Z]{2,}\b/.test(text),technicalTerm:technical(text),repeatedElsewhere:false,notes:kind});
}
const metadata: Record<string, unknown> = {};
for (const path of files) {
  const sf = program.getSourceFile(path)!;
  const text=read(path);
  let region: ts.Node = sf;
  let appRanges: {start:number;end:number}[]=[];
  if (path.endsWith("App.tsx")) {
    const locate=(n:ts.Node)=>{
      if(ts.isObjectLiteralExpression(n) && n.properties.some(p=>ts.isPropertyAssignment(p)&&p.name.getText(sf)==="id"&&p.initializer.getText(sf)==="5")){
        for(const p of n.properties) if(ts.isPropertyAssignment(p)) {
          if(ts.isStringLiteralLike(p.initializer)) metadata[p.name.getText(sf)] = p.initializer.text;
          if(["title","introTitle","summary","descriptionPreview","fullDescription","introText","badges"].includes(p.name.getText(sf))) appRanges.push({start:p.initializer.pos,end:p.initializer.end});
        }
      }
      if(ts.isVariableDeclaration(n) && ["renderScenarioList","renderScenarioPlay"].includes(n.name.getText(sf))) {
        const end = n.name.getText(sf)==="renderScenarioPlay" ? text.indexOf("{/* نسخه‌ی قدیمی", n.pos):n.end;
        appRanges.push({start:n.pos,end:end>n.pos?end:n.end});
      }
      if(ts.isVariableDeclaration(n)&&n.name.getText(sf)==="RELEASED_SCENARIO_TITLES") {
        const s=n.initializer; if(s&&ts.isObjectLiteralExpression(s))for(const p of s.properties)if(ts.isPropertyAssignment(p)&&p.name.getText(sf)==="5")appRanges.push({start:p.pos,end:p.end});
      }
      if(ts.isReturnStatement(n)&&n.expression&&n.expression.getText(sf).startsWith('(')&&n.expression.getText(sf).includes('<div className={"app-root"'))appRanges.push({start:n.pos,end:n.end});
      ts.forEachChild(n,locate);
    };locate(sf);
  }
  const inScope=(n:ts.Node)=>{
    if(path.endsWith("App.tsx"))return appRanges.some(r=>n.pos>=r.start&&n.end<=r.end);
    if(path.endsWith("ScenarioRunner.tsx"))return n.pos>=text.indexOf("const renderEndNode")&&n.end<=text.indexOf("const renderMiniGameNode");
    if(path.endsWith("tree.ts"))return symbols(n,sf).includes("summaryText");
    return true;
  };
  const visit=(n:ts.Node)=>{
    // Partial evaluation of the current S5 outer end-screen branch.
    if(path.endsWith("ScenarioRunner.tsx")&&ts.isConditionalExpression(n)&&n.condition.getText(sf)==="isScenarioOneEnd") {visit(n.whenFalse);return;}
    if(inScope(n)){
      if(ts.isJsxText(n)&&n.getText(sf).trim())appendCopy(n.getText(sf).split(/\r?\n/).map(s=>s.trim()).filter(Boolean).join(" "),n,sf,"JSX text; JSX indentation whitespace normalized exactly as rendering");
      else if(ts.isStringLiteralLike(n)&&!ts.isJsxText(n)) {
        const isKey = (ts.isPropertyAssignment(n.parent)&&n.parent.name===n)||(ts.isJsxAttribute(n.parent)&&n.parent.name===n);
        if(!isKey&&(persian.test(n.text)||["NAV","H","G","E","OSI","Orientation","Constructها","ms","IQR","other","—","+","%","′"].includes(n.text)))appendCopy(n.text,n,sf, ts.isJsxAttribute(n.parent)?"attribute/accessible text":"literal/formatting token; occurrence preserved");
      } else if(ts.isTemplateExpression(n)&&(persian.test(n.getText(sf))||/ETA|T\+|CP|ms/.test(n.getText(sf)))) appendCopy(n.getText(sf).slice(1,-1),n,sf,"Exact source template: ${...} denotes a current expression, not replacement copy");
    }
    ts.forEachChild(n,visit);
  };visit(region);
}
// Raw fallback emitted for the real 'other' provenance branch; not in the Persian mapping.
const source=program.getSourceFile(`${root}ScenarioFiveSummary.tsx`)!;
appendCopy("other",source,source,"Raw enum fallback from SCENARIO5_PROVENANCE_LABELS_FA[hiddenProvenance] ?? hiddenProvenance","AAR evidence relation='other'");
const auditData=JSON.parse(read("docs/scenario5-current-audit-data.json"));
const technicalRow=(text:string,sourceFile:string,sourceSymbol:string,notes:string)=>copyRows.push({copyId:`copy-${String(copyRows.length+1).padStart(4,"0")}`,surface:"AAR technical/raw field",runtimeStageOrContext:"complete only",sourceFile,sourceSymbol,exactPersianText:text,containsEnglishAcronym:/\b[A-Z]{2,}\b/.test(text),technicalTerm:"technical/raw ID",repeatedElsewhere:false,notes});
for(const [typeName,pattern] of [["ActorPosture",/export type ActorPosture = ([\s\S]*?);/],["ActorReactionId",/export type ActorReactionId =([\s\S]*?);/]] as const){
  const body=read(`${root}scenario-five/model/types.ts`).match(pattern)?.[1]??"";
  for(const match of body.matchAll(/"([^"]+)"/g))technicalRow(match[1]!,`${root}scenario-five/model/types.ts`,typeName,"Finite technical enum shown by current AAR; not a live threat label.");
}
for(const world of [...new Map(auditData.runs.map((r:any)=>[r.world.worldId,r.world])).values()] as any[])technicalRow(world.worldId,`${root}scenario-five/model/worldCatalog.ts`,"WORLD_CATALOG / createTemplate.worldId","Replay technical details, initially collapsed; all16 exact current IDs. Seeds are numeric and inventoried separately, not enumerated as copy.");
for(const id of Object.keys(auditData.beliefMetadata))technicalRow(id.replace('belief:',''),`${root}scenario-five/model/runtime/stageMachine.ts`,"BELIEF_STAGE_METADATA.checkpointId","Raw checkpoint ID may be rendered by AAR first-correct / first-recognition value fields.");
const duplicates=new Map<string,number>(); for(const r of copyRows)duplicates.set(r.exactPersianText,(duplicates.get(r.exactPersianText)??0)+1);
for(const r of copyRows)r.repeatedElsewhere=duplicates.get(r.exactPersianText)!>1;
csv("scenario5-player-copy-catalog.csv",copyRows);

function numericType(n:ts.Node):boolean {
  const t=checker.getTypeAtLocation(n); const types=t.isUnion()?t.types:[t];
  return types.some(t=>Boolean(t.flags&ts.TypeFlags.NumberLike)) && types.every(t=>Boolean(t.flags&(ts.TypeFlags.NumberLike|ts.TypeFlags.Null|ts.TypeFlags.Undefined)) || (t.isStringLiteral()&&t.value==="—"));
}
const numericKey=new Set<string>();
function numberBinding(expr:ts.Expression, sf:ts.SourceFile, container:ts.Node) {
  if(numericType(expr)) {
    const expression=expr.getText(sf), line=sf.getLineAndCharacterOfPosition(expr.getStart(sf)).line+1;
    const key=`${sf.fileName}:${line}:${expression}`; if(numericKey.has(key))return; numericKey.add(key);
    const parentText=container.getText(sf);
    const label=ts.isJsxAttribute(container)&&ts.isJsxAttributes(container.parent) ? container.parent.properties.find(p=>ts.isJsxAttribute(p)&&p.name.getText(sf)==="label")?.getText(sf)??parentText.slice(0,110) : parentText.slice(0,110);
    const field=expression.replace(/\.toFixed\(\d+\)/g,"");
    const isMs=/Ms|ms/.test(expression+parentText), isTime=!isMs&&/Minute|Clock|ETA|remaining|delay|تأخیر|مهلت|مدت|زمان عملیاتی/i.test(expression+parentText);
    const isSigned=/orientation\.(overall|phaseScores)|riskPosture/.test(expression);
    const min=isSigned? -1:/deadlineMargin|delayDelta/.test(expression)?"unbounded signed":0;
    const max=isSigned?1:/integrity|confidence|Estimate|Capacity|Reserve|Completeness|Percent|constructs/i.test(expression)?100:/clock|remaining/i.test(expression)?360:/deadlineMinute/i.test(expression)?345:"source-dependent; see formula";
    numericRows.push({displayLabel:label,surface:surface(sf.fileName,symbols(expr,sf)),runtimeStage:/Summary/.test(sf.fileName)?"complete":"live/context-dependent",sourceField:field,sourceFunction:`${sf.fileName}:${line} ${symbols(expr,sf)}`,formula:expression,unit:isMs?"wall-clock ms":isTime?"operational minutes":/Percent/.test(expression)?"percent":"dimensionless/count; label-specific",format:/toFixed|valueOrUnavailable/.test(parentText)?"decimal via toFixed(2) / null text":"raw JSX number or source template",rounding:/toFixed|valueOrUnavailable/.test(parentText)?"two decimal places":"none at render; model may round impacts",minimum:min,maximum:max,canBeNull:checker.getTypeAtLocation(expr).isUnion()&&checker.getTypeAtLocation(expr).types.some(t=>t.flags&ts.TypeFlags.Null),whenUpdated:/Summary/.test(sf.fileName)?"after runtime complete":"React render after current runtime/local value changes",shouldMatchOtherDisplay:/convoy\./.test(expression)?"mission convoy / outcome if same time":/resources\./.test(expression)?"mission resources / header / outcome if same time":"same source field at same stage; see sourceFunction",currentMatchCheck:/index|value$|phaseScores/.test(expression)?"NOT_COMPARABLE":"PASS",notes:"Inventory unit is one numeric rendering binding/template, not one instantiated convoy/phase cell. PASS means source-binding consistency; A..Q execution scope in sync-results JSON. AAR values are not live values."});
    return;
  }
  if(ts.isTemplateExpression(expr))for(const span of expr.templateSpans)numberBinding(span.expression,sf,container);
  else if(ts.isCallExpression(expr)) {
    if(ts.isPropertyAccessExpression(expr.expression)&&expr.expression.name.text==="toFixed") numberBinding(expr.expression.expression,sf,container);
    else if(ts.isIdentifier(expr.expression)&&expr.expression.text==="valueOrUnavailable") { if(expr.arguments[0])numberBinding(expr.arguments[0],sf,container); }
    else if(ts.isPropertyAccessExpression(expr.expression)) {
      if(ts.isCallExpression(expr.expression.expression)) numberBinding(expr.expression.expression,sf,container);
      for(const arg of expr.arguments) if(ts.isArrowFunction(arg)&&!ts.isBlock(arg.body)) numberBinding(arg.body,sf,container);
    }
  } else if(ts.isConditionalExpression(expr)){numberBinding(expr.whenTrue,sf,container);numberBinding(expr.whenFalse,sf,container);}
  else if(ts.isParenthesizedExpression(expr))numberBinding(expr.expression,sf,container);
  else if(ts.isBinaryExpression(expr)&&[ts.SyntaxKind.QuestionQuestionToken,ts.SyntaxKind.BarBarToken].includes(expr.operatorToken.kind)){numberBinding(expr.left,sf,container);numberBinding(expr.right,sf,container);}
}
for(const path of componentFiles){
  const sf=program.getSourceFile(path)!;
  const visit=(n:ts.Node)=>{
    if(ts.isJsxExpression(n)&&n.expression&&!ts.isJsxAttribute(n.parent))numberBinding(n.expression,sf,n.parent);
    if(ts.isJsxAttribute(n)&&n.name.getText(sf)==="value"&&n.initializer&&ts.isJsxExpression(n.initializer)&&n.initializer.expression)numberBinding(n.initializer.expression,sf,n);
    ts.forEachChild(n,visit);
  };visit(sf);
}
const addNumeric=(displayLabel:string,surface:string,sourceField:string,formula:string,unit:string,min:unknown,max:unknown,nullable:boolean,notes:string)=>numericRows.push({displayLabel,surface,runtimeStage:surface==="AAR"?"complete":"belief/live",sourceField,sourceFunction:"explicit expansion of current generic JSX binding; see referenced sourceField",formula,unit,format:"current source formatter",rounding:"toFixed(2) in AAR; raw integer for range",minimum:min,maximum:max,canBeNull:nullable,whenUpdated:surface==="AAR"?"after completion":"local response input / runtime updates",shouldMatchOtherDisplay:"same current result/input field",currentMatchCheck:"PASS",notes});
for(const key of Object.keys(content.SCENARIO5_CONSTRUCT_LABELS_FA)) addNumeric(content.SCENARIO5_CONSTRUCT_LABELS_FA[key as keyof typeof content.SCENARIO5_CONSTRUCT_LABELS_FA],"AAR",`cognitive.constructs.${key}`,key==="informationDiscipline"?"always null; renders not measured":"frozen calculateScenario5CognitiveRunResult field; source cognitiveEngine.ts",key==="riskPosture"?"relative non-normative index":"0..100 proxy",key==="riskPosture"?-1:0,key==="riskPosture"?1:100,true,"Concrete key expansion of the actual Object.entries(cognitive.constructs) rendering; not an added metric.");
for(const [label,field]of[["اطمینان شما به انتخاب این کریدور","corridorConfidence"],["احتمال اخلال هدفمند","targetedInterferenceEstimate"],["اطمینان شما به برآورد اخلال هدفمند","targetedInterferenceConfidence"]])addNumeric(label!,"belief",`RuntimeBeliefInput.${field}`,"actualValue===null ? ثبت نشده : actualValue / 100; native displayValue=actualValue??50","0..100 integer",0,100,true,"Semantic null initially; native midpoint is not an answer. Current exact labels are in copy catalog.");
addNumeric("کران‌های نوار برداشت","belief","range.min/max/step","min=0; max=100; step=1","integer endpoints/step",0,100,false,"Three current native ranges use the same bounds; static helper labels show ۰ and ۱۰۰.");
addNumeric("پیشرفت بصری کامیون","map","visualProgress[convoy.convoyId]","delivered?1:held?previous:Math.max(previous,clamp(clock/Math.max(ETA,1),0,.97))","route fraction",0,1,false,"Map-only visual; SVG progress is not a mission/scoring metric. Real browser compares persistent state.");
// Bounds/units are field contracts, never inferred from neighboring text in a shared paragraph.
for(const r of numericRows){
  const f=r.sourceField as string;
  if(f.includes("informationDiscipline")){r.minimum="not applicable";r.maximum="not applicable";r.unit="not measured / null";continue;}
  if(/roundId/.test(f)){r.minimum=1;r.maximum=8;r.unit="round number";}
  else if(f==="index + 1"){r.minimum=1;r.maximum=4;r.unit="belief checkpoint ordinal";}
  else if(/evidence|Evidence/.test(f)&&/length|Count/.test(f)){r.minimum=0;r.maximum="no UI cap; existing source requests/path-dependent finite set";r.unit="evidence items";}
  else if(/Count|Revisions|revisedWindows|revisionCount|^count$/.test(f)){
    r.unit="count";r.minimum=0;
    r.maximum=/secondaryDelivered/.test(f)?3:/ConvoyCount|CoverageCount/.test(f)?4:/routeDiversionCount/.test(f)?2:/checkpointOperationCount|groundResponseCount|holdOperationCount/.test(f)?2:/localizedDisruptionEventCount/.test(f)?3:/TargetedDecisionCount|revisedWindows|^count$/.test(f)?8:"no UI cap; selection-history length-dependent";
    if(f==="count")r.sourceField="domain.networkLogisticsBalance.targetedDecisionCountByCorridor[id]";
  }
  else if(/isrCost|isrSpent|supportCost|supportSpent/.test(f)){r.minimum=0;r.maximum=22;r.unit="capacity units";}
  else if(/durationMinutes/.test(f)){r.minimum=5;r.maximum=25;r.unit="operational minutes (catalog action duration only)";r.notes+=" Actual nonfinal world-clock delta adds base20; finalization sets clock360.";}
  else if(/Capacity|Reserve/.test(f)){r.minimum=0;r.maximum=100;r.unit="capacity units";}
  else if(/worldClock|worldClockMinutes|remaining/.test(f)){r.minimum=0;r.maximum=360;r.unit="operational minutes / absolute T+ except remaining";}
  else if(/deadlineMinute/.test(f)){r.minimum=300;r.maximum=345;r.unit="absolute operational T+ minutes; current four deadlines";}
  else if(/deadlineMargin/.test(f)){r.minimum=/Math\.abs/.test(f)?0:"negative allowed, path-dependent";r.maximum=/Math\.abs/.test(f)?"absolute signed margin; no UI cap":95;r.unit="operational minutes";}
  else if(/projectedArrival/.test(f)){r.minimum=210;r.maximum="baseline + path-dependent nonnegative delay; no UI cap";r.unit="absolute operational T+ minutes";}
  else if(/delay|Delay/.test(f)){r.minimum=/Delta/.test(f)?"signed path-dependent":0;r.maximum="finite 8-step mission-derived; no UI cap";r.unit="operational minutes";}
  else if(/DecisionMs/.test(f)){r.minimum=0;r.maximum="unbounded real interaction time";r.unit="wall-clock milliseconds";}
  else if(/evidenceTriggeredRevisionRate|Percent|Completeness/.test(f)){r.minimum=0;r.maximum=100;r.unit="percent";}
  else if(/orientation\.(overall|phaseScores)|riskPosture/.test(f)){r.minimum=-1;r.maximum=1;r.unit="relative non-normative index";}
  else if(/orientation\.dispersion/.test(f)){r.minimum=0;r.maximum=1;r.unit="population SD over phase OSI";}
  else if(/orientation\.(operationalStrength|strategicStrength|integration)|integrity|Integrity|PntExposure|Confidence|Estimate|constructs\./i.test(f)){r.minimum=0;r.maximum=100;r.unit="proxy/index points on 0..100 scale; see exact field";}
  else if(/Hhi/.test(f)){r.minimum=0.25;r.maximum=1;r.unit="targeted-attention concentration; null if no targeted decisions";}
  else if(/evidence|Evidence/.test(f)&&/length|Count/.test(f)){r.minimum=0;r.maximum="no UI cap; existing source requests/path-dependent finite set";r.unit="evidence items";}
  else if(f==="aar.truth.seed"){r.minimum="current assignment: nonzero uint32";r.maximum=4294967295;r.unit="technical replay seed, not a score";}
  else if(f==="value"||f==="value ?? 50"){r.minimum=r.surface==="AAR"?-1:0;r.maximum=100;r.unit="generic rendering binding; concrete construct/input rows below";r.currentMatchCheck="NOT_COMPARABLE";}
}
for(const fact of [
  {displayLabel:"افق مأموریت ۳۶۰ دقیقه",surface:"briefing",runtimeStage:"before runtime",sourceField:"ScenarioFiveSimulation briefing static horizon caption / MISSION_HORIZON_MINUTES",formula:"360",unit:"operational minutes",minimum:360,maximum:360},
  {displayLabel:"هشت تصمیم",surface:"briefing",runtimeStage:"before runtime",sourceField:"ScenarioFiveSimulation briefing static decision-count caption / 8 decision stage IDs",formula:"8",unit:"decisions",minimum:8,maximum:8},
  {displayLabel:"چهار فاز",surface:"briefing",runtimeStage:"before runtime",sourceField:"ScenarioFiveSimulation briefing static phase-count caption / A,B,C,D",formula:"4",unit:"phases",minimum:4,maximum:4},
  {displayLabel:"یکپارچگی حداقل ۶۰",surface:"AAR mission continuity note",runtimeStage:"complete",sourceField:"ScenarioFiveSummary continuity definition / calculateNetworkContinuity integrity>=60",formula:"60",unit:"integrity points",minimum:60,maximum:60},
  {displayLabel:"شماره بخش‌های گزارش ۱ تا ۸",surface:"AAR headings",runtimeStage:"complete",sourceField:"ScenarioFiveSummary eight static numbered section headings",formula:"1..8",unit:"structural ordinal",minimum:1,maximum:8},
])numericRows.push({...fact,sourceFunction:fact.surface==="briefing"?"ScenarioFiveSimulation.tsx briefing JSX":"ScenarioFiveSummary.tsx section headings / mission note",format:"exact static Persian caption; occurrence in copy catalog",rounding:"none",canBeNull:false,whenUpdated:"static current caption",shouldMatchOtherDisplay:"current frozen horizon/stage count/continuity threshold; ordinal is structural",currentMatchCheck:fact.unit==="structural ordinal"?"NOT_COMPARABLE":"PASS",notes:"Static displayed number, not a new metric. Dynamic bindings and their instantiated values are separately inventoried."});
csv("scenario5-numeric-ui-audit.csv",numericRows);
write("scenario5-current-catalog-extraction.json",JSON.stringify({copyCount:copyRows.length,uniqueCopyCount:duplicates.size,numericDisplayBindingCount:numericRows.length,metadata,coverage:{actionTitles:33,actionDescriptions:33,knownEffects:33,method:"TypeScript AST over active S5 surfaces, current metadata/host branches, emitted evidence text; templates retained verbatim. Numeric types resolved by TypeScript checker and concrete generic construct/input expansions."}},null,2));
console.log(`Copy catalog: ${copyRows.length} occurrences (${duplicates.size} unique). Numeric inventory: ${numericRows.length} rendering bindings/explicit generic-key expansions.`);
