import { readFile, writeFile } from 'node:fs/promises';

const sourcePath = 'customers-api-tutorial-v2.md';
const outputPath = 'customers-api-tutorial-v2.html';
const source = await readFile(sourcePath, 'utf8');
const lines = source.replace(/\r\n/g, '\n').split('\n');

const escapeHtml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const inline = (value) => escapeHtml(value)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

const slug = (value) => value
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const isTableDivider = (value) => /^\|(?:\s*:?-{2,}:?\s*\|)+$/.test(value);

const table = (rows) => {
  const cells = (row) => row.split('|').slice(1, -1).map((cell) => cell.trim());
  const [head, ...body] = rows.filter((row) => !isTableDivider(row));
  return `<div class="table-wrapper"><table><thead><tr>${cells(head)
    .map((cell) => `<th scope="col">${inline(cell)}</th>`).join('')}</tr></thead><tbody>${body
    .map((row) => `<tr>${cells(row).map((cell) => `<td>${inline(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
};

const firstSection = lines.findIndex((line) => line.startsWith('## '));
const title = lines.find((line) => line.startsWith('# '))?.slice(2).trim();
const lead = lines.slice(0, firstSection)
  .find((line) => line && !line.startsWith('#') && !line.startsWith('[') && !line.startsWith('>'));

if (!title || !lead || firstSection === -1) {
  throw new Error(`${sourcePath} needs a title, an introduction, and at least one level-two heading.`);
}

let body = '';
let sectionOpen = false;
let articleOpen = false;
let index = firstSection;
let codeGroup = 0;

const closeArticle = () => {
  if (articleOpen) {
    body += '        </article>\n';
    articleOpen = false;
  }
};

const closeSection = () => {
  closeArticle();
  if (sectionOpen) {
    body += '      </div>\n    </section>\n';
    sectionOpen = false;
  }
};

while (index < lines.length) {
  const line = lines[index];

  if (line.startsWith('## ')) {
    closeSection();
    const heading = line.slice(3).trim();
    const id = slug(heading);
    body += `    <section class="section${id === 'overview' ? ' section--accent' : ''}" id="${id}">\n      <div class="container">\n        <div class="section__header">\n          <div>\n            <p class="section-kicker">Tutorial</p>\n            <h2 class="section-title">${inline(heading)}</h2>\n          </div>\n        </div>\n        <article class="sample">\n`;
    sectionOpen = true;
    articleOpen = true;
    index += 1;
    continue;
  }

  if (line.startsWith('### ')) {
    body += `          <div class="sample-header"><div class="sample-heading"><h3>${inline(line.slice(4).trim())}</h3></div></div>\n`;
    index += 1;
    continue;
  }

  if (line.startsWith('#### ')) {
    const firstExample = line.slice(5).trim().match(/^(cURL|JavaScript) - (.+)$/);
    let codeStart = index + 1;
    while (lines[codeStart] === '') codeStart += 1;

    if (firstExample && lines[codeStart]?.startsWith('```')) {
      const firstCode = [];
      let cursor = codeStart + 1;
      const firstLanguage = lines[codeStart].slice(3).trim() || 'text';

      while (cursor < lines.length && !lines[cursor].startsWith('```')) {
        firstCode.push(lines[cursor]);
        cursor += 1;
      }

      cursor += 1;
      while (lines[cursor] === '') cursor += 1;
      const secondExample = lines[cursor]?.startsWith('#### ')
        ? lines[cursor].slice(5).trim().match(/^(cURL|JavaScript) - (.+)$/)
        : null;

      let secondCodeStart = cursor + 1;
      while (lines[secondCodeStart] === '') secondCodeStart += 1;
      if (secondExample && secondExample[2] === firstExample[2] && lines[secondCodeStart]?.startsWith('```')) {
        const secondCode = [];
        const secondLanguage = lines[secondCodeStart].slice(3).trim() || 'text';
        cursor = secondCodeStart + 1;
        while (cursor < lines.length && !lines[cursor].startsWith('```')) {
          secondCode.push(lines[cursor]);
          cursor += 1;
        }
        if (cursor === lines.length) throw new Error(`Unclosed code fence in ${sourcePath}.`);

        const groupId = `code-group-${codeGroup += 1}`;
        body += `          <div class="code-switcher" data-code-group>\n            <div class="code-tabs" role="tablist" aria-label="Code examples for ${inline(firstExample[2])}">\n              <button class="code-tab is-active" type="button" role="tab" id="${groupId}-curl" aria-selected="true" aria-controls="${groupId}-curl-panel" data-code-tab="curl">cURL</button>\n              <button class="code-tab" type="button" role="tab" id="${groupId}-javascript" aria-selected="false" aria-controls="${groupId}-javascript-panel" tabindex="-1" data-code-tab="javascript">JavaScript</button>\n            </div>\n            <pre class="code-panel is-active" id="${groupId}-curl-panel" role="tabpanel" aria-labelledby="${groupId}-curl" data-code-panel="curl"><code class="language-${escapeHtml(firstLanguage)}">${escapeHtml(firstCode.join('\n'))}</code></pre>\n            <pre class="code-panel" id="${groupId}-javascript-panel" role="tabpanel" aria-labelledby="${groupId}-javascript" data-code-panel="javascript" hidden><code class="language-${escapeHtml(secondLanguage)}">${escapeHtml(secondCode.join('\n'))}</code></pre>\n          </div>\n`;
        index = cursor + 1;
        continue;
      }
    }

    body += `          <h4>${inline(line.slice(5).trim())}</h4>\n`;
    index += 1;
    continue;
  }

  if (line.startsWith('```')) {
    const language = line.slice(3).trim() || 'text';
    const code = [];
    index += 1;
    while (index < lines.length && !lines[index].startsWith('```')) {
      code.push(lines[index]);
      index += 1;
    }
    if (index === lines.length) throw new Error(`Unclosed code fence in ${sourcePath}.`);
    body += `          <pre class="code-panel is-active"><code class="language-${escapeHtml(language)}">${escapeHtml(code.join('\n'))}</code></pre>\n`;
    index += 1;
    continue;
  }

  if (line.startsWith('|')) {
    const rows = [];
    while (index < lines.length && lines[index].startsWith('|')) {
      rows.push(lines[index]);
      index += 1;
    }
    body += `          ${table(rows)}\n`;
    continue;
  }

  if (line.startsWith('- ')) {
    const items = [];
    while (index < lines.length && lines[index].startsWith('- ')) {
      items.push(lines[index].slice(2));
      index += 1;
    }
    body += `          <ul>${items.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>\n`;
    continue;
  }

  if (/^\d+\. /.test(line)) {
    const items = [];
    while (index < lines.length && /^\d+\. /.test(lines[index])) {
      items.push(lines[index].replace(/^\d+\. /, ''));
      index += 1;
    }
    body += `          <ol>${items.map((item) => `<li>${inline(item)}</li>`).join('')}</ol>\n`;
    continue;
  }

  if (line.startsWith('> ')) {
    body += `          <p class="sample-summary"><strong>${inline(line.slice(2).trim())}</strong></p>\n`;
    index += 1;
    continue;
  }

  if (line) {
    const paragraph = [line];
    index += 1;
    while (index < lines.length && lines[index] && !/^(#{2,4} |```|\||- |\d+\. |> )/.test(lines[index])) {
      paragraph.push(lines[index]);
      index += 1;
    }
    body += `          <p class="sample-summary">${inline(paragraph.join(' '))}</p>\n`;
    continue;
  }

  index += 1;
}

closeSection();

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Customers API tutorial — Developer documentation sample (Piotr Oszenda)</title>
  <meta name="description" content="Hands-on API tutorial showing how to create, retrieve, update, and delete customer records with a fictional Customers API.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <!-- Generated from ${sourcePath}. Run npm run build after editing the source. -->
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="container site-header__inner">
      <a class="brand" href="index.html#top" aria-label="Go to homepage"><span class="brand__mark" aria-hidden="true">PO</span><span>Piotr Oszenda</span></a>
      <nav class="main-nav" aria-label="Primary">
        <a href="index.html#work">Work</a><a href="index.html#approach">Approach</a><a href="index.html#experience">Experience</a><a href="index.html#samples">Samples</a><a href="index.html#contact">Contact</a>
      </nav>
    </div>
  </header>
  <main id="main" tabindex="-1">
    <section class="hero" id="top">
      <div class="container hero__grid">
        <div>
          <p class="eyebrow">Developer documentation sample</p>
          <h1>${inline(title)}</h1>
          <p class="hero__lead">${inline(lead)}</p>
          <div class="hero__actions"><a class="button-link button-link--primary" href="#what-this-tutorial-demonstrates">Read tutorial</a><a class="button-link button-link--secondary" href="index.html#samples">Back to selected work</a></div>
        </div>
        <aside class="hero-panel" aria-labelledby="sample-proof-title">
          <p class="hero-panel__label" id="sample-proof-title">Build status</p>
          <ul class="proof-list"><li><strong>Markdown source</strong><span>${sourcePath}</span></li><li><strong>Generated HTML</strong><span>Built locally before publication.</span></li><li><strong>Checked output</strong><span>Source markers and local links are validated in CI.</span></li></ul>
        </aside>
      </div>
    </section>
${body}  </main>
  <footer class="site-footer"><div class="container site-footer__inner"><span>Piotr Oszenda — Technical Writer · Knowledge Manager · Documentation Architect</span><span>Built from Markdown source</span></div></footer>
  <script>
    document.querySelectorAll('[data-code-group]').forEach((group) => {
      const tabs = Array.from(group.querySelectorAll('[data-code-tab]'));
      const panels = Array.from(group.querySelectorAll('[data-code-panel]'));
      tabs.forEach((tab) => tab.addEventListener('click', () => {
        const selected = tab.dataset.codeTab;
        tabs.forEach((item) => {
          const active = item === tab;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-selected', String(active));
          item.tabIndex = active ? 0 : -1;
        });
        panels.forEach((panel) => {
          const active = panel.dataset.codePanel === selected;
          panel.classList.toggle('is-active', active);
          panel.toggleAttribute('hidden', !active);
        });
      }));
    });
  </script>
</body>
</html>
`;

await writeFile(outputPath, html);
console.log(`Built ${outputPath} from ${sourcePath}.`);
