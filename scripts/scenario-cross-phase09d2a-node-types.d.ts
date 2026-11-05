// Audit-local declarations for the two Node built-ins used by the audit script.
// The repository does not install @types/node; no dependency/config change needed.
declare module 'node:fs' {
  const fs: {
    readFileSync(path: string, encoding: 'utf8'): string;
    writeFileSync(path: string, data: string): void;
  };
  export default fs;
}
declare module 'node:assert/strict' {
  const assert: {
    ok(value: unknown, message?: string): asserts value;
    deepEqual(actual: unknown, expected: unknown, message?: string): void;
  };
  export default assert;
}
