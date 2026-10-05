import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(repoRoot);

import { renderDocumentationPage } from '../layouts/doc-page.mjs';
import { renderTutorialPage } from '../layouts/tutorial-page.mjs';
import { renderEssayPage } from '../layouts/essay-page.mjs';

const markdownSourceDirectories = [
  '.',
  'content/docs',
  'content/tutorials',
  'content/essays',
  'content/pages'
];

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const renderMermaidCode = (value = '') => escapeHtml(value)
  .replaceAll('&lt;br/&gt;', '<br/>')
  .replaceAll('&lt;br /&gt;', '<br />');

const inline = (value = '') => escapeHtml(value)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, href) => {
    const external = /^https?:\/\//.test(href) || href.startsWith('mailto:');
    const attrs = external && !href.startsWith('mailto:')
      ? ' target="_blank" rel="noopener noreferrer"'
      : '';
    return `<a href="${escapeHtml(href)}"${attrs}>${text}</a>`;
  });

const slug = (value = '') => String(value)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const isTableDivider = (value) => /^\|(?:\s*:?-{2,}:?\s*\|)+$/.test(value);

const table = (rows) => {
  const cells = (row) => row.split('|').slice(1, -1).map((cell) => cell.trim());
  const [head, ...body] = rows.filter((row) => !isTableDivider(row));

  return `<div class="table-wrapper"><table><thead><tr>${cells(head)
    .map((cell) => `<th scope="col">${inline(cell)}</th>`)
    .join('')}</tr></thead><tbody>${body
    .map((row) => `<tr>${cells(row).map((cell) => `<td>${inline(cell)}</td>`).join('')}</tr>`)
    .join('')}</tbody></table></div>`;
};

const parseInlineList = (value = '') => value
  .split('|')
  .map((item) => item.trim())
  .filter(Boolean);

const parseKeyValueList = (value = '') => parseInlineList(value).map((entry) => {
  const separator = entry.indexOf('::');
  if (separator === -1) {
    return { title: entry, text: '' };
  }

  return {
    title: entry.slice(0, separator).trim(),
    text: entry.slice(separator + 2).trim()
  };
});

const parseScalar = (key, rawValue) => {
  if (rawValue === 'true') return true;
  if (rawValue === 'false') return false;

  const normalizedValue =
    ((rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'")))
      ? rawValue.slice(1, -1)
      : rawValue;

  if (key === 'hero_stats' || key === 'accent_sections') {
    return parseInlineList(normalizedValue);
  }

  if (key === 'hero_panel_items') {
    return parseKeyValueList(normalizedValue);
  }

  return normalizedValue;
};

const parseFrontmatter = (source) => {
  if (!source.startsWith('---\n')) {
    return { data: {}, content: source };
  }

  const end = source.indexOf('\n---\n', 4);
  if (end === -1) {
    return { data: {}, content: source };
  }

  const raw = source.slice(4, end).trim();
  const content = source.slice(end + 5);
  const data = {};

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf(':');
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();

    data[key] = parseScalar(key, value);
  }

  return { data, content };
};

const inferTypeFromFilename = (filename) => {
  if (filename.includes('tutorial')) return 'tutorial';
  return 'doc';
};

const getRenderer = (type) => {
  if (type === 'tutorial') return renderTutorialPage;
  if (type === 'essay') return renderEssayPage;
  return renderDocumentationPage;
};

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

const getPageTitle = (frontmatter, title) => frontmatter.title || `${title} — Piotr Oszenda`;
const getPageDescription = (frontmatter, lead) => frontmatter.description || lead;
const getOutputPath = (filename, frontmatter) => frontmatter.output || path.basename(filename).replace(/\.md$/i, '.html');

const buildHeroPanel = (frontmatter, sourcePath) => {
  const hasConfig = frontmatter.hero_panel_label || frontmatter.hero_panel_items || frontmatter.hero_panel_style || frontmatter.hero_panel_id;

  if (!hasConfig) {
    return {
      id: 'sample-proof-title',
      label: 'Build status',
      style: 'default',
      items: [
        { title: 'Markdown source', text: sourcePath },
        { title: 'Generated HTML', text: 'Built locally before publication.' },
        { title: 'Checked output', text: 'Source markers and local links are validated in CI.' }
      ]
    };
  }

  const items = Array.isArray(frontmatter.hero_panel_items) && frontmatter.hero_panel_items.length
    ? frontmatter.hero_panel_items
    : [
        { title: 'Markdown source', text: sourcePath },
        { title: 'Generated HTML', text: 'Built locally before publication.' },
        { title: 'Checked output', text: 'Source markers and local links are validated in CI.' }
      ];

  return {
    id: frontmatter.hero_panel_id || 'sample-proof-title',
    label: frontmatter.hero_panel_label || 'Build status',
    style: frontmatter.hero_panel_style || 'default',
    items
  };
};

const validatePageStructure = (filename, lines) => {
  const h1Lines = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.startsWith('# '));

  if (!h1Lines.length) {
    throw new Error(`Missing H1 in ${filename}`);
  }

  if (h1Lines.length > 1) {
    const duplicates = h1Lines.slice(1).map(({ index }) => index + 1).join(', ');
    throw new Error(`Invalid Markdown structure in ${filename}: found multiple H1 headings. Additional H1 lines: ${duplicates}. Tutorial pages must use exactly one H1 followed by ## and ### sections.`);
  }
};

