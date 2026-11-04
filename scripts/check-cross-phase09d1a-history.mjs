import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// Execute historical tools in two isolated mirrors. Their output writes never touch repository baselines.
const root = process.cwd();
const baseline = JSON.parse(fs.readFileSync('docs/scenario-cross-phase09d1a-baseline.json', 'utf8'));
const beforeDir = process.argv[2];
const beforeFiles = JSON.parse(fs.readFileSync('docs/scenario-cross-phase09d1a-before-application-files.json', 'utf8'));
if (beforeDir && !fs.existsSync(beforeDir)) throw Error('Pre-edit source snapshot directory does not exist.');
const out = 'docs/scenario-cross-phase09d1a-checks'; fs.mkdirSync(out, { recursive: true });
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cross09d1a-history-'));
const scripts = [
  'scripts/validate-s4-cognitive-v3.mjs',
  'scripts/validate-profiles.ts',
  'scripts/validate-system-management.ts',
  'scripts/verify-s5-phase6-runtime.ts',
  'scripts/verify-s5-phase8d-integrated-gameplay.ts',
  'scripts/verify-s5-phase8d2-header.tsx',
  'scripts/verify-s5-phase8d2-ux.tsx',
  'scripts/verify-s5-phase09c1.tsx',
  'scripts/verify-s5-phase09c2.tsx',
];
const phases = {};
for (const phase of ['before', 'after']) {
  const dir = path.join(temp, phase); fs.mkdirSync(dir);
  for (const ent of fs.readdirSync(root, { withFileTypes: true })) if (ent.isFile()) fs.copyFileSync(path.join(root, ent.name), path.join(dir, ent.name));
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(dir, 'node_modules'), 'junction');
  fs.cpSync(path.join(root, 'docs'), path.join(dir, 'docs'), { recursive: true, filter: p => !/\.png$|phase09d1a-checks/.test(p) });
  const frozen = JSON.parse(fs.readFileSync(path.join(root, 'docs/scenario5-phase8d-baseline.json'), 'utf8')).frozen;
  for (const file of Object.keys(frozen).filter(p => p.startsWith('docs/'))) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.copyFileSync(path.join(root, file), path.join(dir, file));
  }
  const priorHashes = JSON.parse(fs.readFileSync(path.join(root, 'docs/scenario5-phase09c2-baseline.json'), 'utf8')).hashes;
  for (const file of Object.keys(priorHashes)) if (!fs.existsSync(path.join(dir, file)) && fs.existsSync(path.join(root, file))) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.copyFileSync(path.join(root, file), path.join(dir, file));
  }
  if (phase === 'before') {
    for (const file of Object.keys(baseline.hashes).filter(f => f.startsWith('src/') || f.startsWith('scripts/'))) {
      const dest = path.join(dir, file); fs.mkdirSync(path.dirname(dest), { recursive: true });
      if (beforeFiles[file]) fs.writeFileSync(dest, Buffer.from(beforeFiles[file], 'base64'));
      else fs.copyFileSync(beforeDir && fs.existsSync(path.join(beforeDir, file)) ? path.join(beforeDir, file) : path.join(root, file), dest);
    }
  } else for (const folder of ['src', 'scripts']) fs.cpSync(path.join(root, folder), path.join(dir, folder), { recursive: true });
  const results = [];
  for (const script of scripts) {
    const r = spawnSync(process.execPath, [path.join(root, 'node_modules/tsx/dist/cli.mjs'), script], { cwd: dir, encoding: 'utf8', windowsHide: true, maxBuffer: 32 * 1024 * 1024, timeout: 180000 });
    const label = path.basename(script);
    fs.writeFileSync(`${out}/${phase}-${label}.txt`, (r.stdout ?? '') + (r.stderr ?? '') + (r.error ? String(r.error) : ''));
    results.push({ script, exitCode: r.status, status: r.status === 0 ? 'PASS' : 'FAIL', log: `${out}/${phase}-${label}.txt` });
  }
  const lint = spawnSync(process.execPath, [path.join(root, 'node_modules/eslint/bin/eslint.js'), '.', '--format', 'json'], { cwd: dir, encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  const lintRows = JSON.parse(lint.stdout);
  const issues = lintRows.flatMap(row => row.messages.map(m => ({ file: path.relative(dir, row.filePath).replaceAll('\\', '/'), line: m.line, rule: m.ruleId, severity: m.severity, message: m.message })));
  fs.writeFileSync(`${out}/${phase}-lint.json`, JSON.stringify(issues, null, 2));
  phases[phase] = { results, lint: { errors: issues.filter(m => m.severity === 2).length, warnings: issues.filter(m => m.severity === 1).length, issues } };
  console.log(JSON.stringify({ phase, results: results.map(r => ({ script: r.script, status: r.status })), lintErrors: phases[phase].lint.errors }));
}
const sameVerifierStatuses = phases.before.results.every((r, i) => r.exitCode === phases.after.results[i].exitCode);
const noNewLintIssues = JSON.stringify(phases.before.lint.issues) === JSON.stringify(phases.after.lint.issues);
const result = { status: sameVerifierStatuses && noNewLintIssues ? 'PASS' : 'FAIL', sameVerifierStatuses, noNewLintIssues, phases, mirrorRoot: temp };
fs.writeFileSync('docs/scenario-cross-phase09d1a-historical-verification.json', JSON.stringify(result, null, 2));
if (result.status !== 'PASS') process.exitCode = 1;
