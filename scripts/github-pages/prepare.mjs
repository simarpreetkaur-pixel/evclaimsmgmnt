// Prepares a CI checkout for the static GitHub Pages build of the prototype.
// Runs ONLY inside .github/workflows/deploy-pages.yml — it edits the working
// copy (never commit what it leaves behind).
//
// 1. Static export can't include server-only code, and the prototype doesn't
//    need it (all data comes from src/lib/services/localDemo):
//      - src/proxy.ts            (request middleware / auth cookie gate)
//      - src/app/api/**          (partner-logo image proxy)
//      - src/app/external/**     (external API route)
// 2. The analytics package lives on ACKO's internal registry, which GitHub's
//    runners can't reach, so it is swapped for a local no-op stub.

import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

for (const path of ['src/proxy.ts', 'src/app/api', 'src/app/external']) {
  const full = resolve(root, path);
  if (existsSync(full)) {
    rmSync(full, { recursive: true, force: true });
    console.log(`removed ${path}`);
  }
}

const pkgPath = resolve(root, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const privatePkg = '@acko-tech/building-blocks.ui.acko-analytics';
if (pkg.dependencies?.[privatePkg]) {
  pkg.dependencies[privatePkg] = 'file:./scripts/github-pages/acko-analytics-stub';
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`stubbed ${privatePkg}`);
}

// Private-registry lines would make the package manager try to authenticate.
const npmrcPath = resolve(root, '.npmrc');
if (existsSync(npmrcPath)) {
  const kept = readFileSync(npmrcPath, 'utf8')
    .split('\n')
    .filter((line) => !line.includes('nexus-prod.acko.in'));
  writeFileSync(npmrcPath, kept.join('\n'));
}