let codeGroupCounter = 0;

const renderCodeSampleGroup = (samples, indent = '          ') => {
  codeGroupCounter += 1;
  const groupId = `code-group-${codeGroupCounter}`;

  const tabs = samples
    .map((sample, index) => `${indent}  <button class="code-switcher__tab${index === 0 ? ' is-active' : ''}" type="button" role="tab" aria-selected="${index === 0 ? 'true' : 'false'}" aria-controls="${groupId}-panel-${index}" id="${groupId}-tab-${index}" data-code-tab="${sample.label}" tabindex="${index === 0 ? '0' : '-1'}">${inline(sample.label)}</button>`)
    .join('\n');

  const panels = samples
    .map((sample, index) => `${indent}<pre class="code-panel${index === 0 ? ' is-active' : ''}" id="${groupId}-panel-${index}" role="tabpanel" aria-labelledby="${groupId}-tab-${index}" data-code-panel="${sample.label}"${index === 0 ? '' : ' hidden'}><code class="language-${sample.language || 'text'}">${escapeHtml(sample.code)}</code></pre>`)
    .join('\n');

  return `${indent}<div class="code-block" data-code-group>
${indent}  <div class="code-switcher" role="tablist" aria-label="Code examples">
${tabs}
${indent}  </div>
${panels}
${indent}</div>`;
};

const readCodeFence = (lines, startIndex) => {
  const opening = lines[startIndex].trimEnd();
  if (!opening.startsWith('```')) return null;

  const language = opening.slice(3).trim();
  const codeLines = [];
  let index = startIndex + 1;

  while (index < lines.length) {
    const candidate = lines[index].trimEnd();
    if (candidate.startsWith('```')) {
      return {
        language,
        code: codeLines.join('\n'),
        nextIndex: index + 1,
        isMermaid: language.toLowerCase() === 'mermaid'
      };
    }

    codeLines.push(lines[index]);
    index += 1;
  }

  throw new Error(`Unclosed code fence starting at line ${startIndex + 1}`);
};

const readCodeSamplePair = (lines, startIndex) => {
  const labelLine = lines[startIndex]?.trim();
  const labelMatch = labelLine?.match(/^\*\*(cURL|JavaScript|HTTP|JSON)\*\*$/i);
  if (!labelMatch) return null;

  let index = startIndex + 1;
  while (index < lines.length && !lines[index].trim()) index += 1;

  if (index >= lines.length || !lines[index].trimStart().startsWith('```')) {
    return null;
  }

  const fence = readCodeFence(lines, index);

  return {
    sample: {
      label: labelMatch[1],
      language: fence.language || 'text',
      code: fence.code
    },
    nextIndex: fence.nextIndex
  };
};

const readConsecutiveCodeSamples = (lines, startIndex) => {
  const samples = [];
  let index = startIndex;

  while (index < lines.length) {
    while (index < lines.length && !lines[index].trim()) index += 1;
    const parsed = readCodeSamplePair(lines, index);
    if (!parsed) break;
    samples.push(parsed.sample);
    index = parsed.nextIndex;
    while (index < lines.length && !lines[index].trim()) index += 1;
  }

  if (!samples.length) return null;

  return {
    samples,
    nextIndex: index
  };
};

