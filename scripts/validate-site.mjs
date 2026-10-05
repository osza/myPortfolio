import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve paths relative to the repo root so the script works from any cwd.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(repoRoot);

const allowedTypes = new Set(['doc', 'tutorial', 'essay']);
const markdownSourceDirectories = [
  '.',
  'content/docs',
  'content/tutorials',
  'content/essays',
  'content/pages'
];

const readMarkdownPages = async () => {
  const pages = [];

  for (const directory of markdownSourceDirectories) {
    const absoluteDirectory = path.join(repoRoot, directory);
    let entries = [];

    try {
      entries = await readdir(absoluteDirectory, { withFileTypes: true });
    } catch {
      continue;
    }

    pages.push(
      ...entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
        .filter((entry) => !['README.md', 'Piotr_Oszenda_CV.md'].includes(entry.name))
        .map((entry) => (directory === '.' ? entry.name : path.posix.join(directory, entry.name)))
    );
  }

  return pages.sort();
};

const markdownFiles = await readMarkdownPages();

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
    const expectedOutput = path.basename(file).replace(/\.md$/i, '.html');
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

for (const file of markdownFiles) {
  const source = await readFile(file, 'utf8');
  const frontmatter = parseFrontmatter(source);
  const outputFile = frontmatter.output || path.basename(file).replace(/\.md$/i, '.html');
  const output = await readFile(outputFile, 'utf8');

  if (!output.includes(`Generated from ${file}`)) {
    failures.push(`${outputFile}: missing generated-file marker for ${file}`);
  }

  if (!output.includes('Built from Markdown source')) {
    failures.push(`${outputFile}: missing shared Markdown footer text`);
  }

  for (const marker of [frontmatter.title, frontmatter.description].filter(Boolean)) {
    if (!output.includes(marker)) {
      failures.push(`${outputFile}: generated output is missing "${marker}"`);
    }
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Validated ${htmlFiles.length} HTML pages, ${markdownFiles.length} Markdown sources, local links, generated-file markers, and the shared Markdown footer.`);
