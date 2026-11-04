import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { WORLD_CATALOG } from '../src/ui/components/scenario/scenario-five/model/index.ts';
import { MISSION_POLICIES } from '../src/ui/components/scenario/scenario-five/calibration/missionPolicies.ts';
import { simulateScenario5 } from '../src/ui/components/scenario/scenario-five/calibration/simulationDriver.ts';
import { verifyPresentation } from './verify-s5-phase8d-presentation.tsx';

export const read = (p: string) => readFileSync(p, 'utf8');
export const hash = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');
const files = (p: string): string[] => readdirSync(p, {withFileTypes:true}).flatMap(e => e.isDirectory() ? files(`${p}/${e.name}`) : [`${p}/${e.name}`]);
const frozen = () => [...files('src/ui/components/scenario/scenario-five/model'), ...files('src/ui/components/scenario/scenario-five/calibration'), ...files('src/scenarios/s2_silent_waves'), ...files('src/ui/components/scenario').filter(p => /\/ScenarioTwo[^/]+$/.test(p)), ...files('docs').filter(p => /scenario5-phase8b/.test(p))];
export function corpus() {
  return WORLD_CATALOG.flatMap(w => MISSION_POLICIES.filter(p => !p.oraclePolicy && !p.stressPolicy && !p.randomPolicy).map(policy => {
    const run = simulateScenario5({worldId:w.worldId, environmentSeed:1, policy});
    return {worldId:w.worldId, policy:policy.policyId, digest:hash(JSON.stringify(run)), run};
  }));
}
const path = 'docs/scenario5-phase8d-baseline.json';
if (process.argv.includes('--record-baseline')) {
  assert(!existsSync(path), 'Never overwrite preimplementation baseline');
  const runs = corpus();
  writeFileSync(path, JSON.stringify({frozen:Object.fromEntries(frozen().map(p => [p,hash(readFileSync(p))])), app:read('src/App.tsx'), corpus:runs.map(({run:_,...r}) => r)}, null, 2));
  console.log(`Baseline recorded: ${runs.length} complete runs, seed=1, 16 worlds, 7 player-valid policies.`);
} else {
  const baseline = JSON.parse(read(path));
  for (const [p,h] of Object.entries(baseline.frozen)) assert.equal(hash(readFileSync(p)),h,p);
  // Human-approved 08D.1 replaces exactly this sentence in active id=5.
  // Keep byte equality for every other App.tsx character and all legacy metadata.
  const previousResourceCopy = 'تصمیم‌های شما زمان عملیاتی و منابع ISR یا پشتیبانی مصرف می‌کنند و می‌توانند گزینه‌های مراحل بعد را محدود کنند.';
  const approvedResourceCopy = 'تصمیم‌های شما زمان عملیاتی و منابع ISR یا پشتیبانی مصرف می‌کنند. منابع محدودند و نحوه مصرف آنها بر ظرفیت باقی‌مانده، تاب‌آوری و نتیجه مأموریت اثر می‌گذارد.';
  assert.equal(baseline.app.split(previousResourceCopy).length,2,'Exactly one approved metadata replacement');
  assert.equal(read('src/App.tsx'),baseline.app.replace(previousResourceCopy,approvedResourceCopy),'App identity including legacy id=2 unchanged except exact approved id=5 resource sentence');
  const runs=corpus();
  assert.deepEqual(runs.map(({run:_,...r})=>r),baseline.corpus,'Exact scientific before/after parity');
  const checks=verifyPresentation(runs.map(r=>r.run));
  writeFileSync('docs/scenario5-phase8d-verification.json',JSON.stringify({status:'PASS',runCount:runs.length,mismatchCount:0,frozenHashCount:Object.keys(baseline.frozen).length,...checks},null,2));
  console.log(`Phase 08D presentation PASS: ${checks.assertions} assertions; ${checks.witnesses.length} ending witnesses.`);
  console.log(`Phase 08D parity PASS: ${runs.length} runs; zero mismatches; all frozen hashes unchanged.`);
}
