import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve paths relative to the repo root so the script works from any cwd.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(repoRoot);

const allowedTypes = new Set(['doc', 'tutorial', 'essay']);
const markdownFiles = (await readdir('.')).filter((file) => file.endsWith('.md') && !['README.md', 'Piotr_Oszenda_CV.md'].includes(file));

const parseFrontmatter = (source) => {
  if (!source.startsWith('---\n')) return {};

  const end = source.indexOf('\n---\n', 4);
  if (end === -1) return {};

  const raw = source.slice(4, end).trim();
  const data = {};

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf(':');
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    data[key] = value;
  }

  return data;
};

const htmlFiles = (await readdir('.')).filter((file) => file.endsWith('.html'));
const failures = [];

for (const file of markdownFiles) {
  const source = await readFile(file, 'utf8');
  const frontmatter = parseFrontmatter(source);

  if (!frontmatter.type) {
    failures.push(`${file}: missing required frontmatter field "type"`);
  } else if (!allowedTypes.has(frontmatter.type)) {
    failures.push(`${file}: unsupported frontmatter type "${frontmatter.type}"`);
  }

  if (!frontmatter.output) {
    failures.push(`${file}: missing required frontmatter field "output"`);
  } else {
    const expectedOutput = file.replace(/\.md$/i, '.html');
    if (frontmatter.output !== expectedOutput) {
      failures.push(`${file}: output must be "${expectedOutput}"`);
    }
  }
}

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    // Skip external links, anchors, and non-file protocols
    if (/^(https?:|mailto:|tel:|#)/.test(href)) continue;
    // Treat every other href as a local file (with or without leading './')
    const target = href.split('#')[0].replace(/^\.\//, '');
    if (!target) continue;
    try {
      await access(path.resolve(target));
    } catch {
      failures.push(`${file}: missing local target ${href}`);
    }
  }
}

const tutorialSource = await readFile('customers-api-tutorial.md', 'utf8');
const tutorialOutput = await readFile('customers-api-tutorial.html', 'utf8');
if (!tutorialOutput.includes('Generated from customers-api-tutorial.md')) {
  failures.push('customers-api-tutorial.html: missing generated-file marker');
}
for (const marker of ['Manage customer data with the Customers API', 'CRUD tutorial']) {
  if (!tutorialSource.includes(marker) || !tutorialOutput.includes(marker)) {
    failures.push(`customers-api-tutorial.html: generated output is missing "${marker}"`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Validated ${htmlFiles.length} HTML pages, ${markdownFiles.length} Markdown sources, local links, and the generated Customers API tutorial.`);
