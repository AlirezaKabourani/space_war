import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd(), output = 'docs/scenario-cross-phase09d1b-checks'; fs.mkdirSync(output, { recursive: true });
const baseline = JSON.parse(fs.readFileSync('docs/scenario-cross-phase09d1b-baseline.json', 'utf8'));
const mirrorRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cross09d1b-history-'));
const scripts = [
  'scripts/validate-s4-cognitive-v3.mjs', 'scripts/validate-profiles.ts', 'scripts/validate-system-management.ts',
  'scripts/verify-s5-phase6-runtime.ts', 'scripts/verify-cross-phase09d1a-scientific.ts',
  'scripts/verify-s5-phase8d-integrated-gameplay.ts', 'scripts/verify-s5-phase8d2-header.tsx',
  'scripts/verify-s5-phase8d2-ux.tsx', 'scripts/verify-s5-phase09c1.tsx', 'scripts/verify-s5-phase09c2.tsx',
  'scripts/verify-cross-phase09d1a-browser.mjs',
];
const phases = {};
for (const phase of ['before', 'after']) {
  const dir = path.join(mirrorRoot, phase); fs.mkdirSync(dir);
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) if (entry.isFile()) fs.copyFileSync(path.join(root, entry.name), path.join(dir, entry.name));
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(dir, 'node_modules'), 'junction');
  fs.cpSync(path.join(root, 'docs'), path.join(dir, 'docs'), { recursive: true, filter: p => !/\.png$|phase09d1b-checks/.test(p) });
  const required = { ...JSON.parse(fs.readFileSync('docs/scenario5-phase8d-baseline.json', 'utf8')).frozen, ...JSON.parse(fs.readFileSync('docs/scenario5-phase09c2-baseline.json', 'utf8')).hashes };
  for (const file of [...Object.keys(required), '.git/config']) if (!fs.existsSync(path.join(dir, file)) && fs.existsSync(path.join(root, file))) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true }); fs.copyFileSync(path.join(root, file), path.join(dir, file));
  }
  if (phase === 'before') for (const file of Object.keys(baseline.hashes).filter(p => p.startsWith('src/') || p.startsWith('scripts/'))) {
    const dest = path.join(dir, file); fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (baseline.beforeFiles[file]) fs.writeFileSync(dest, Buffer.from(baseline.beforeFiles[file], 'base64'));
    else fs.copyFileSync(path.join(root, file), dest);
  }
  else for (const folder of ['src', 'scripts']) fs.cpSync(path.join(root, folder), path.join(dir, folder), { recursive: true });
  const checks = [];
  for (const script of scripts) {
    const r = spawnSync(process.execPath, [path.join(root, 'node_modules/tsx/dist/cli.mjs'), script], { cwd: dir, encoding: 'utf8', windowsHide: true, timeout: 240000, maxBuffer: 32 * 1024 * 1024 });
    const text = (r.stdout ?? '') + (r.stderr ?? '') + (r.error ? String(r.error) : '');
    const file = `${output}/${phase}-${path.basename(script)}.txt`; fs.writeFileSync(file, text);
    const failure = text.match(/AssertionError[^\n]*/)?.[0] ?? (r.status === 0 ? null : text.slice(0, 250));
    checks.push({ script, status: r.status === 0 ? 'PASS' : 'FAIL', exitCode: r.status, failure, log: file });
  }
  const lint = spawnSync(process.execPath, [path.join(root, 'node_modules/eslint/bin/eslint.js'), '.', '--format', 'json'], { cwd: dir, encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  const issues = JSON.parse(lint.stdout).flatMap(row => row.messages.map(m => ({ file: path.relative(dir, row.filePath).replaceAll('\\', '/'), line: m.line, rule: m.ruleId, severity: m.severity, message: m.message })));
  fs.writeFileSync(`${output}/${phase}-lint.json`, JSON.stringify(issues, null, 2));
  phases[phase] = { checks, lint: { errors: issues.filter(x => x.severity === 2).length, warnings: issues.filter(x => x.severity === 1).length, issues } };
  console.log(JSON.stringify({ phase, checks: checks.map(({ script, status }) => ({ script, status })), lintErrors: phases[phase].lint.errors }));
}
const sameHistoricalResults = phases.before.checks.every((r, i) => r.status === phases.after.checks[i].status && r.failure === phases.after.checks[i].failure);
const noNewLintIssues = JSON.stringify(phases.before.lint.issues) === JSON.stringify(phases.after.lint.issues);
const prior1APassesRetained = ['scripts/verify-cross-phase09d1a-scientific.ts', 'scripts/verify-cross-phase09d1a-browser.mjs'].every(s => phases.before.checks.find(r => r.script === s).status === 'PASS' && phases.after.checks.find(r => r.script === s).status === 'PASS');
const status = sameHistoricalResults && noNewLintIssues && prior1APassesRetained ? 'PASS' : 'FAIL';
fs.writeFileSync('docs/scenario-cross-phase09d1b-historical-verification.json', JSON.stringify({ status, sameHistoricalResults, noNewLintIssues, prior1APassesRetained, phases, mirrorRoot }, null, 2));
if (status !== 'PASS') process.exitCode = 1;