const renderMarkdown = (lines, page) => {
  const html = [];
  let usesMermaid = false;
  let index = 0;
  let paragraph = [];
  let listItems = [];
  let orderedListItems = [];
  let quoteLines = [];
  let tableRows = [];
  let inSection = false;
  let articleOpen = false;
  let containerStack = [];
  let leadSkipped = false;
  const normalizedLead = (() => {
    const titleIndex = lines.findIndex((line) => line.startsWith('# '));
    if (titleIndex === -1) return '';

    for (let i = titleIndex + 1; i < lines.length; i += 1) {
      const trimmed = lines[i].trim();
      if (!trimmed) continue;
      if (trimmed.startsWith('## ')) break;
      if (trimmed.startsWith('# ')) continue;
      return trimmed;
    }

    return '';
  })();

  const currentIndent = () => {
    const base = articleOpen ? '          ' : '        ';
    return base + '  '.repeat(containerStack.length);
  };

  const flushParagraph = () => {
    if (!paragraph.length) return;

    const text = paragraph.join(' ').trim();
    if (!text) {
      paragraph = [];
      return;
    }

    if (!leadSkipped && normalizedLead && text === normalizedLead) {
      leadSkipped = true;
      paragraph = [];
      return;
    }

    const introMatch = text.match(/^:::\s*intro\s+([\s\S]+?)(?:\s*:::)?$/);
    const metaMatch = text.match(/^:::\s*meta\s+([\s\S]+?)(?:\s*:::)?$/);

    if (introMatch) {
      html.push(`${currentIndent()}<p class="section-intro">${inline(introMatch[1].trim())}</p>`);
    } else if (metaMatch) {
      html.push(`${currentIndent()}<p class="sample-meta">${inline(metaMatch[1].trim())}</p>`);
    } else {
      html.push(`${currentIndent()}<p class="sample-summary">${inline(text)}</p>`);
    }

    paragraph = [];
  };

  const flushList = () => {
    if (listItems.length) {
      if (containerStack.at(-1) === 'actions') {
        const links = listItems.map((item) => {
          const match = item.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
          return match ? { label: match[1], href: match[2] } : null;
        });

        if (links.every(Boolean) && links.length > 0) {
          const markup = links.map((link, index) => (
            `<a class="button-link button-link--${index === 0 ? 'primary' : 'secondary'}" href="${escapeHtml(link.href)}">${inline(link.label)}</a>`
          )).join('');
          html.push(`${currentIndent()}${markup}`);
        } else {
          const markup = `<ul>${listItems.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>`;
          html.push(`${currentIndent()}${markup}`);
        }
      } else {
        const markup = `<ul>${listItems.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>`;
        html.push(`${currentIndent()}${markup}`);
      }
      listItems = [];
    }

    if (orderedListItems.length) {
      const markup = `<ol>${orderedListItems.map((item) => `<li>${inline(item)}</li>`).join('')}</ol>`;
      html.push(`${currentIndent()}${markup}`);
      orderedListItems = [];
    }
  };

  const flushQuote = () => {
    if (!quoteLines.length) return;
    const markup = `<p class="sample-summary"><strong>${inline(quoteLines.join(' · '))}</strong></p>`;
    html.push(`${currentIndent()}${markup}`);
    quoteLines = [];
  };

  const flushTable = () => {
    if (!tableRows.length) return;
    html.push(`${currentIndent()}${table(tableRows)}`);
    tableRows = [];
  };

  const closeContainers = (targetDepth = 0) => {
    flushParagraph();
    flushList();
    flushQuote();
    flushTable();

    while (containerStack.length > targetDepth) {
      if (articleOpen) {
        html.push('        </article>');
        articleOpen = false;
      }

      containerStack.pop();
      html.push(`${currentIndent()}</div>`);
    }
  };

  const closeArticle = () => {
    flushParagraph();
    flushList();
    flushQuote();
    flushTable();

    if (articleOpen) {
      html.push('        </article>');
      articleOpen = false;
    }

    closeContainers();
  };

  const closeSection = () => {
    closeArticle();
    if (inSection) {
      html.push('      </div>');
      html.push('    </section>');
      inSection = false;
    }
  };

  const sectionKickerByType = {
    tutorial: 'Tutorial',
    essay: 'Essay',
    doc: 'Documentation'
  };

  const sectionKicker = sectionKickerByType[page.frontmatter.type] ?? 'Documentation';

  const openSection = (headingText) => {
    closeSection();
    const sectionId = slug(headingText);
    const accentSections = Array.isArray(page.frontmatter.accent_sections) ? page.frontmatter.accent_sections : [];
    const sectionClass = accentSections.includes(sectionId) ? 'section section--accent' : 'section';

    html.push(`    <section class="${sectionClass}" id="${sectionId}">`);
    html.push('      <div class="container">');
    html.push('        <div class="section__header">');
    html.push('          <div>');
    html.push(`            <p class="section-kicker">${sectionKicker}</p>`);
    html.push(`            <h2 class="section-title">${inline(headingText)}</h2>`);
    html.push('          </div>');
    html.push('        </div>');
    inSection = true;
  };

  const openArticle = (headingText, level = 3) => {
    flushParagraph();
    flushList();
    flushQuote();
    flushTable();

    if (articleOpen) {
      html.push('        </article>');
      articleOpen = false;
    }

    html.push(`${currentIndent()}<article class="sample">`);
    html.push(`${currentIndent()}  <div class="sample-header"><div class="sample-heading">`);
    html.push(`${currentIndent()}    <h${level}>${inline(headingText)}</h${level}>`);
    html.push(`${currentIndent()}  </div></div>`);
    articleOpen = true;
  };

  const openContainer = (type) => {
    if (type === 'actions') {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();

      if (articleOpen) {
        html.push('        </article>');
        articleOpen = false;
      }

      closeContainers();
      html.push(`${currentIndent()}<div class="hero__actions">`);
      containerStack.push(type);
      return true;
    }

    if (type === 'case-grid') {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();

      if (articleOpen) {
        html.push('        </article>');
        articleOpen = false;
      }

      closeContainers();
      html.push(`${currentIndent()}<div class="case-grid">`);
      containerStack.push(type);
      return true;
    }

    if (type === 'case-panel') {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();

      if (articleOpen) {
        html.push('        </article>');
        articleOpen = false;
      }

      closeContainers(1);
      html.push(`${currentIndent()}<div class="case-panel">`);
      containerStack.push(type);
      return true;
    }

    return false;
  };

  while (index < lines.length) {
    const rawLine = lines[index];
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    const groupedSamples = readConsecutiveCodeSamples(lines, index);
    if (groupedSamples) {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();

      if (groupedSamples.samples.length === 1) {
        const sample = groupedSamples.samples[0];
        if ((sample.language || '').toLowerCase() === 'mermaid') {
          usesMermaid = true;
          html.push(`${currentIndent()}<div class="mermaid-block"><pre class="mermaid">${renderMermaidCode(sample.code)}</pre></div>`);
        } else {
          html.push(`${currentIndent()}<pre class="code-panel is-active"><code class="language-${sample.language || 'text'}">${escapeHtml(sample.code)}</code></pre>`);
        }
      } else {
        html.push(renderCodeSampleGroup(groupedSamples.samples, currentIndent()));
      }

      index = groupedSamples.nextIndex;
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();
      index += 1;
      continue;
    }

    if (trimmed.startsWith('```')) {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();

      const fence = readCodeFence(lines, index);
      if (fence.isMermaid) {
        usesMermaid = true;
        html.push(`${currentIndent()}<div class="mermaid-block"><pre class="mermaid">${renderMermaidCode(fence.code)}</pre></div>`);
      } else {
        html.push(`${currentIndent()}<pre class="code-panel is-active"><code class="language-${fence.language || 'text'}">${escapeHtml(fence.code)}</code></pre>`);
      }
      index = fence.nextIndex;
      continue;
    }

    if (trimmed === ':::') {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();

      if (articleOpen) {
        html.push('        </article>');
        articleOpen = false;
      }

      closeContainers(Math.max(containerStack.length - 1, 0));
      index += 1;
      continue;
    }

    if (trimmed.startsWith(':::')) {
      const introSingleLine = trimmed.match(/^:::\s*intro\s+([\s\S]+?)(?:\s*:::)?$/);
      if (introSingleLine) {
        flushParagraph();
        flushList();
        flushQuote();
        flushTable();
        html.push(`${currentIndent()}<p class="section-intro">${inline(introSingleLine[1].trim())}</p>`);
        index += 1;
        continue;
      }

      const metaSingleLine = trimmed.match(/^:::\s*meta\s+([\s\S]+?)(?:\s*:::)?$/);
      if (metaSingleLine) {
        flushParagraph();
        flushList();
        flushQuote();
        flushTable();
        html.push(`${currentIndent()}<p class="sample-meta">${inline(metaSingleLine[1].trim())}</p>`);
        index += 1;
        continue;
      }

      flushParagraph();
      flushList();
      flushQuote();
      flushTable();

      const containerName = trimmed.replace(/^:::\s*/, '').trim();
      if (openContainer(containerName)) {
        index += 1;
        continue;
      }
    }

    if (trimmed.startsWith('|')) {
      flushParagraph();
      flushList();
      flushQuote();
      tableRows.push(trimmed);
      index += 1;
      continue;
    }

    if (trimmed.startsWith('> ')) {
      flushParagraph();
      flushList();
      flushTable();
      quoteLines.push(trimmed.slice(2).trim());
      index += 1;
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      flushQuote();
      flushTable();
      orderedListItems.push(trimmed.replace(/^\d+\.\s+/, '').trim());
      index += 1;
      continue;
    }

    if (trimmed.startsWith('- ')) {
      flushParagraph();
      flushQuote();
      flushTable();
      listItems.push(trimmed.slice(2).trim());
      index += 1;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      openArticle(trimmed.slice(4).trim(), 3);
      index += 1;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();
      openSection(trimmed.slice(3).trim());
      index += 1;
      continue;
    }

    if (trimmed.startsWith('# ')) {
      index += 1;
      continue;
    }

    paragraph.push(trimmed);
    index += 1;
  }

  closeSection();
  return {
    html: html.join('\n'),
    usesMermaid
  };
};

