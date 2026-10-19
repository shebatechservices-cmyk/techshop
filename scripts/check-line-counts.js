#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const MAX_LINES = 200;
const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  '.kilo',
  '.vscode',
  'coverage',
  'android',
  'build'
]);

function getSourceFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name)) {
        getSourceFiles(fullPath, fileList);
      }
    } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function runCheck() {
  const rootDir = process.cwd();
  const files = getSourceFiles(rootDir);
  const sourceViolations = [];
  const testViolations = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lineCount = content.split('\n').length;
    if (lineCount > MAX_LINES) {
      const relPath = path.relative(rootDir, file);
      const isTest = relPath.startsWith('tests/') || relPath.includes('.test.') || relPath.includes('.spec.');
      const item = { file: relPath, lines: lineCount };
      if (isTest) {
        testViolations.push(item);
      } else {
        sourceViolations.push(item);
      }
    }
  }

  sourceViolations.sort((a, b) => b.lines - a.lines);
  testViolations.sort((a, b) => b.lines - a.lines);

  console.log(`\n============================================================`);
  console.log(`  STRICT RULE-1: FILE LINE COUNT AUDIT (MAX: ${MAX_LINES} LINES)`);
  console.log(`============================================================`);
  console.log(`Total JS/JSX/TS files scanned: ${files.length}`);
  console.log(`Application Source files > ${MAX_LINES} lines: ${sourceViolations.length}`);
  console.log(`Test files > ${MAX_LINES} lines: ${testViolations.length}\n`);

  if (sourceViolations.length === 0) {
    console.log('✅ All application source files are strictly within 200 lines!\n');
  } else {
    console.log(`Top 25 Application Source Files Exceeding ${MAX_LINES} Lines:`);
    sourceViolations.slice(0, 25).forEach((v, idx) => {
      console.log(`  ${String(idx + 1).padStart(2)}. ${String(v.lines).padStart(4)} lines: ${v.file}`);
    });
  }

  if (process.argv.includes('--strict') && sourceViolations.length > 0) {
    console.error(`\n❌ Strict check failed: ${sourceViolations.length} source files exceed ${MAX_LINES} lines.\n`);
    process.exit(1);
  }
}

runCheck();