const buildPage = async (filename) => {
  const sourcePath = path.join(repoRoot, filename);
  const source = await readFile(sourcePath, 'utf8');
  const { data: frontmatter, content } = parseFrontmatter(source);
  const lines = content.split('\n');
  validatePageStructure(filename, lines);

  const titleLine = lines.find((line) => line.startsWith('# ')) || '# Untitled';
  const title = titleLine.slice(2).trim();

  const firstContentLine = lines.find((line) => {
    const trimmed = line.trim();
    return trimmed && !trimmed.startsWith('#');
  }) || '';

  const lead = firstContentLine.trim();
  const type = frontmatter.type || inferTypeFromFilename(filename);

  const page = {
    type,
    frontmatter
  };

  const rendered = renderMarkdown(lines, page);
  const body = rendered.html;
  const metadata = {
    title: getPageTitle(frontmatter, title),
    description: getPageDescription(frontmatter, lead)
  };

  const renderer = getRenderer(type);
  const html = renderer({
    sourcePath: filename,
    title,
    lead,
    body,
    metadata,
    eyebrow: frontmatter.eyebrow,
    primaryLink: {
      href: frontmatter.primary_link_href || '#overview',
      label: frontmatter.primary_link_label || 'Read page'
    },
    secondaryLink: {
      href: frontmatter.secondary_link_href || 'index.html#samples',
      label: frontmatter.secondary_link_label || 'Back to selected work'
    },
    heroStats: Array.isArray(frontmatter.hero_stats) ? frontmatter.hero_stats : null,
    heroPanel: buildHeroPanel(frontmatter, filename),
    footerTag: frontmatter.footer_tag,
    usesMermaid: rendered.usesMermaid || frontmatter.uses_mermaid === true
  });

  const outputPath = path.join(repoRoot, getOutputPath(filename, frontmatter));
  await writeFile(outputPath, html, 'utf8');
  console.log(`Built ${path.basename(outputPath)} from ${filename}`);
};

const main = async () => {
  const pages = await readMarkdownPages();
  await Promise.all(pages.map((filename) => buildPage(filename)));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
